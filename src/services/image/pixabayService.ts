import { supabase } from "../supabase/supabaseClient";
import { loadMedia } from "./mediaStore";
import type { SlideImage } from "../../types/template";
export interface StockPhoto {
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
export class PhotoServiceError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function checkPhotoLibrary(
  signal?: AbortSignal,
): Promise<{ available: boolean }> {
  return request("/api/photos?status=1", { signal });
}
async function request(url: string, options: RequestInit = {}) {
  const token = supabase
    ? (await supabase.auth.getSession()).data.session?.access_token
    : undefined;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new PhotoServiceError("Libreria fotografica non disponibile.", 503);
  }
  if (!response.ok)
    throw new PhotoServiceError(
      payload.error || "Ricerca non riuscita.",
      response.status,
    );
  return payload;
}
export async function searchPhotos(
  query: string,
  orientation: string,
  page: number,
  signal?: AbortSignal,
): Promise<{ hits: StockPhoto[]; totalHits: number }> {
  return request(
    "/api/photos?" +
      new URLSearchParams({ q: query, orientation, page: String(page) }),
    { signal },
  );
}
export async function importPhoto(
  photo: StockPhoto,
  signal?: AbortSignal,
): Promise<SlideImage> {
  const saved = await request("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: photo.id }),
    signal,
  });
  const url = await loadMedia(saved.storagePath);
  return {
    ...saved,
    url,
    originalUrl: url,
    originalStoragePath: saved.storagePath,
  };
}
