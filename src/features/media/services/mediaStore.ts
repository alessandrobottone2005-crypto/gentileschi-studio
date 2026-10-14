import type { Project, SlideImage, TemplateType } from "../../../shared/types/template";
import {
  DEFAULT_IMAGES,
  legacyDefaultImageKey,
} from "../../../shared/composition/defaultAssets";
import { isSupabaseConfigured, supabase } from "../../../shared/lib/supabaseClient";

import type { MediaAsset } from "../../../shared/types/studio";
import { SCENE_ASSETS } from "../../../shared/composition/sceneAssets";
import { allNodes, clone } from "../../../shared/composition/scene";

export function projectImages(
  project: Project,
): Array<{ image: SlideImage; type: TemplateType; bound: boolean }> {
  return [...project.slides, ...(project.themeSnapshot?.slides || [])].flatMap(
    (slide) => [
      ...(slide.content.image
        ? [
            {
              image: slide.content.image,
              type: slide.templateType,
              bound: true,
            },
          ]
        : []),
      ...allNodes([
        ...(slide.scene?.nodes || []),
        ...(slide.scene?.agendaPrototype ? [slide.scene.agendaPrototype] : []),
      ])
        .filter((node) => node.media)
        .map((node) => ({
          image: node.media!,
          type: slide.templateType,
          bound: node.binding === "image",
        })),
    ],
  );
}

const BUCKET = "gentileschi-media";
const LOCAL_DB = "gentileschi-media-v1";
const LOCAL_STORE = "images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(LOCAL_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeLocalBlob(key: string, blob: Blob): Promise<void> {
  const db = await openLocalDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORE, "readwrite");
      transaction.objectStore(LOCAL_STORE).put(blob, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function readLocalBlob(key: string): Promise<Blob> {
  const db = await openLocalDb();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORE, "readonly");
      const request = transaction.objectStore(LOCAL_STORE).get(key);
      request.onsuccess = () =>
        request.result instanceof Blob
          ? resolve(request.result)
          : reject(
              new Error("Immagine non disponibile su questo dispositivo."),
            );
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function saveMedia(
  blob: Blob,
  originalName?: string,
  source?: SlideImage['source'],
): Promise<{ storagePath: string; url: string }> {
  if (!ACCEPTED_TYPES.has(blob.type)) {
    throw new Error("Carica un file PNG, JPG o WEBP.");
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error("La fotografia deve pesare meno di 10 MB.");
  }

  const extension =
    blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];
  const key = `${crypto.randomUUID()}.${extension}`;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(key, blob, {
      contentType: blob.type,
      upsert: false,
      metadata: {
        ...(source ? {source} : {}),
        originalName:
          originalName ||
          (typeof File !== "undefined" && blob instanceof File
            ? blob.name
            : "Foto senza sfondo"),
      },
    });
    if (error) throw new Error(`Caricamento non riuscito: ${error.message}`);
    return { storagePath: `cloud:${key}`, url: URL.createObjectURL(blob) };
  }

  await writeLocalBlob(key, blob);
  return { storagePath: `local:${key}`, url: URL.createObjectURL(blob) };
}

export async function loadMedia(storagePath: string): Promise<string> {
  const [source, key] = storagePath.split(":", 2);
  if (!key) throw new Error("Percorso immagine non valido.");
  if (source === "local") return URL.createObjectURL(await readLocalBlob(key));
  if (source === "cloud" && supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(key);
    if (error || !data)
      throw new Error(error?.message || "Immagine non disponibile.");
    return URL.createObjectURL(data);
  }
  throw new Error("Archivio immagini non disponibile.");
}

function normalizeImage(
  image: SlideImage,
  slideType: TemplateType,
): SlideImage {
  const normalized = { ...image };
  const assetKey = image.assetKey || legacyDefaultImageKey(image.url);
  if (assetKey) normalized.assetKey = assetKey;
  if (!normalized.storagePath && !assetKey && image.url?.startsWith("blob:")) {
    normalized.missing = true;
    normalized.url = DEFAULT_IMAGES[slideType];
  }
  return normalized;
}

