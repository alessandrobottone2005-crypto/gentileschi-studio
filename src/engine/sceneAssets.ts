import themeAssets from "../assets/figma/theme-assets.json";
const metadata = themeAssets as Record<
  string,
  { label: string; color: string }
>;
const files = import.meta.glob(
  [
    "../assets/figma/vectors/*.svg",
    "../assets/figma/themes/*",
    "../assets/figma/gentileschi-statue.png",
    "../assets/figma/airplane-trip.png",
    "../assets/figma/students-group.png",
  ],
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;
export const SCENE_ASSETS = Object.fromEntries(
  Object.entries(files)
    .filter(([path]) => !path.includes("/reference-"))
    .map(([path, url]) => [path.split("/figma/")[1], url]),
);
export const DECORATIONS = Object.keys(SCENE_ASSETS).filter((key) =>
  key.endsWith(".svg"),
);
export function decorationLabel(key: string): string {
  if (metadata[key]) return metadata[key].label;
  const name = key.split("/").pop()!.replace(".svg", "");
  const labels: Record<string, string> = {
    "star-burst-lime": "Esplosione lime",
    "star-burst-blue": "Esplosione blu",
    "drawn-circle": "Cerchio disegnato",
    "ring-drawn": "Anello disegnato",
    "drawn-arrow": "Freccia disegnata",
    "sticker-lime": "Adesivo lime",
    "star-lime": "Stella lime",
  };
  const stem = name.replace(/-\d+$/, "");
  return `${labels[stem] || "Decorazione"} ${name.match(/\d+$/)?.[0] || ""}`.trim();
}
// Paint metadata from the original SVGs; the assets themselves are unchanged.
export function decorationColor(key?: string): string {
  if (key && metadata[key]) return metadata[key].color;
  if (key?.includes("star-burst-blue-3")) return "#304bff";
  if (key?.includes("star-burst-blue-")) return "#7b88ff";
  if (key?.includes("drawn-circle-3") || key?.includes("drawn-arrow-3"))
    return "#1728e8";
  return "#dfff2f";
}
export function assetIdForUrl(url: string): string | undefined {
  return Object.entries(SCENE_ASSETS).find(
    ([, value]) => url === value || url.endsWith(value),
  )?.[0];
}
