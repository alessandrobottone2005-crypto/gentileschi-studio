import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  photoClients,
  photoSearchSchema,
  cachedSearch,
  limitedImageDownload,
  PhotoApiError,
} from "../server/photos/pixabay.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!["GET", "POST"].includes(req.method || ""))
    return res.status(405).json({ error: "Metodo non consentito." });
  res.setHeader("Cache-Control", "no-store");
  try {
    const clients = photoClients();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token)
      throw new PhotoApiError(
        401,
        "Accedi allo studio per cercare fotografie.",
      );
    const { data, error } = await clients.auth.auth.getUser(token);
    if (error || !data.user)
      throw new PhotoApiError(401, "Sessione scaduta. Accedi di nuovo.");
    if (req.method === "GET" && req.query.status === "1") {
      const ready = await clients.cache
        .from("pixabay_search_cache")
        .select("key")
        .limit(0);
      if (ready.error)
        throw new PhotoApiError(
          503,
          "Libreria fotografica non disponibile. Puoi usare Caricamenti.",
        );
      return res.status(200).json({ available: true });
    }
    if (req.method === "GET") {
      const input = photoSearchSchema.safeParse(req.query);
      if (!input.success)
        throw new PhotoApiError(
          400,
          "Inserisci una ricerca da 1 a 100 caratteri.",
        );
      const result = await cachedSearch(clients.cache, {
        ...input.data,
        page: String(input.data.page),
      });
      return res.status(200).json(result);
    }
    const id = Number(req.body?.id);
    if (!Number.isSafeInteger(id) || id < 1)
      throw new PhotoApiError(400, "Fotografia non valida.");
    const result = await cachedSearch(clients.cache, { id: String(id) });
    const hit = result.hits.find((x) => x.id === id);
    if (!hit)
      throw new PhotoApiError(404, "Questa fotografia non è più disponibile.");
    const image = await limitedImageDownload(hit.largeImageURL);
    const filename = `${crypto.randomUUID()}.${image.mime === "image/jpeg" ? "jpg" : image.mime.split("/")[1]}`;
    const storage = createClient(clients.url, clients.anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const source = {
      provider: "pixabay",
      id: hit.id,
      author: hit.user,
      pageUrl: hit.pageURL,
    };
    const upload = await storage.storage
      .from("gentileschi-media")
      .upload(filename, image.bytes, {
        contentType: image.mime,
        upsert: false,
        metadata: { originalName: `Pixabay — ${hit.user}`, source },
      });
    if (upload.error)
      throw new PhotoApiError(
        502,
        "Impossibile salvare la fotografia nello studio. Riprova.",
      );
    return res.status(200).json({ storagePath: `cloud:${filename}`, source });
  } catch (error) {
    if (error instanceof PhotoApiError) {
      if (error.retryAfter) res.setHeader("Retry-After", error.retryAfter);
      return res.status(error.status).json({ error: error.message });
    }
    return res
      .status(502)
      .json({ error: "Ricerca fotografica non riuscita. Riprova." });
  }
}
