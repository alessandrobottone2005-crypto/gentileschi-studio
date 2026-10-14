import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDevApiMiddleware } from '../../server/devApi';

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
});

async function serve(fail = false) {
  const loader = vi.fn(async (file: string) => ({
    default: (req: any, res: any) => {
      if (fail) throw new Error('Private provider details must stay private');
      res.status(200).json({ file, body: req.body, query: req.query, auth: req.headers.authorization });
    },
  }));
  const middleware = createDevApiMiddleware(loader);
  const server = createServer((req, res) => {
    void middleware(req, res, () => { res.statusCode = 404; res.end(); });
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, loader };
}

describe('local API parity', () => {
  it.each(['/api/photos', '/api/account', '/api/ai/generate'])('dispatches %s preserving authentication and query', async (route) => {
    const { url } = await serve();
    const response = await fetch(`${url}${route}?status=1`, { headers: { Authorization: 'Bearer fixture' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ file: `${route}.ts`, body: {}, query: { status: '1' }, auth: 'Bearer fixture' });
  });

  it('accepts long UTF-8 AI input rather than the former 1 KiB photo-only limit', async () => {
    const { url } = await serve();
    const body = { mode: 'caption', projectTitle: 'Assemblea', slidesSummary: 'È'.repeat(12000) };
    const response = await fetch(`${url}/api/ai/generate`, { method: 'POST', body: JSON.stringify(body) });
    expect(response.status).toBe(200);
    expect((await response.json()).body).toEqual(body);
  });

  it('rejects malformed and oversized JSON before running a handler', async () => {
    const { url, loader } = await serve();
    const malformed = await fetch(`${url}/api/photos`, { method: 'POST', body: '{' });
    expect(malformed.status).toBe(400);
    const oversized = await fetch(`${url}/api/ai/generate`, { method: 'POST', body: JSON.stringify({ prompt: 'é'.repeat(33000) }) });
    expect(oversized.status).toBe(413);
    expect(loader).not.toHaveBeenCalled();
  });

  it('does not swallow unrelated paths or disclose unexpected server errors', async () => {
    const { url, loader } = await serve(true);
    expect((await fetch(`${url}/api/photos/other`)).status).toBe(404);
    expect(loader).not.toHaveBeenCalled();
    const response = await fetch(`${url}/api/photos`);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Private');
  });
});
