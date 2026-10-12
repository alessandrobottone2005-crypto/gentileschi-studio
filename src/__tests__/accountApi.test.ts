import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/account';
import {
  aiLimits,
  dailyLimit,
  quotaDay,
  quotaSummary,
} from '../../server/aiLimits';

const state = vi.hoisted(() => ({
  auth: vi.fn(),
  usage: vi.fn(),
  consumed: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: state.auth },
    rpc: state.consumed,
    from: () => ({
      select: () => ({
        eq: (_field: string, day: string) => ({
          in: (_field: string, keys: string[]) => state.usage(day, keys),
        }),
      }),
    }),
  }),
}));
function response() {
  const result = {
    code: 0,
    body: {} as any,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.code = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return result;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public');
  vi.stubEnv('SUPABASE_SERVER_KEY', 'private-test-key');
  vi.stubEnv('AI_USER_DAILY_LIMIT', '20');
  vi.stubEnv('AI_GLOBAL_DAILY_LIMIT', '500');
  state.auth.mockResolvedValue({
    data: { user: { id: 'current-user' } },
    error: null,
  });
  state.usage.mockResolvedValue({
    data: [
      { quota_key: 'user:current-user', used: 7 },
      { quota_key: 'global', used: 499 },
    ],
    error: null,
  });
});
describe('account quota API', () => {
  it('requires authentication and does not query usage without it', async () => {
    const res = response();
    await handler({ method: 'GET', headers: {} } as any, res as any);
    expect(res.code).toBe(401);
    expect(state.auth).not.toHaveBeenCalled();
    expect(state.usage).not.toHaveBeenCalled();
  });
  it('rejects invalid sessions', async () => {
    state.auth.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid'),
    });
    const res = response();
    await handler(
      { method: 'GET', headers: { authorization: 'Bearer expired' } } as any,
      res as any,
    );
    expect(res.code).toBe(401);
    expect(state.usage).not.toHaveBeenCalled();
  });
  it('reads only the authenticated account quota, includes shared availability and never consumes quota', async () => {
    const res = response();
    await handler(
      {
        method: 'GET',
        headers: { authorization: 'Bearer session' },
        query: { userId: 'someone-else' },
      } as any,
      res as any,
    );
    expect(res.code).toBe(200);
    expect(res.body).toMatchObject({
      used: 7,
      limit: 20,
      remaining: 13,
      available: 1,
    });
    expect(state.usage).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      ['user:current-user', 'global'],
    );
    expect(state.consumed).not.toHaveBeenCalled();
    expect(res.headers['Cache-Control']).toBe('private, no-store');
  });
  it('reports a read failure as an error, not zero consumption', async () => {
    state.usage.mockResolvedValue({
      data: null,
      error: new Error('Database unavailable'),
    });
    const res = response();
    await handler(
      { method: 'GET', headers: { authorization: 'Bearer session' } } as any,
      res as any,
    );
    expect(res.code).toBe(503);
    expect(res.body).not.toHaveProperty('used');
  });
  it('reports no usage when a successful query has no row for today', async () => {
    state.usage.mockResolvedValue({ data: [], error: null });
    const res = response();
    await handler(
      { method: 'GET', headers: { authorization: 'Bearer session' } } as any,
      res as any,
    );
    expect(res.body).toMatchObject({ used: 0, remaining: 20, available: 20 });
  });
  it('only allows GET', async () => {
    const res = response();
    await handler(
      { method: 'POST', headers: { authorization: 'Bearer session' } } as any,
      res as any,
    );
    expect(res.code).toBe(405);
    expect(state.auth).not.toHaveBeenCalled();
  });
});
describe('quota boundaries', () => {
  it('uses the same configurable limits as generation', () => {
    vi.stubEnv('AI_USER_DAILY_LIMIT', '9');
    expect(aiLimits().userLimit).toBe(9);
  });
  it.each(['0', '-1', 'NaN', '2.5', ''])(
    'ignores invalid limit %s',
    (value) => {
      expect(dailyLimit(value, 20)).toBe(20);
    },
  );
  it('resets at next UTC midnight across year boundaries', () => {
    expect(quotaDay(new Date('2026-12-31T23:59:59Z'))).toEqual({
      day: '2026-12-31',
      resetsAt: '2027-01-01T00:00:00.000Z',
    });
  });
  it('clamps exhausted limits', () => {
    expect(quotaSummary(25, 501, 20, 500)).toEqual({
      used: 25,
      limit: 20,
      remaining: 0,
      available: 0,
    });
  });
});
