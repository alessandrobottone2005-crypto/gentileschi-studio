import React, { useEffect, useRef, useState } from "react";
import {
  getMediaLibrary,
  releaseLocalPreviews,
} from "./services/libraryService";
import { saveMedia, loadMedia } from "./services/mediaStore";
import type { SlideImage } from "../../shared/types/template";
import type { MediaAsset } from "../../shared/types/studio";
export function UploadsPanel({
  canReplace,
  onInsert,
}: {
  canReplace: boolean;
  onInsert: (image: SlideImage, replace: boolean) => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]),
    [selected, setSelected] = useState<MediaAsset | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const reload = () => {
    const id = ++request.current;
    void getMediaLibrary()
      .then((next) => {
        if (id === request.current)
          setAssets((old) => {
            releaseLocalPreviews(old);
            return next;
          });
        else releaseLocalPreviews(next);
      })
      .catch((e) => {
        if (id === request.current) setError(e.message);
      });
  };
  useEffect(() => {
    reload();
    return () => {
      request.current++;
    };
  }, []);
  useEffect(() => () => releaseLocalPreviews(assets), [assets]);
  const insert = async (replace: boolean) => {
    if (!selected) return;
    setBusy(true);
    try {
      const url = await loadMedia(selected.storagePath);
      onInsert(
        {
          storagePath: selected.storagePath,
          url,
          originalStoragePath: selected.storagePath,
          originalUrl: url,
          source: selected.source,
        },
        replace,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="uploads-panel">
      <h2>Caricamenti</h2>
      <p>Le fotografie della libreria dello studio.</p>
      <button
        type="button"
        className="theme-use"
        disabled={busy}
        onClick={() => file.current?.click()}
      >
        Carica una fotografia
      </button>
      <input
        ref={file}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        aria-label="Carica fotografia"
        onChange={async (e) => {
          const image = e.target.files?.[0];
          if (!image) return;
          setBusy(true);
          setError("");
          try {
            const saved = await saveMedia(image, image.name);
            onInsert(
              {
                ...saved,
                originalStoragePath: saved.storagePath,
                originalUrl: saved.url,
              },
              false,
            );
            reload();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
            if (file.current) file.current.value = "";
          }
        }}
      />
      {error && <p role="alert">{error}</p>}
      {selected && (
        <div className="stock-detail">
          <strong>{selected.originalName}</strong>
          <button
            type="button"
            disabled={busy}
            onClick={() => void insert(false)}
          >
            Aggiungi alla slide
          </button>
          <button
            type="button"
            disabled={!canReplace || busy}
            onClick={() => void insert(true)}
          >
            Sostituisci la foto selezionata
          </button>
        </div>
      )}
      <div className="stock-results">
        {assets.map((asset) => (
          <button
            type="button"
            key={asset.id}
            aria-pressed={selected?.id === asset.id}
            onClick={() => setSelected(asset)}
          >
            {asset.previewUrl && (
              <img src={asset.previewUrl} alt={asset.originalName} />
            )}
            <span>{asset.originalName}</span>
          </button>
        ))}
      </div>
      {!assets.length && (
        <p className="workspace-hint">
          Carica la prima foto per ritrovarla qui.
        </p>
      )}
    </section>
  );
}
