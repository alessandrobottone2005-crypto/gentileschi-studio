import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "../../../shared/types/template";
import type { GraphicTheme } from "../../../shared/types/scene";
import { FORMATS } from "../../../shared/types/scene";
import { useDialogFocus } from "../../../shared/hooks/useDialogFocus";
import { TemplateWrapper } from "../../../shared/rendering/TemplateWrapper";
import { renderSlideTemplate } from "../../../shared/rendering/registry";
import { ThemeGallery } from "../../themes/ThemeGallery";
import {
  listThemes,
  saveTheme,
  deleteTheme,
} from "../../themes/services/themeService";
import { originalTheme, officialThemes } from "../../themes/model/themes";

export function ProjectReviewDialog({
  title,
  choices,
  build,
  onApply,
  onClose,
  withThemes = false,
  initialTheme,
}: {
  title: string;
  choices: [string, string];
  build: (
    preserve: boolean,
    theme?: GraphicTheme,
  ) => Promise<{ project: Project; warnings: string[] }>;
  onApply: (project: Project) => void;
  onClose: () => void;
  withThemes?: boolean;
  initialTheme?: GraphicTheme;
}) {
  const [preserve, setPreserve] = useState(false);
  const [themes, setThemes] = useState<GraphicTheme[]>(officialThemes);
  const [theme, setTheme] = useState(initialTheme || themes[0]);
  const [review, setReview] = useState<{
    project: Project;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const [libraryError, setLibraryError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<GraphicTheme | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useDialogFocus(onClose);
  const generation = useRef(0);
  const reload = () =>
    listThemes()
      .then((items) => {
        setThemes(items);
        setLibraryError("");
      })
      .catch((cause) => setLibraryError(cause.message));
  useEffect(() => {
    if (withThemes) void reload();
  }, [withThemes]);
  useEffect(() => {
    const request = ++generation.current;
    let active = true;
    setReview(null);
    setError("");
    void build(preserve, withThemes ? theme : undefined)
      .then((next) => {
        if (active && request === generation.current) setReview(next);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [preserve, theme, build, withThemes]);
  const copy = async (source: GraphicTheme) => {
    setBusy(true);
    try {
      const saved = await saveTheme({
        ...source,
        id: `theme-${crypto.randomUUID()}`,
        name: `${source.name.slice(0, 110)} (Copia)`,
        official: false,
        revision: undefined,
      });
      await reload();
      setTheme(saved);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteTheme(pendingDelete);
      if (theme.id === pendingDelete.id) setTheme(originalTheme());
      setPendingDelete(null);
      await reload();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const size = FORMATS[review?.project.format || "portrait"];
  return (
    <div className="studio-dialog-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-review-title"
        tabIndex={-1}
        className="studio-dialog graphic-dialog"
      >
        <div className="studio-section-heading">
          <h2 id="project-review-title">{title}</h2>
          <button
            type="button"
            className="studio-icon-button"
            aria-label="Chiudi"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {withThemes && (
          <>
            <p>Il tema si applica a tutto il progetto.</p>
            {libraryError && (
              <p role="alert" className="app-error">
                {libraryError}
                <button type="button" onClick={reload}>
                  Riprova
                </button>
              </p>
            )}
            <ThemeGallery
              themes={themes}
              selected={theme.id}
              onSelect={setTheme}
              onDuplicate={busy ? undefined : copy}
              onDelete={setPendingDelete}
            />
          </>
        )}
        {pendingDelete && (
          <div className="app-error" role="alert">
            Eliminare «{pendingDelete.name}» dalla libreria? I progetti
            esistenti mantengono la propria grafica.
            <button type="button" disabled={busy} onClick={remove}>
              Elimina tema
            </button>
            <button type="button" onClick={() => setPendingDelete(null)}>
              Annulla
            </button>
          </div>
        )}
        <fieldset className="graphic-choice">
          <legend>Come applicare la modifica</legend>
          {[false, true].map((value, index) => (
            <label key={String(value)}>
              <input
                type="radio"
                name="preserve-graphics"
                checked={preserve === value}
                onChange={() => setPreserve(value)}
              />
              {choices[index]}
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="app-error">
            {error}
          </p>
        )}
        {!review && !error && <p role="status">Preparazione dell’anteprima…</p>}
        {review && (
          <>
            <div className="graphic-review-previews">
              {review.project.slides.map((slide, index) => (
                <div key={slide.id}>
                  <TemplateWrapper
                    scale={0.14}
                    width={size.width}
                    height={size.height}
                  >
                    {renderSlideTemplate(slide, review.project.format)}
                  </TemplateWrapper>
                  <small>Slide {index + 1}</small>
                </div>
              ))}
            </div>
            {review.warnings.length > 0 && (
              <div role="status" className="graphic-warnings">
                {review.warnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            )}
          </>
        )}
        <div className="studio-dialog-actions">
          <button type="button" className="studio-button" onClick={onClose}>
            Annulla
          </button>
          <button
            type="button"
            className="studio-button studio-button-primary"
            disabled={!review || busy || !!pendingDelete}
            onClick={() => {
              if (review) onApply(review.project);
            }}
          >
            Applica
          </button>
        </div>
      </section>
    </div>
  );
}
