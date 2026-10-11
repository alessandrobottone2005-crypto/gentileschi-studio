import type { Project, SlideImage, TemplateType } from '../../types/template';
import { DEFAULT_IMAGES, legacyDefaultImageKey } from '../../engine/defaultAssets';
import { isSupabaseConfigured, supabase } from '../supabase/supabaseClient';

const BUCKET = 'gentileschi-media';
const LOCAL_DB = 'gentileschi-media-v1';
const LOCAL_STORE = 'images';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(LOCAL_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeLocalBlob(key: string, blob: Blob): Promise<void> {
  const db = await openLocalDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORE, 'readwrite');
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
      const transaction = db.transaction(LOCAL_STORE, 'readonly');
      const request = transaction.objectStore(LOCAL_STORE).get(key);
      request.onsuccess = () => request.result instanceof Blob
        ? resolve(request.result)
        : reject(new Error('Immagine non disponibile su questo dispositivo.'));
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function saveMedia(blob: Blob): Promise<{ storagePath: string; url: string }> {
  if (!ACCEPTED_TYPES.has(blob.type)) {
    throw new Error('Carica un file PNG, JPG o WEBP.');
  }
  if (blob.size > MAX_FILE_SIZE) {
    throw new Error('La fotografia deve pesare meno di 10 MB.');
  }

  const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1];
  const key = `${crypto.randomUUID()}.${extension}`;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(key, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) throw new Error(`Caricamento non riuscito: ${error.message}`);
    return { storagePath: `cloud:${key}`, url: URL.createObjectURL(blob) };
  }

  await writeLocalBlob(key, blob);
  return { storagePath: `local:${key}`, url: URL.createObjectURL(blob) };
}

async function loadMedia(storagePath: string): Promise<string> {
  const [source, key] = storagePath.split(':', 2);
  if (!key) throw new Error('Percorso immagine non valido.');
  if (source === 'local') return URL.createObjectURL(await readLocalBlob(key));
  if (source === 'cloud' && supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(key);
    if (error || !data) throw new Error(error?.message || 'Immagine non disponibile.');
    return URL.createObjectURL(data);
  }
  throw new Error('Archivio immagini non disponibile.');
}

function normalizeImage(image: SlideImage, slideType: TemplateType): SlideImage {
  const normalized = { ...image };
  const assetKey = image.assetKey || legacyDefaultImageKey(image.url);
  if (assetKey) normalized.assetKey = assetKey;
  if (!normalized.storagePath && !assetKey && image.url?.startsWith('blob:')) {
    normalized.missing = true;
    normalized.url = DEFAULT_IMAGES[slideType];
  }
  return normalized;
}

export function serializeProject(project: Project): Project {
  return {
    ...project,
    slides: project.slides.map((slide) => {
      const content = { ...slide.content } as typeof slide.content & { image?: SlideImage };
      if (content.image) {
        const image = normalizeImage(content.image, slide.templateType);
        delete image.url;
        delete image.originalUrl;
        content.image = image;
      }
      return { ...slide, content } as typeof slide;
    }),
  };
}

export async function hydrateProject(project: Project): Promise<Project> {
  const slides = await Promise.all(project.slides.map(async (slide) => {
    const content = { ...slide.content } as typeof slide.content & { image?: SlideImage };
    if (content.image) {
      const image = normalizeImage(content.image, slide.templateType);
      if (image.storagePath) {
        try {
          image.url = await loadMedia(image.storagePath);
          image.missing = false;
        } catch {
          image.url = DEFAULT_IMAGES[slide.templateType];
          image.missing = true;
        }
      } else if (image.assetKey) {
        image.url = DEFAULT_IMAGES[image.assetKey];
      }
      if (image.originalStoragePath) {
        try { image.originalUrl = await loadMedia(image.originalStoragePath); } catch { /* Reset remains available to the template default. */ }
      } else if (image.originalAssetKey) {
        image.originalUrl = DEFAULT_IMAGES[image.originalAssetKey];
      }
      content.image = image;
    }
    return { ...slide, content } as typeof slide;
  }));
  return { ...project, slides };
}

export async function moveLocalMediaToCloud(project: Project): Promise<Project> {
  if (!isSupabaseConfigured) throw new Error('Archivio online non configurato.');
  const migrated = await hydrateProject(project);
  const pathCache = new Map<string, { storagePath: string; url: string }>();
  const migratePath = async (path?: string) => {
    if (!path?.startsWith('local:')) return undefined;
    const cached = pathCache.get(path);
    if (cached) return cached;
    const saved = await saveMedia(await readLocalBlob(path.slice('local:'.length)));
    pathCache.set(path, saved);
    return saved;
  };
  const slides = await Promise.all(migrated.slides.map(async (slide) => {
    const content = { ...slide.content } as typeof slide.content & { image?: SlideImage };
    if (content.image) {
      const image = { ...content.image };
      const current = await migratePath(image.storagePath);
      if (current) { image.storagePath = current.storagePath; image.url = current.url; }
      const original = await migratePath(image.originalStoragePath);
      if (original) { image.originalStoragePath = original.storagePath; image.originalUrl = original.url; }
      content.image = image;
    }
    return { ...slide, content } as typeof slide;
  }));
  return { ...migrated, slides };
}
