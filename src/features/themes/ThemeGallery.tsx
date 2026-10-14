import "../../shared/styles/graphics.css";
import "../../shared/styles/workspace.css";
import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Trash2 } from "lucide-react";
import type { GraphicTheme } from "../../shared/types/scene";
import { FORMATS } from "../../shared/types/scene";
import { TemplateWrapper } from "../../shared/rendering/TemplateWrapper";
import { renderSlideTemplate } from "../../shared/rendering/registry";

export function ThemeGallery({
  themes,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  themes: GraphicTheme[];
  selected: string;
  onSelect: (theme: GraphicTheme) => void;
  onDuplicate?: (theme: GraphicTheme) => void;
  onDelete?: (theme: GraphicTheme) => void;
}) {
  const [preview, setPreview] = useState<GraphicTheme | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const display = themes.filter(
    (t) =>
      t.slides.length && t.name.toLowerCase().includes(query.toLowerCase()),
  );
  const thumbnail = (theme: GraphicTheme, index: number, width: number) => {
    const size = FORMATS[theme.format];
    return (
      <TemplateWrapper
        width={size.width}
        height={size.height}
        scale={width / size.width}
      >
        {renderSlideTemplate(theme.slides[index], theme.format)}
      </TemplateWrapper>
    );
  };
  return (
    <div className="theme-browser">
      <input
        aria-label="Cerca temi"
        placeholder="Cerca un tema…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {preview ? (
        <section
          className="theme-detail"
          aria-label={`Anteprima ${preview.name}`}
        >
          <button
            type="button"
            className="theme-back"
            onClick={() => setPreview(null)}
          >
            <ChevronLeft size={16} /> Tutti i temi
          </button>
          <strong>{preview.name}</strong>
          <div className="theme-large-preview">
            {thumbnail(preview, page, 240)}
          </div>
          <div className="theme-page-controls">
            <button
              type="button"
              aria-label="Slide precedente del tema"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {page + 1} / {preview.slides.length}
            </span>
            <button
              type="button"
              aria-label="Slide successiva del tema"
              disabled={page === preview.slides.length - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            className="theme-use"
            onClick={() => {
              onSelect(preview);
              setPreview(null);
            }}
          >
            <Check size={17} /> Usa questo tema
          </button>
        </section>
      ) : (
        <div className="theme-gallery">
          {display.map((theme) => (
            <article
              className={`theme-card ${selected === theme.id ? "is-selected" : ""}`}
              key={theme.id}
            >
              <button
                type="button"
                className="theme-card-select"
                aria-label={`Anteprima tema ${theme.name}`}
                aria-pressed={selected === theme.id}
                onClick={() => {
                  setPreview(theme);
                  setPage(0);
                }}
              >
                <span className="theme-cover" aria-hidden="true">
                  {thumbnail(theme, 0, 160)}
                </span>
                <strong>{theme.name}</strong>
                <small>
                  {theme.official ? "Ufficiale" : "Personalizzato"} ·{" "}
                  {theme.slides.length} slide
                </small>
                {selected === theme.id && (
                  <span className="theme-selected">
                    <Check size={13} /> Selezionato
                  </span>
                )}
              </button>
              {!theme.official && (
                <div className="theme-card-actions">
                  {onDuplicate && (
                    <button
                      type="button"
                      aria-label={`Duplica ${theme.name}`}
                      onClick={() => onDuplicate(theme)}
                    >
                      <Copy size={15} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      aria-label={`Elimina ${theme.name}`}
                      onClick={() => onDelete(theme)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
          {!display.length && <p>Nessun tema trovato.</p>}
        </div>
      )}
    </div>
  );
}
