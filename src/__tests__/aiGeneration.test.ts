import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiRequest, ApiResponse } from '../../server/http';
import { isValidEventDate } from '../shared/composition/dateUtils';
import { INVALID_CAROUSEL_MESSAGE } from '../features/editor/services/ai/schemas';
import handler from '../../api/ai/generate';

const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ auth: { getUser }, rpc })) }));

const fetchMock = vi.fn();
const prompt = 'Assemblea del 12 gennaio. Discutiamo le proposte degli studenti.';
const eventDate = '2028-02-29';
function draft() {
  return {
    projectTitle: 'Assemblea',
    slides: [
      { templateType: 'cover', content: { title: 'ASSEMBLEA', day: '29 febbraio 2028', month: 'GENNAIO', timeSlot: 'ORARIO DA CONFERMARE' } },
      { templateType: 'agenda', content: { title: 'O.D.G.', subtitle: 'ORDINE DEL GIORNO', items: [{ id: '1', number: '01', text: 'Proposte degli studenti', isHighlight: false }] } },
      { templateType: 'notice', content: { title: 'IMPORTANTE', highlightQuantity: 'TUTTI', highlightLabel: 'GLI STUDENTI', badgeText: 'ASSEMBLEA', paragraph1: 'Parliamo delle proposte.', paragraph2: 'Orario da confermare.', ctaText: 'PARTECIPA' } },
    ],
    missingInformation: ['Orario da confermare'], caption: 'Assemblea il 29 febbraio 2028.',
  };
}
function providerText(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
}
async function request(body: unknown, authorization: string | undefined = 'Bearer test-session') {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  await handler({ method: 'POST', body, headers: { authorization } } as ApiRequest, res as unknown as ApiResponse);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVER_KEY', 'GEMINI_API_KEY']) vi.stubEnv(name, 'test-value');
  vi.stubEnv('AI_USER_DAILY_LIMIT', '20');
  vi.stubEnv('AI_GLOBAL_DAILY_LIMIT', '500');
  getUser.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null });
  rpc.mockResolvedValue({ data: true, error: null });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('AI event date', () => {
  it.each(['', '2026-02-29', '2028-02-30', '2026-04-31', '2026-13-01', '0000-01-01', '2026-1-02', '1900-02-29'])('rejects impossible or incomplete date %s', (value) => {
    expect(isValidEventDate(value)).toBe(false);
  });
  it.each(['2028-02-29', '2000-02-29', '2026-11-20', '0001-01-01'])('accepts real calendar date %s', (value) => {
    expect(isValidEventDate(value)).toBe(true);
  });
  it.each([undefined, '', '2026-02-29'])('rejects invalid request before quota or provider calls (%s)', async (date) => {
    const result = await request({ mode: 'carousel', prompt, eventDate: date });
    expect(result).toEqual({ status: 400, body: { error: 'Scegli una data dell’evento valida prima di generare.' } });
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('AI generation endpoint', () => {
  it('replaces an overlong model day and wrong month on every cover with the selected date', async () => {
    const generated = draft();
    generated.slides.push({ ...generated.slides[0] });
    fetchMock.mockResolvedValueOnce(providerText(JSON.stringify(generated)));
    const result = await request({ mode: 'carousel', prompt, eventDate });
    expect(result.status).toBe(200);
    for (const slide of result.body.slides.filter((s: { templateType: string }) => s.templateType === 'cover')) {
      expect(slide.content).toMatchObject({ day: '29', month: 'FEBBRAIO' });
    }
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0][1];
    const providerBody = JSON.parse(options.body);
    expect(providerBody.generationConfig.responseJsonSchema.properties.slides.items.anyOf).toHaveLength(3);
    expect(providerBody.contents[0].parts[0].text).toContain(eventDate);
    expect(fetchMock.mock.calls[0][0]).not.toContain('test-value');
  });
  it.each(['not JSON', JSON.stringify({ ...draft(), slides: [{ templateType: 'agenda', content: { items: [] } }] })])('repairs invalid output once within one quota request', async (invalidOutput) => {
    fetchMock.mockResolvedValueOnce(providerText(invalidOutput)).mockResolvedValueOnce(providerText(JSON.stringify(draft())));
    const result = await request({ mode: 'carousel', prompt, eventDate });
    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).contents[0].parts[0].text).toContain('Rigenera la bozza completa');
    const logs = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logs).not.toContain(prompt);
    expect(logs).not.toContain('test-value');
    expect(logs).not.toContain(invalidOutput);
  });
  it('stops after one failed repair and returns a readable error', async () => {
    fetchMock.mockImplementation(async () => providerText(JSON.stringify({ slides: [] })));
    expect(await request({ mode: 'carousel', prompt, eventDate })).toEqual({ status: 502, body: { error: INVALID_CAROUSEL_MESSAGE } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('rejects a missing session before quota and generation', async () => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    await handler({ method: 'POST', body: { mode: 'carousel', prompt, eventDate }, headers: {} } as ApiRequest, res as unknown as ApiResponse);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rejects an expired session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Expired' } });
    expect((await request({ mode: 'carousel', prompt, eventDate })).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects exhausted quota without calling Gemini', async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await request({ mode: 'carousel', prompt, eventDate })).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('keeps caption generation independent of the date input', async () => {
    fetchMock.mockResolvedValueOnce(providerText('Vi aspettiamo all’assemblea.'));
    expect(await request({ mode: 'caption', projectTitle: 'Assemblea', slidesSummary: 'Proposte studenti' }))
      .toEqual({ status: 200, body: { caption: 'Vi aspettiamo all’assemblea.' } });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.responseJsonSchema).toBeUndefined();
  });
  it('does not expose unexpected network error details', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Private provider details test-value'));
    expect(await request({ mode: 'carousel', prompt, eventDate })).toEqual({ status: 502, body: { error: 'Generazione non riuscita. Riprova.' } });
  });
  it('uses the configured fallback model when the primary provider is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(providerText(JSON.stringify(draft())));
    expect((await request({ mode: 'carousel', prompt, eventDate })).status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toContain('gemini-3.8-flash');
    expect(fetchMock.mock.calls[1][0]).toContain('gemini-3.6-flash');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
