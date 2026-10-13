import React, { useState, useEffect } from "react";
import { Layers, Image, X } from "lucide-react";
import { useDialogFocus } from "../editor/useDialogFocus";
import { officialThemes, projectFromTheme } from "../engine/themes";
import { listThemes } from "../services/supabase/themeService";
import { ThemeGallery } from "./ThemeGallery";
import { FORMATS, GraphicTheme, ProjectFormat } from "../types/scene";
import { saveProject } from "../services/supabase/projectService";

export function CreateProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"single" | "carousel">("carousel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("portrait");
  const [themes, setThemes] = useState<GraphicTheme[]>(officialThemes);
  const [theme, setTheme] = useState(themes[0]);
  const [themeError, setThemeError] = useState("");
  const loadThemes = () =>
    listThemes()
      .then((items) => {
        setThemes(items);
        setThemeError("");
      })
      .catch((cause) => setThemeError(cause.message));
  useEffect(() => {
    let active = true;
    void listThemes()
      .then((items) => {
        if (active) setThemes(items);
      })
      .catch((cause) => {
        if (active) setThemeError(cause.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const close = () => {
    if (!busy) onClose();
  };
  const ref = useDialogFocus(close);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const project = await projectFromTheme(theme, type, format);
      if (title.trim()) project.title = title.trim();
      const saved = await saveProject(project);
      onCreated(saved.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Creazione non riuscita. Riprova.",
      );
      setBusy(false);
    }
  };
  return (
    <div className="studio-dialog-backdrop">
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="studio-dialog graphic-dialog"
      >
        <div className="studio-section-heading">
          <h2 id="create-project-title">Nuovo progetto</h2>
          <button
            type="button"
            className="studio-icon-button"
            aria-label="Chiudi"
            onClick={close}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="project-title">Titolo del progetto</label>
          <input
            id="project-title"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Assemblea di novembre"
            disabled={busy}
          />
          <fieldset className="studio-type-picker">
            <legend>Formato</legend>
            {(["single", "carousel"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={type === value}
                onClick={() => setType(value)}
                disabled={busy}
              >
                {value === "single" ? (
                  <Image size={22} />
                ) : (
                  <Layers size={22} />
                )}
                <span>{value === "single" ? "Post singolo" : "Carosello"}</span>
              </button>
            ))}
          </fieldset>
          <label htmlFor="project-format">Dimensioni</label>
          <select
            id="project-format"
            value={format}
            disabled={busy}
            onChange={(event) => setFormat(event.target.value as ProjectFormat)}
          >
            {Object.entries(FORMATS).map(([key, value]) => (
              <option value={key} key={key}>
                {value.label} — {value.width} × {value.height}
              </option>
            ))}
          </select>
          <fieldset className="graphic-theme-picker" disabled={busy}>
            <legend>Grafica di base</legend>
            {themeError && (
              <p role="alert" className="app-error">
                {themeError}
                <button type="button" onClick={loadThemes}>
                  Riprova
                </button>
              </p>
            )}
            <ThemeGallery
              themes={themes}
              selected={theme.id}
              onSelect={setTheme}
            />
          </fieldset>
          {error && (
            <p role="alert" className="studio-inline-error">
              {error}
            </p>
          )}
          <div className="studio-dialog-actions">
            <button
              type="button"
              className="studio-button"
              onClick={close}
              disabled={busy}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="studio-button studio-button-lime"
              disabled={busy}
            >
              {busy ? "Creazione…" : "Crea progetto"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
