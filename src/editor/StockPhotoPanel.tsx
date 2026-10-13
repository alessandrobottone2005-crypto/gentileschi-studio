import React, { useEffect, useRef, useState } from "react";
import {
  searchPhotos,
  importPhoto,
  checkPhotoLibrary,
  StockPhoto,
} from "../services/image/pixabayService";
import type { SlideImage } from "../types/template";
export function StockPhotoPanel({
  canReplace,
  onInsert,
}: {
  canReplace: boolean;
  onInsert: (image: SlideImage, replace: boolean) => void;
}) {
  const [query, setQuery] = useState(""),
    [orientation, setOrientation] = useState("all");
  const [hits, setHits] = useState<StockPhoto[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false),
    [busy, setBusy] = useState<number | null>(null),
    [error, setError] = useState("");
  const [detail, setDetail] = useState<StockPhoto | null>(null);
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  const controller = useRef<AbortController>();
  const generation = useRef(0);
  const activeQuery = useRef({ q: "", orientation: "all" });
  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    setChecking(true);
    setError("");
    void checkPhotoLibrary(abort.signal)
      .then((result) => {
        if (active) setAvailable(result.available);
      })
      .catch((cause) => {
        if (active) {
          setAvailable(false);
          setError(cause.message);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [retry]);
  useEffect(
    () => () => {
      controller.current?.abort();
      generation.current++;
    },
    [],
  );
  const run = async (nextPage: number) => {
    const search =
      nextPage === 1 ? { q: query.trim(), orientation } : activeQuery.current;
    if (!search.q) return;
    controller.current?.abort();
    controller.current = new AbortController();
    const id = ++generation.current;
    setLoading(true);
    setError("");
    if (nextPage === 1) {
      activeQuery.current = search;
      setHits([]);
      setPage(0);
      setTotal(0);
      setDetail(null);
    }
    try {
      const result = await searchPhotos(
        search.q,
        search.orientation,
        nextPage,
        controller.current.signal,
      );
      if (id !== generation.current) return;
      setHits((old) =>
        nextPage === 1 ? result.hits : [...old, ...result.hits],
      );
      setPage(nextPage);
      setTotal(result.totalHits);
    } catch (e) {
      if (
        id === generation.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setError(e instanceof Error ? e.message : "Ricerca non riuscita.");
    } finally {
      if (id === generation.current) setLoading(false);
    }
  };
  const insert = async (photo: StockPhoto, replace: boolean) => {
    if (busy) return;
    controller.current?.abort();
    setLoading(false);
    setBusy(photo.id);
    setError("");
    const id = ++generation.current;
    try {
      const image = await importPhoto(photo);
      if (id === generation.current) onInsert(image, replace);
    } catch (e) {
      if (id === generation.current)
        setError(e instanceof Error ? e.message : "Inserimento non riuscito.");
    } finally {
      if (id === generation.current) setBusy(null);
    }
  };
  return (
    <section className="stock-panel">
      <h2>Foto</h2>
      <p>
        Cerca fotografie gratuite su{" "}
        <a href="https://pixabay.com" target="_blank" rel="noreferrer">
          Pixabay
        </a>
        .
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(1);
        }}
      >
        <input
          aria-label="Cerca fotografie"
          placeholder="Persone, scuola, viaggio…"
          maxLength={100}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Orientamento fotografie"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
        >
          <option value="all">Tutti gli orientamenti</option>
          <option value="horizontal">Orizzontale</option>
          <option value="vertical">Verticale</option>
        </select>
        <button
          type="submit"
          disabled={
            checking || !available || loading || busy !== null || !query.trim()
          }
        >
          Cerca
        </button>
      </form>
      {error && (
        <p role="alert" className="workspace-error">
          {error}
        </p>
      )}
      {checking && <p role="status">Verifica della libreria…</p>}
      {!checking && !available && (
        <button type="button" onClick={() => setRetry((value) => value + 1)}>
          Riprova connessione
        </button>
      )}
      {!hits.length && !loading && !error && (
        <p className="workspace-hint">
          Cerca una foto, inseriscila nella slide e applica lo stile
          Gentileschi.
        </p>
      )}
      {detail && (
        <article className="stock-detail">
          <button type="button" onClick={() => setDetail(null)}>
            ← Risultati
          </button>
          <img src={detail.webformatURL} alt={detail.tags} />
          <strong>{detail.user}</strong>
          <a href={detail.pageURL} target="_blank" rel="noreferrer">
            Vedi su Pixabay
          </a>
          <small>
            {detail.imageWidth} × {detail.imageHeight} · {detail.tags}
          </small>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void insert(detail, false)}
          >
            {busy === detail.id ? "Inserimento…" : "Aggiungi alla slide"}
          </button>
          <button
            type="button"
            disabled={!canReplace || busy !== null}
            onClick={() => void insert(detail, true)}
          >
            Sostituisci la foto selezionata
          </button>
        </article>
      )}
      <div className="stock-results">
        {!detail &&
          hits.map((photo) => (
            <button
              type="button"
              key={photo.id}
              aria-label={`Foto di ${photo.user}: ${photo.tags}`}
              onClick={() => setDetail(photo)}
            >
              <img src={photo.webformatURL} alt={photo.tags} loading="lazy" />
              <span>{photo.user} · Pixabay</span>
            </button>
          ))}
      </div>
      {loading && <p role="status">Ricerca…</p>}
      {!detail && page > 0 && hits.length < Math.min(total, 500) && (
        <button
          type="button"
          disabled={loading || busy !== null}
          onClick={() => void run(page + 1)}
        >
          Mostra altre foto
        </button>
      )}
    </section>
  );
}