export function serializeProject(project: Project): Project {
  const stored = clone(project);
  stored.slides.forEach((slide) => {
    delete slide.projectSettings;
  });
  projectImages(stored).forEach(({ image, type, bound }) => {
    if (bound) Object.assign(image, normalizeImage(image, type));
    else if (image.url?.startsWith("blob:") && !image.storagePath)
      image.missing = true;
    delete image.url;
    delete image.originalUrl;
    delete image.cutoutUrl;
  });
  if (stored.slides[0])
    stored.slides[0].projectSettings = {
      format: stored.format || "portrait",
      themeRef: stored.themeRef,
      themeSnapshot: stored.themeSnapshot,
    };
  return stored;
}

export async function hydrateProject(project: Project): Promise<Project> {
  const hydrated = clone(project);
  const cache = new Map<string, Promise<string>>();
  const load = (path: string) => {
    if (!cache.has(path)) cache.set(path, loadMedia(path));
    return cache.get(path)!;
  };
  await Promise.all(
    projectImages(hydrated).map(async ({ image, type, bound }) => {
      if (bound) Object.assign(image, normalizeImage(image, type));
      // Stored runtime URLs are never trusted; resolve the persistent reference.
      delete image.url;
      delete image.originalUrl;
      if (image.storagePath) {
        try {
          image.url = await load(image.storagePath);
          image.missing = false;
        } catch {
          image.url = undefined;
          image.missing = true;
        }
      } else if (image.assetId) {
        image.url = SCENE_ASSETS[image.assetId];
      } else if (image.assetKey) {
        image.url = DEFAULT_IMAGES[image.assetKey];
      }
      if (image.originalStoragePath) {
        try {
          image.originalUrl = await load(image.originalStoragePath);
        } catch {
          /* Reset remains available to the template default. */
        }
      } else if (image.originalAssetId) {
        image.originalUrl = SCENE_ASSETS[image.originalAssetId];
      } else if (image.originalAssetKey) {
        image.originalUrl = DEFAULT_IMAGES[image.originalAssetKey];
      }
      if (image.cutoutStoragePath) {
        try { image.cutoutUrl = await load(image.cutoutStoragePath); } catch { image.cutoutUrl = undefined; }
      }
    }),
  );
  return hydrated;
}

export async function moveLocalMediaToCloud(
  project: Project,
): Promise<Project> {
  if (!isSupabaseConfigured)
    throw new Error("Archivio online non configurato.");
  const migrated = await hydrateProject(project);
  const pathCache = new Map<
    string,
    Promise<{ storagePath: string; url: string }>
  >();
  const migratePath = async (path?: string) => {
    if (!path?.startsWith("local:")) return undefined;
    const cached = pathCache.get(path);
    if (cached) return cached;
    const saved = readLocalBlob(path.slice("local:".length)).then((blob) =>
      saveMedia(blob),
    );
    pathCache.set(path, saved);
    return saved;
  };
  await Promise.all(
    projectImages(migrated).map(async ({ image }) => {
      const current = await migratePath(image.storagePath);
      if (current) {
        image.storagePath = current.storagePath;
        image.url = current.url;
      }
      const original = await migratePath(image.originalStoragePath);
      if (original) {
        image.originalStoragePath = original.storagePath;
        image.originalUrl = original.url;
      }
      const cutout = await migratePath(image.cutoutStoragePath);
      if (cutout) { image.cutoutStoragePath = cutout.storagePath; image.cutoutUrl = cutout.url; }
    }),
  );
  return migrated;
}

export async function listLocalMedia(): Promise<MediaAsset[]> {
  const db = await openLocalDb();
  try {
    return await new Promise<MediaAsset[]>((resolve, reject) => {
      const assets: MediaAsset[] = [];
      const tx = db.transaction(LOCAL_STORE, "readonly");
      const request = tx.objectStore(LOCAL_STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        const blob = cursor.value as Blob;
        const name = String(cursor.key);
        assets.push({
          id: name,
          name,
          originalName: `Foto ${name.slice(0, 8)}`,
          ownerId: "local-device",
          size: blob.size,
          mimeType: blob.type,
          createdAt: null,
          storagePath: `local:${name}`,
          previewUrl: URL.createObjectURL(blob),
        });
        cursor.continue();
      };
      tx.oncomplete = () => resolve(assets);
      tx.onerror = () =>
        reject(
          new Error("Impossibile caricare le foto su questo dispositivo."),
        );
    });
  } finally {
    db.close();
  }
}
