import type { NodeStyle } from "../types/scene";
let context: CanvasRenderingContext2D | null | undefined;
const cache = new Map<string, { fontSize: number; lineHeight: string }>();
/** Fit changed bound content without reflowing or distorting the theme's layout. */
export function fitTextToBox(
  text: string,
  style: NodeStyle,
  width: number,
  height: number,
) {
  const base = parseFloat(String(style.fontSize)) || 24;
  if (typeof document === "undefined" || !width || !height) return {};
  context ??= document.createElement("canvas").getContext("2d");
  if (!context) return {};
  const parsed = parseFloat(String(style.lineHeight));
  const ratio = String(style.lineHeight).includes("px")
    ? parsed / base
    : Number.isFinite(parsed)
      ? parsed
      : 1.2;
  const key = JSON.stringify([
    text,
    style.fontFamily,
    style.fontWeight,
    base,
    ratio,
    width,
    height,
    style.whiteSpace,
    style.letterSpacing,
  ]);
  const existing = cache.get(key);
  if (existing) return existing;
  const spacing = parseFloat(String(style.letterSpacing)) || 0;
  const minimum = Math.min(base, 12);
  let size = base;
  for (; size > minimum; size--) {
    context.font = `${style.fontWeight || 400} ${size}px ${style.fontFamily || "Inter"}`;
    let lines = 0,
      maxWidth = 0;
    const measure = (value: string) =>
      context!.measureText(value).width +
      (Math.max(0, value.length - 1) * spacing * size) / base;
    for (const paragraph of text.split("\n")) {
      if (style.whiteSpace === "nowrap") {
        lines++;
        maxWidth = Math.max(maxWidth, measure(paragraph));
        continue;
      }
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const next = line ? line + " " + word : word;
        if (line && measure(next) > width) {
          lines++;
          maxWidth = Math.max(maxWidth, measure(line));
          line = word;
        } else line = next;
      }
      lines++;
      maxWidth = Math.max(maxWidth, measure(line));
    }
    if (lines * size * ratio <= height + 1 && maxWidth <= width + 1) break;
  }
  const result = { fontSize: size, lineHeight: `${size * ratio}px` };
  cache.set(key, result);
  if (cache.size > 256) cache.delete(cache.keys().next().value!);
  return result;
}
