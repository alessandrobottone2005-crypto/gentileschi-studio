import { beforeEach, afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  user: { id: "editor" } as any,
  stored: null as any,
  quota: true,
  ready: true,
  uploads: [] as any[],
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: state.user },
        error: state.user ? null : new Error("expired"),
      })),
    },
    from: () => ({
      select: () => ({
        limit: async () => ({
          error: state.ready ? null : new Error("missing cache"),
        }),
        eq: () => ({
          maybeSingle: async () => ({ data: state.stored, error: null }),
        }),
      }),
      upsert: async () => ({ error: null }),
    }),
    rpc: async () => ({ data: state.quota, error: null }),
    storage: {
      from: () => ({
        upload: async (...args: any[]) => {
          state.uploads.push(args);
          return { error: null };
        },
      }),
    },
  }),
}));
import handler from "../../api/photos";
function response() {
  const r: any = {
    code: 200,
    body: null,
    headers: {},
    status(n: number) {
      this.code = n;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
    setHeader(k: string, v: any) {
      this.headers[k] = v;
    },
  };
  return r;
}
beforeEach(() => {
  for (const [k, v] of Object.entries({
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVER_KEY: "server",
    PIXABAY_API_KEY: "private-key",
  }))
    vi.stubEnv(k, v);
  state.user = { id: "editor" };
  state.stored = null;
  state.quota = true;
  state.ready = true;
  state.uploads = [];
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("rejects unauthenticated and expired sessions before querying Pixabay", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  let res = response();
  await handler(
    { method: "GET", query: { q: "scuola" }, headers: {} } as any,
    res,
  );
  expect(res.code).toBe(401);
  state.user = null;
  res = response();
  await handler(
    {
      method: "GET",
      query: { q: "scuola" },
      headers: { authorization: "Bearer expired" },
    } as any,
    res,
  );
  expect(res.code).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
it("does not permit client-supplied photo URLs and preserves provider attribution on import", async () => {
  const hit = {
    id: 42,
    pageURL: "https://pixabay.com/photos/42",
    user: "Autore",
    largeImageURL: "https://cdn.pixabay.com/a.png",
  };
  state.stored = {
    response: { totalHits: 1, hits: [hit] },
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };
  const fetch = vi.fn(
    async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const res = response();
  await handler(
    {
      method: "POST",
      body: { id: 42, url: "http://localhost/private" },
      headers: { authorization: "Bearer valid" },
    } as any,
    res,
  );
  expect(res.code).toBe(200);
  expect(fetch).toHaveBeenCalledWith(
    expect.objectContaining({ hostname: "cdn.pixabay.com" }),
    expect.anything(),
  );
  expect(res.body).toMatchObject({
    source: { provider: "pixabay", id: 42, author: "Autore" },
  });
  expect(res.body.storagePath).toMatch(/^cloud:/);
  expect(state.uploads[0][2].metadata.source.author).toBe("Autore");
  expect(JSON.stringify(res.body)).not.toContain("private-key");
});
it("returns a clear unavailable state if the provider key is missing", async () => {
  vi.stubEnv("PIXABAY_API_KEY", "");
  const res = response();
  await handler(
    {
      method: "GET",
      query: { q: "scuola" },
      headers: { authorization: "Bearer valid" },
    } as any,
    res,
  );
  expect(res.code).toBe(503);
  expect(res.body.error).toMatch(/Caricamenti/);
});
it("rejects invalid photo identifiers and arbitrary query pages", async () => {
  for (const request of [
    { method: "POST", body: { id: 0 } },
    { method: "GET", query: { q: "scuola", page: 999 } },
  ]) {
    const res = response();
    await handler(
      { ...request, headers: { authorization: "Bearer valid" } } as any,
      res,
    );
    expect(res.code).toBe(400);
  }
});

it("checks authenticated library readiness without consuming an upstream request", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  let res = response();
  await handler(
    {
      method: "GET",
      query: { status: "1" },
      headers: { authorization: "Bearer valid" },
    } as any,
    res,
  );
  expect(res.code).toBe(200);
  expect(res.body.available).toBe(true);
  state.ready = false;
  res = response();
  await handler(
    {
      method: "GET",
      query: { status: "1" },
      headers: { authorization: "Bearer valid" },
    } as any,
    res,
  );
  expect(res.code).toBe(503);
  expect(res.body.error).toMatch(/Caricamenti/);
  expect(fetch).not.toHaveBeenCalled();
});
