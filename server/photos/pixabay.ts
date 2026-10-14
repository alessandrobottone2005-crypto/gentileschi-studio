import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const photoSearchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  orientation: z.enum(["all", "horizontal", "vertical"]).default("all"),
  page: z.coerce.number().int().min(1).max(25).default(1),
});
export interface PixabayHit {
  id: number;
  pageURL: string;
  user: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  tags: string;
}
export class PhotoApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export function safePixabayUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !(
      url.hostname === "pixabay.com" || url.hostname.endsWith(".pixabay.com")
    ) ||
    url.username ||
    url.password
  )
    throw new PhotoApiError(502, "Indirizzo fotografia non valido.");
  return url;
}
export async function limitedImageDownload(
  url: string,
): Promise<{ bytes: Uint8Array; mime: string }> {
  let target = safePixabayUrl(url);
  let response: Response | undefined;
  for (let redirects = 0; redirects < 4; redirects++) {
    response = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      target = safePixabayUrl(
        new URL(response.headers.get("location") || "", target).href,
      );
      continue;
    }
    break;
  }
  if (!response?.ok || !response.body)
    throw new PhotoApiError(
      502,
      "La fotografia non è più disponibile. Ripeti la ricerca.",
    );
  const mime = (response.headers.get("content-type") || "").split(";")[0];
  if (!["image/png", "image/jpeg", "image/webp"].includes(mime))
    throw new PhotoApiError(502, "Formato fotografia non supportato.");
  const maximum = 10 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > maximum)
    throw new PhotoApiError(413, "La fotografia supera 10 MB.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum)
        throw new PhotoApiError(413, "La fotografia supera 10 MB.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { bytes, mime };
}
export function photoClients() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const secret =
    process.env.SUPABASE_SERVER_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !secret || !process.env.PIXABAY_API_KEY)
    throw new PhotoApiError(
      503,
      "Pixabay non è ancora configurato. Puoi usare Caricamenti e la libreria dello studio.",
    );
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return {
    auth: createClient(url, anon, options),
    cache: createClient(url, secret, options),
    url,
    anon,
  };
}
export async function cachedSearch(
  cache: SupabaseClient,
  params: Record<string, string>,
): Promise<{ totalHits: number; hits: PixabayHit[] }> {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const key = new URLSearchParams(sorted).toString();
  const stored = await cache
    .from("pixabay_search_cache")
    .select("response,expires_at")
    .eq("key", key)
    .maybeSingle();
  if (stored.error)
    throw new PhotoApiError(
      503,
      "Libreria fotografica non disponibile. Riprova più tardi.",
    );
  if (stored.data && Date.parse(stored.data.expires_at) > Date.now())
    return stored.data.response;
  const quota = await cache.rpc("consume_pixabay_request");
  if (quota.error)
    throw new PhotoApiError(
      503,
      "Ricerca fotografica temporaneamente non disponibile.",
    );
  if (!quota.data)
    throw new PhotoApiError(429, "Troppe ricerche. Riprova tra un minuto.", 60);
  const url = new URL("https://pixabay.com/api/");
  url.search = new URLSearchParams({
    ...params,
    key: process.env.PIXABAY_API_KEY!,
    lang: "it",
    image_type: "photo",
    safesearch: "true",
    per_page: "20",
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (response.status === 429)
    throw new PhotoApiError(
      429,
      "Pixabay ha raggiunto il limite di ricerche. Riprova tra un minuto.",
      60,
    );
  if (!response.ok)
    throw new PhotoApiError(502, "Pixabay non risponde. Riprova più tardi.");
  const raw = await response.json();
  if (!Array.isArray(raw.hits) || typeof raw.totalHits !== "number")
    throw new PhotoApiError(502, "Risposta Pixabay non valida.");
  const result = {
    totalHits: raw.totalHits,
    hits: raw.hits.map((h: PixabayHit) => ({
      id: h.id,
      pageURL: h.pageURL,
      user: h.user,
      previewURL: h.previewURL,
      webformatURL: h.webformatURL,
      largeImageURL: h.largeImageURL,
      imageWidth: h.imageWidth,
      imageHeight: h.imageHeight,
      tags: h.tags,
    })),
  };
  const saved = await cache
    .from("pixabay_search_cache")
    .upsert({
      key,
      response: result,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
  if (saved.error)
    throw new PhotoApiError(
      503,
      "Impossibile conservare la ricerca. Riprova più tardi.",
    );
  return result;
}
