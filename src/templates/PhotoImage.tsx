import React, { useEffect, useState } from "react";
import type { SlideImage } from "../types/template";
import { styledPhoto, RenderedPhoto } from "../services/image/photoEffects";
export function PhotoImage({
  source,
  media,
  width,
  height,
  objectFit = "contain",
  objectPosition,
  transformOrigin,
}: {
  source: string;
  media?: SlideImage;
  width: number;
  height: number;
  objectFit?: React.CSSProperties["objectFit"];
  objectPosition?: string;
  transformOrigin?: string;
}) {
  const [render, setRender] = useState<RenderedPhoto | null>(null);
  const [error, setError] = useState("");
  const effectsKey = JSON.stringify(media?.effects);
  useEffect(() => {
    let active = true;
    setRender(null);
    setError("");
    if (media?.effects?.enabled)
      void styledPhoto(source, media.effects)
        .then((r) => {
          if (active) setRender(r);
        })
        .catch(() => {
          if (active) setError("Effetto fotografico non disponibile.");
        });
    return () => {
      active = false;
    };
  }, [source, effectsKey]);
  const enabled = media?.effects?.enabled;
  const pending = enabled && !render && !error;
  let placement: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
    objectPosition,
  };
  if (render) {
    const ratio =
      objectFit === "cover"
        ? Math.max(width / render.width, height / render.height)
        : Math.min(width / render.width, height / render.height);
    placement = {
      position: "absolute",
      left: (width - render.width * ratio) / 2 - render.padding * ratio,
      top: (height - render.height * ratio) / 2 - render.padding * ratio,
      width: (render.width + render.padding * 2) * ratio,
      height: (render.height + render.padding * 2) * ratio,
    };
  }
  return (
    <div
      data-photo-pending={pending ? "true" : undefined}
      data-photo-error={error || undefined}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: media?.crop ? "hidden" : "visible",
      }}
    >
      <img
        src={render?.url || source}
        alt=""
        draggable={false}
        style={{
          ...placement,
          transform: `translate(${media?.crop?.x ?? media?.posX ?? 0}px,${media?.crop?.y ?? media?.posY ?? 0}px) scale(${media?.crop?.scale ?? media?.scale ?? 1})`,
          transformOrigin: transformOrigin || "center",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
