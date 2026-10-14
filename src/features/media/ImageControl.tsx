import React, { useRef, useState } from "react";
import type { SlideImage } from "../../shared/types/template";
import { saveMedia } from "./services/mediaStore";
import { MediaPicker } from "./MediaLibrary";
import { PhotoTools, photoSource } from "./PhotoTools";
export function ImageControl({
  image,
  defaultImageUrl,
  onChange,
  onReset,
}: {
  image?: SlideImage;
  defaultImageUrl: string;
  onChange: (image: SlideImage) => void;
  onReset: () => void;
}) {
  const [library, setLibrary] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  return (
    <section className="photo-tools">
      <h3>Fotografia</h3>
      <img
        src={photoSource(image, defaultImageUrl)}
        alt="Fotografia selezionata"
        style={{ width: "100%", height: 120, objectFit: "contain" }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => file.current?.click()}
      >
        Carica nuova foto
      </button>
      <button type="button" onClick={() => setLibrary(true)}>
        Scegli dalla libreria
      </button>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label="Seleziona fotografia"
        onChange={async (e) => {
          const chosen = e.target.files?.[0];
          if (!chosen) return;
          setBusy(true);
          setError("");
          try {
            const saved = await saveMedia(chosen, chosen.name);
            onChange({
              ...saved,
              originalUrl: saved.url,
              originalStoragePath: saved.storagePath,
              effects: image?.effects,
              crop: image?.crop,
            });
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
            if (file.current) file.current.value = "";
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      <PhotoTools
        image={image}
        defaultImageUrl={defaultImageUrl}
        onChange={onChange}
        onReset={onReset}
      />
      <details>
        <summary>Posizione della foto</summary>
        {(
          [
            ["Zoom fotografia", "scale", 0.5, 4, 0.05],
            ["Sposta fotografia orizzontalmente", "posX", -500, 500, 1],
            ["Sposta fotografia verticalmente", "posY", -500, 500, 1],
          ] as const
        ).map(([label, key, min, max, step]) => (
          <label key={key}>
            {label}
            <input
              type="range"
              aria-label={label}
              min={min}
              max={max}
              step={step}
              value={image?.[key] ?? (key === "scale" ? 1 : 0)}
              onChange={(e) =>
                onChange({ ...image, [key]: Number(e.target.value) })
              }
            />
          </label>
        ))}
      </details>
      {library && (
        <MediaPicker
          onClose={() => setLibrary(false)}
          onSelect={(selected) => {
            onChange({
              ...selected,
              effects: image?.effects,
              crop: image?.crop,
            });
            setLibrary(false);
          }}
        />
      )}
    </section>
  );
}
