import type { PhotoEffects } from "../../types/template";
export const GENTILESCHI_EFFECT: PhotoEffects = {
  version: 1,
  enabled: true,
  grayscale: true,
  contrast: 1.25,
  halftone: 0.65,
  outline: 16,
  outlineColor: "#ffffff",
  shadow: 12,
  shadowColor: "#102a52",
};
export function tonePixel(
  r: number,
  g: number,
  b: number,
  x: number,
  y: number,
  e: PhotoEffects,
): [number, number, number] {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const tone = (v: number) =>
    Math.max(0, Math.min(255, (v - 128) * e.contrast + 128));
  const gray = tone(luminance);
  const cell = 4;
  const distance = Math.hypot((x % cell) - cell / 2, (y % cell) - cell / 2);
  const dot = distance < Math.sqrt(1 - gray / 255) * cell * 0.63 ? 22 : 245;
  const blend = (v: number) =>
    Math.round(tone(v) * (1 - e.halftone) + dot * e.halftone);
  return e.grayscale
    ? [blend(luminance), blend(luminance), blend(luminance)]
    : [blend(r), blend(g), blend(b)];
}
export interface RenderedPhoto {
  url: string;
  width: number;
  height: number;
  padding: number;
}
const cache = new Map<string, Promise<RenderedPhoto>>();
export function styledPhoto(
  source: string,
  effects: PhotoEffects,
): Promise<RenderedPhoto> {
  const key = source + JSON.stringify(effects);
  const cached = cache.get(key);
  if (cached) return cached;
  const work = (async () => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const ratio = Math.min(
      1,
      1920 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.round(image.naturalWidth * ratio),
      height = Math.round(image.naturalHeight * ratio);
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = height;
    const ctx = surface.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (!pixels.data[i + 3]) continue;
        const [r, g, b] = tonePixel(
          pixels.data[i],
          pixels.data[i + 1],
          pixels.data[i + 2],
          x,
          y,
          effects,
        );
        pixels.data[i] = r;
        pixels.data[i + 1] = g;
        pixels.data[i + 2] = b;
      }
      if (y % 100 === 0) await new Promise<void>((r) => setTimeout(r, 0));
    }
    ctx.putImageData(pixels, 0, 0);
    const outline = (effects.outline * width) / 1080,
      shadow = (effects.shadow * width) / 1080;
    const padding = Math.ceil(outline + shadow + 2);
    const output = document.createElement("canvas");
    output.width = width + padding * 2;
    output.height = height + padding * 2;
    const out = output.getContext("2d")!;
    const silhouette = document.createElement("canvas");
    silhouette.width = width;
    silhouette.height = height;
    const mask = silhouette.getContext("2d")!;
    mask.drawImage(surface, 0, 0);
    // Repeated outline draws amplify faint segmentation residue into white rings.
    // Use the confident subject for the outline; keep the original soft alpha
    // on the photograph itself so hair and antialiased edges remain intact.
    const silhouettePixels = mask.getImageData(0, 0, width, height);
    for (let i = 3; i < silhouettePixels.data.length; i += 4) {
      silhouettePixels.data[i] = silhouettePixels.data[i] >= 128 ? 255 : 0;
    }
    mask.putImageData(silhouettePixels, 0, 0);
    mask.globalCompositeOperation = "source-in";
    mask.fillStyle = effects.outlineColor;
    mask.fillRect(0, 0, width, height);
    if (shadow) {
      out.shadowColor = effects.shadowColor;
      out.shadowOffsetX = shadow;
      out.shadowOffsetY = shadow;
      out.drawImage(silhouette, padding, padding);
      out.shadowOffsetX = 0;
      out.shadowOffsetY = 0;
    }
    if (outline)
      for (let n = 0; n < 48; n++) {
        const a = (n * Math.PI) / 24;
        out.drawImage(
          silhouette,
          padding + Math.cos(a) * outline,
          padding + Math.sin(a) * outline,
        );
      }
    out.drawImage(surface, padding, padding);
    return { url: output.toDataURL("image/png"), width, height, padding };
  })();
  cache.set(key, work);
  work.catch(() => cache.delete(key));
  // Bound memory while allowing all occurrences of a photograph to share a render.
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  return work;
}
