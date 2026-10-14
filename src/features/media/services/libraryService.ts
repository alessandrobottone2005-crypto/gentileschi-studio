import type { MediaAsset } from '../../../shared/types/studio';
import { supabase } from '../../../shared/lib/supabaseClient';
import { listLocalMedia, loadMedia } from './mediaStore';

export async function getMediaLibrary(): Promise<MediaAsset[]> {
  if (!supabase) return listLocalMedia();
  const { data, error } = await supabase.rpc('studio_media');
  if (error) throw new Error('Impossibile caricare la libreria. Riprova.');
  const rows = (data || []) as Record<string, any>[];
  if (!rows.length) return [];
  const signedUrls = new Map<string, string>();
  // Bound request size for large libraries.
  for (let start = 0; start < rows.length; start += 100) {
    const names = rows
      .slice(start, start + 100)
      .map((row) => row.name as string);
    const signed = await supabase.storage
      .from('gentileschi-media')
      .createSignedUrls(names, 3600);
    if (signed.error)
      throw new Error('Impossibile caricare le anteprime delle foto. Riprova.');
    for (const item of signed.data || [])
      if (item.path && item.signedUrl)
        signedUrls.set(item.path, item.signedUrl);
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    originalName: row.original_name || `Foto ${row.name.slice(0, 8)}`,
    ownerId: row.owner_id || null,
    size: Number(row.size),
    mimeType: row.mime_type || '',
    createdAt: row.created_at,
    storagePath: `cloud:${row.name}`,
    previewUrl: signedUrls.get(row.name) || null,
    source: row.source?.provider === 'pixabay' ? row.source : undefined,
  }));
}
export async function downloadMedia(asset: MediaAsset): Promise<void> {
  const url = await loadMedia(asset.storagePath);
  try {
    const link = document.createElement('a');
    link.href = url;
    const extension = asset.name.split('.').pop();
    link.download = asset.originalName.includes('.')
      ? asset.originalName
      : `${asset.originalName}.${extension}`;
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export function releaseLocalPreviews(assets: MediaAsset[]) {
  for (const asset of assets)
    if (asset.previewUrl?.startsWith('blob:'))
      URL.revokeObjectURL(asset.previewUrl);
}
