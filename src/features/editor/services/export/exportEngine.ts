import { toPng, toBlob } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ExportProgress {
  current: number;
  total: number;
  statusText: string;
}
function captureSize(node: HTMLElement) {
  const width = Number.parseFloat(node.style.width) || node.offsetWidth;
  const height = Number.parseFloat(node.style.height) || node.offsetHeight;
  if (!width || !height)
    throw new Error("Le dimensioni della slide non sono valide.");
  return {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio: 1,
  };
}
async function waitForPhotographs(node: HTMLElement) {
  const start=Date.now();
  while(node.querySelector('[data-photo-pending="true"]')) {
    if(Date.now()-start>30000)throw new Error('La fotografia non è pronta. Riprova tra poco.');
    await new Promise(resolve=>setTimeout(resolve,30));
  }
  if(node.querySelector('[data-photo-error]'))throw new Error('Un effetto fotografico non è disponibile. Disattivalo oppure riprova.');
  await Promise.all(Array.from(node.querySelectorAll('img')).map(img=>img.decode()));
}
async function embedMasks(node: HTMLElement): Promise<() => void> {
  const originals: Array<{
    element: HTMLElement;
    mask: string;
    webkit: string;
  }> = [];
  const restore = () =>
    originals.forEach(({ element, mask, webkit }) => {
      element.style.maskImage = mask;
      element.style.webkitMaskImage = webkit;
    });
  try {
    for (const element of Array.from(
      node.querySelectorAll<HTMLElement>("[data-vector-source]"),
    )) {
      const response = await fetch(element.dataset.vectorSource!);
      if (!response.ok) throw new Error("Una decorazione non è disponibile.");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        void response.blob().then((blob) => reader.readAsDataURL(blob), reject);
      });
      originals.push({
        element,
        mask: element.style.maskImage,
        webkit: element.style.webkitMaskImage,
      });
      element.style.maskImage =
        element.style.webkitMaskImage = `url("${dataUrl}")`;
    }
    return restore;
  } catch (error) {
    restore();
    throw error;
  }
}

/**
 * Generates slug from project title
 */
export function formatProjectSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "post-gentileschi"
  );
}

/**
 * Capture a 1080x1350 slide node to high-res PNG Data URL
 */
export async function captureSlideNodeToPng(
  node: HTMLElement,
): Promise<string> {
  // Ensure all fonts are ready before rasterizing
  if (document.fonts) {
    await document.fonts.ready;
  }

  await waitForPhotographs(node);
  const restore = await embedMasks(node);
  try {
    return await toPng(node, captureSize(node));
  } finally {
    restore();
  }
}

/**
 * Capture a 1080x1350 slide node to Blob
 */
export async function captureSlideNodeToBlob(node: HTMLElement): Promise<Blob> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  await waitForPhotographs(node);
  const restore = await embedMasks(node);
  let blob: Blob | null;
  try {
    blob = await toBlob(node, captureSize(node));
  } finally {
    restore();
  }

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
  slideIndex: number,
): Promise<void> {
  const slug = formatProjectSlug(projectTitle);
  const indexStr = String(slideIndex + 1).padStart(2, "0");
  const filename = `${slug}-${indexStr}.png`;

  const blob = await captureSlideNodeToBlob(node);
  saveAs(blob, filename);
}

export function downloadSingleSlideBlob(
  blob: Blob,
  projectTitle: string,
  slideIndex: number,
): void {
  const slug = formatProjectSlug(projectTitle);
  const indexStr = String(slideIndex + 1).padStart(2, "0");
  saveAs(blob, `${slug}-${indexStr}.png`);
}

/**
 * Pack an array of rendered Blobs into a zip and trigger download
 */
export async function downloadCarouselZip(
  slideBlobs: Array<{ index: number; blob: Blob }>,
  projectTitle: string,
  onProgress?: (progress: ExportProgress) => void,
): Promise<void> {
  const zip = new JSZip();
  const slug = formatProjectSlug(projectTitle);

  onProgress?.({
    current: 0,
    total: slideBlobs.length,
    statusText: "Creazione archivio ZIP in corso...",
  });

  slideBlobs.forEach(({ index, blob }) => {
    const filename = `${slug}-${String(index + 1).padStart(2, "0")}.png`;
    zip.file(filename, blob);
  });

  const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
    onProgress?.({
      current: Math.round(metadata.percent),
      total: 100,
      statusText: `Compressione ZIP: ${Math.round(metadata.percent)}%`,
    });
  });

  saveAs(content, `${slug}-carosello.zip`);
}
