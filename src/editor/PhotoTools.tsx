import React, { useEffect, useRef, useState } from "react";
import type { SlideImage, PhotoEffects } from "../types/template";
import { GENTILESCHI_EFFECT } from "../services/image/photoEffects";
import { saveMedia } from "../services/image/mediaStore";
import { SCENE_ASSETS } from "../engine/sceneAssets";
import { DEFAULT_IMAGES } from "../engine/defaultAssets";
export function photoSource(image?: SlideImage, fallback = "") {
  return (
    image?.url ||
    (image?.assetId ? SCENE_ASSETS[image.assetId] : "") ||
    (image?.assetKey ? DEFAULT_IMAGES[image.assetKey] : "") ||
    fallback
  );
}
export function PhotoTools({
  image,
  defaultImageUrl = "",
  onChange,
  onReset,
}: {
  image?: SlideImage;
  defaultImageUrl?: string;
  onChange: (image: SlideImage) => void;
  onReset: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState("");
  const job = useRef(0);
  useEffect(
    () => () => {
      job.current++;
    },
    [],
  );
  const effects = image?.effects || GENTILESCHI_EFFECT;
  const patch = (change: Partial<PhotoEffects>) =>
    onChange({ ...image, effects: { ...effects, ...change, version: 1 } });
  const cutout = async (style = false) => {
    const current = ++job.current;
    setBusy(true);
    setError("");
    setProgress("Preparazione…");
    let url: string | undefined;
    try {
      let next = { ...image };
      if (!image?.isTransparent) {
        if (image?.cutoutStoragePath && image.cutoutUrl) {
          next = {
            ...image,
            storagePath: image.cutoutStoragePath,
            url: image.cutoutUrl,
            isTransparent: true,
          };
        } else {
          const { removeImageBackground } =
            await import("../services/image/bgRemovalService");
          const source = photoSource(image, defaultImageUrl);
          url = await removeImageBackground(source, (p) => {
            if (job.current === current)
              setProgress(`Rimozione sfondo · ${p.progress}%`);
          });
          if (job.current !== current) return;
          const blob = await (await fetch(url)).blob();
          const saved = await saveMedia(
            blob,
            "Foto scontornata",
            image?.source,
          );
          next = {
            ...image,
            ...saved,
            originalUrl: image?.originalUrl || source,
            originalStoragePath:
              image?.originalStoragePath || image?.storagePath,
            originalAssetId: image?.originalAssetId || image?.assetId,
            originalAssetKey: image?.originalAssetKey || image?.assetKey,
            cutoutStoragePath: saved.storagePath,
            cutoutUrl: saved.url,
            isTransparent: true,
            assetId: undefined,
            assetKey: undefined,
          };
        }
      }
      if (job.current === current)
        onChange({
          ...next,
          ...(style ? { effects: { ...effects, enabled: true } } : {}),
        });
    } catch (e) {
      if (job.current === current)
        setError(
          e instanceof Error
            ? e.message
            : "Scontorno non riuscito. La foto originale è disponibile.",
        );
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (job.current === current) {
        setBusy(false);
        setProgress("");
      }
    }
  };
  const restore = () => {
    if (
      image?.originalStoragePath ||
      image?.originalAssetId ||
      image?.originalAssetKey
    ) {
      onChange({
        ...image,
        storagePath: image.originalStoragePath,
        url: image.originalUrl,
        assetId: image.originalAssetId,
        assetKey: image.originalAssetKey,
        isTransparent: false,
        effects: image.effects
          ? { ...image.effects, enabled: false }
          : undefined,
      });
    } else onReset();
  };
  return (
    <section className="photo-tools" aria-label="Modifica fotografia">
      <div className="photo-actions">
        <button
          type="button"
          disabled={busy || image?.missing}
          onClick={() => void cutout()}
        >
          Rimuovi sfondo
        </button>
        <button
          type="button"
          className="theme-use"
          disabled={busy || image?.missing}
          onClick={() => void cutout(true)}
        >
          Stile Gentileschi
        </button>
      </div>
      {busy && (
        <div role="status">
          {progress}
          <button
            type="button"
            onClick={() => {
              job.current++;
              setBusy(false);
              setProgress("");
            }}
          >
            Annulla elaborazione
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {image?.effects && (
        <>
          <label>
            <input
              type="checkbox"
              checked={effects.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
            />{" "}
            Effetto attivo
          </label>
          <fieldset disabled={!effects.enabled || busy}>
            <label>
              <input
                type="checkbox"
                checked={effects.grayscale}
                onChange={(e) => patch({ grayscale: e.target.checked })}
              />{" "}
              Bianco e nero
            </label>
            {(
              [
                ["Contrasto", "contrast", 0.5, 2, 0.05],
                ["Trama a puntini", "halftone", 0, 1, 0.05],
                ["Spessore bordo", "outline", 0, 40, 1],
                ["Ombra", "shadow", 0, 40, 1],
              ] as const
            ).map(([label, key, min, max, step]) => (
              <label key={key}>
                {label}
                <input
                  aria-label={label}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={effects[key]}
                  onChange={(e) => patch({ [key]: Number(e.target.value) })}
                />
                <output>{effects[key]}</output>
              </label>
            ))}
            <label>
              Colore bordo
              <input
                type="color"
                aria-label="Colore bordo"
                value={effects.outlineColor}
                onChange={(e) => patch({ outlineColor: e.target.value })}
              />
            </label>
            <label>
              Colore ombra
              <input
                type="color"
                aria-label="Colore ombra"
                value={effects.shadowColor}
                onChange={(e) => patch({ shadowColor: e.target.value })}
              />
            </label>
          </fieldset>
        </>
      )}
      <button type="button" onClick={restore} disabled={busy}>
        Ripristina immagine originale
      </button>
      {image?.source && (
        <small>
          Foto di {image.source.author} ·{" "}
          <a href={image.source.pageUrl} target="_blank" rel="noreferrer">
            Pixabay
          </a>
        </small>
      )}
    </section>
  );
}
