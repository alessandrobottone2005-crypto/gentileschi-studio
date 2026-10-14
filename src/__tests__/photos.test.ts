import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cachedSearch,
  limitedImageDownload,
  photoSearchSchema,
  safePixabayUrl,
  PhotoApiError,
} from "../../server/photos/pixabay";
import { tonePixel, GENTILESCHI_EFFECT } from "../features/media/services/photoEffects";
import { officialThemes } from "../features/themes/model/themes";
import { allNodes } from "../shared/composition/scene";
import { SCENE_ASSETS } from "../shared/composition/sceneAssets";
const hit = {
  id: 42,
  pageURL: "https://pixabay.com/photos/42",
  user: "Autore",
  webformatURL: "https://pixabay.com/get/42.jpg",
  previewURL: "https://cdn.pixabay.com/42.jpg",
  largeImageURL: "https://pixabay.com/get/42large.jpg",
  imageWidth: 1200,
  imageHeight: 1600,
  tags: "scuola",
};
function cache(response?: unknown, quota = true) {
  return {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: response
              ? {
                  response,
                  expires_at: new Date(Date.now() + 86400000).toISOString(),
                }
              : null,
            error: null,
          }),
        }),
      }),
      upsert: vi.fn(async () => ({ error: null })),
    })),
    rpc: vi.fn(async () => ({ data: quota, error: null })),
  } as any;
}
beforeEach(() => {
  vi.stubEnv("PIXABAY_API_KEY", "test-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Pixabay provider boundary", () => {
  it("validates Italian searches, orientation and bounded pages", () => {
    expect(photoSearchSchema.parse({ q: " scuola " })).toEqual({
      q: "scuola",
      orientation: "all",
      page: 1,
    });
    expect(photoSearchSchema.safeParse({ q: "x", page: 26 }).success).toBe(
      false,
    );
    expect(photoSearchSchema.safeParse({ q: "x".repeat(101) }).success).toBe(
      false,
    );
  });
  it("uses the durable 24-hour cache without upstream requests", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      await cachedSearch(cache({ totalHits: 1, hits: [hit] }), { q: "scuola" }),
    ).toEqual({ totalHits: 1, hits: [hit] });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends safe Italian photo queries and stores a durable cache", async () => {
    const fetch = vi.fn(
      async (_url: URL) =>
        new Response(JSON.stringify({ totalHits: 1, hits: [hit] })),
    );
    vi.stubGlobal("fetch", fetch);
    const c = cache();
    expect(
      (await cachedSearch(c, { q: "scuola", page: "1" })).hits[0].user,
    ).toBe("Autore");
    const url = new URL(fetch.mock.calls[0][0] as unknown as string);
    expect(url.searchParams.get("safesearch")).toBe("true");
    expect(url.searchParams.get("lang")).toBe("it");
    expect(url.searchParams.get("image_type")).toBe("photo");
    expect(c.rpc).toHaveBeenCalledWith("consume_pixabay_request");
  });
  it("does not request Pixabay if cache storage is unavailable", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const c = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ error: new Error("missing table") }),
          }),
        }),
      }),
    };
    await expect(cachedSearch(c as any, { q: "scuola" })).rejects.toMatchObject(
      { status: 503 },
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("propagates quota and provider 429 failures without leaking provider bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("key-secret", { status: 429 })),
    );
    await expect(cachedSearch(cache(), { q: "scuola" })).rejects.toMatchObject({
      status: 429,
      retryAfter: 60,
    });
    await expect(
      cachedSearch(cache(undefined, false), { q: "scuola" }),
    ).rejects.toMatchObject({ status: 429 });
  });
  it("accepts only HTTPS provider hosts, including every redirect", async () => {
    expect(safePixabayUrl("https://cdn.pixabay.com/a.jpg").hostname).toBe(
      "cdn.pixabay.com",
    );
    for (const url of [
      "http://pixabay.com/a",
      "https://pixabay.com.evil/a",
      "https://localhost/a",
      "https://user:pass@pixabay.com/a",
    ])
      expect(() => safePixabayUrl(url)).toThrow();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(null, {
            status: 302,
            headers: { Location: "http://127.0.0.1/private" },
          }),
      ),
    );
    await expect(
      limitedImageDownload("https://pixabay.com/a.jpg"),
    ).rejects.toThrow();
  });
  it("downloads actual image bytes and rejects unsupported or oversized files", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-type": "image/png" },
          }),
      ),
    );
    expect(await limitedImageDownload("https://pixabay.com/a")).toEqual({
      bytes: new Uint8Array([1, 2, 3]),
      mime: "image/png",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("x", { headers: { "content-type": "text/html" } }),
      ),
    );
    await expect(
      limitedImageDownload("https://pixabay.com/a"),
    ).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("x", {
            headers: {
              "content-type": "image/png",
              "content-length": String(11 * 1024 * 1024),
            },
          }),
      ),
    );
    await expect(
      limitedImageDownload("https://pixabay.com/a"),
    ).rejects.toMatchObject({ status: 413 });
  });
});
describe("theme and effect assets", () => {
  it("contains thirteen real sets and all thirty-nine original slide roles", () => {
    const themes = officialThemes();
    expect(themes).toHaveLength(13);
    for (const theme of themes)
      expect(theme.slides.map((s) => s.templateType)).toEqual([
        "cover",
        "agenda",
        "notice",
      ]);
    for (const theme of themes.slice(1))
      for (const slide of theme.slides) {
        expect(slide.scene?.width).toBe(1080);
        for (const node of allNodes(slide.scene!.nodes))
          if (node.media?.assetId)
            expect(SCENE_ASSETS[node.media.assetId]).toBeTruthy();
        expect(slide.content.image?.assetId).toBeTruthy();
      }
  });
  it("preserves luminance and bounded channels while varying halftone density", () => {
    const plain = { ...GENTILESCHI_EFFECT, contrast: 1, halftone: 0 };
    expect(tonePixel(100, 100, 100, 0, 0, plain)).toEqual([100, 100, 100]);
    const dark = tonePixel(0, 0, 0, 2, 2, GENTILESCHI_EFFECT);
    const light = tonePixel(255, 255, 255, 0, 0, GENTILESCHI_EFFECT);
    expect(dark[0]).toBeLessThan(light[0]);
    expect(dark[0]).toBe(dark[1]);
  });
});
