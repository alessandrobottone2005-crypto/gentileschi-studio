import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ExportProgress {
  current: number;
  total: number;
  statusText: string;
}

/**
 * Generates slug from project title
 */
export function formatProjectSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'post-gentileschi';
}

/**
 * Capture a 1080x1350 slide node to high-res PNG Data URL
 */
export async function captureSlideNodeToPng(node: HTMLElement): Promise<string> {
  // Ensure all fonts are ready before rasterizing
  if (document.fonts) {
    await document.fonts.ready;
  }

  return await toPng(node, {
    width: 1080,
    height: 1350,
    canvasWidth: 1080,
    canvasHeight: 1350,
    pixelRatio: 1,
  });
}

/**
 * Capture a 1080x1350 slide node to Blob
 */
export async function captureSlideNodeToBlob(node: HTMLElement): Promise<Blob> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const blob = await toBlob(node, {
    width: 1080,
    height: 1350,
    canvasWidth: 1080,
    canvasHeight: 1350,
    pixelRatio: 1,
  });

  if (!blob) {
    throw new Error("Impossibile generare l'immagine della slide.");
  }

  return blob;
}

/**
 * Download a single slide as PNG
 */
export async function downloadSingleSlidePng(
  node: HTMLElement,
  projectTitle: string,
  slideIndex: number
): Promise<void> {
  const slug = formatProjectSlug(projectTitle);
  const indexStr = String(slideIndex + 1).padStart(2, '0');
  const filename = `${slug}-${indexStr}.png`;

  const blob = await captureSlideNodeToBlob(node);
  saveAs(blob, filename);
}

export function downloadSingleSlideBlob(blob: Blob, projectTitle: string, slideIndex: number): void {
  const slug = formatProjectSlug(projectTitle);
  const indexStr = String(slideIndex + 1).padStart(2, '0');
  saveAs(blob, `${slug}-${indexStr}.png`);
}

/**
 * Pack an array of rendered Blobs into a zip and trigger download
 */
export async function downloadCarouselZip(
  slideBlobs: Array<{ index: number; blob: Blob }>,
  projectTitle: string,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const slug = formatProjectSlug(projectTitle);

  onProgress?.({
    current: 0,
    total: slideBlobs.length,
    statusText: 'Creazione archivio ZIP in corso...',
  });

  slideBlobs.forEach(({ index, blob }) => {
    const filename = `${slug}-${String(index + 1).padStart(2, '0')}.png`;
    zip.file(filename, blob);
  });

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.({
      current: Math.round(metadata.percent),
      total: 100,
      statusText: `Compressione ZIP: ${Math.round(metadata.percent)}%`,
    });
  });

  saveAs(content, `${slug}-carosello.zip`);
}
