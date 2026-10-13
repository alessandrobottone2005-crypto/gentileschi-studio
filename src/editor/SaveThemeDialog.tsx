import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "../types/template";
import type { GraphicTheme } from "../types/scene";
import { clone } from "../engine/scene";
import { captureLegacyScene } from "../engine/captureLegacy";
import { listThemes, saveTheme } from "../services/supabase/themeService";
import { useDialogFocus } from "./useDialogFocus";
import { isSupabaseConfigured } from "../services/supabase/supabaseClient";

export function SaveThemeDialog({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (theme: GraphicTheme) => void;
}) {
  const [name, setName] = useState(`${project.title.slice(0, 110)} — Tema`);
  const [target, setTarget] = useState("new");
  const [themes, setThemes] = useState<GraphicTheme[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useDialogFocus(() => {
    if (!busy) onClose();
  });
  useEffect(() => {
    let active = true;
    void listThemes()
      .then((items) => {
        if (active) setThemes(items.filter((theme) => !theme.official));
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const existing = themes.find((theme) => theme.id === target);
      const slides = await Promise.all(
        project.slides.map(async (slide) => {
          const copy = clone(slide);
          delete copy.projectSettings;
          return { ...copy, scene: await captureLegacyScene(slide) };
        }),
      );
      const saved = await saveTheme({
        id: existing?.id || `theme-${crypto.randomUUID()}`,
        name,
        slides,
        format: project.format || "portrait",
        official: false,
        revision: existing?.revision,
      });
      onSaved(saved);
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  };
  return (
    <div className="studio-dialog-backdrop">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-theme-title"
        tabIndex={-1}
        className="studio-dialog"
      >
        <div className="studio-section-heading">
          <h2 id="save-theme-title">Salva come tema</h2>
          <button
            type="button"
            className="studio-icon-button"
            aria-label="Chiudi"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          Salva tutte le {project.slides.length} slide, nel loro ordine. I campi
          compilabili restano collegati; gli altri elementi conservano il
          contenuto attuale.
        </p>
        <form onSubmit={submit}>
          <label htmlFor="theme-name">Nome del tema</label>
          <input
            id="theme-name"
            maxLength={120}
            required
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
          <label htmlFor="theme-target">Salvataggio</label>
          <select
            id="theme-target"
            disabled={busy}
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              const chosen = themes.find(
                (theme) => theme.id === event.target.value,
              );
              if (chosen) setName(chosen.name);
            }}
          >
            <option value="new">
              {isSupabaseConfigured
                ? "Crea un nuovo tema condiviso"
                : "Crea un tema su questo dispositivo"}
            </option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                Aggiorna: {theme.name}
              </option>
            ))}
          </select>
          {target !== "new" && (
            <p>
              La versione in libreria sarà sostituita. I progetti già creati
              mantengono la propria composizione.
            </p>
          )}
          {error && (
            <p role="alert" className="app-error">
              {error}
            </p>
          )}
          <div className="studio-dialog-actions">
            <button
              type="button"
              className="studio-button"
              disabled={busy}
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="studio-button studio-button-lime"
              disabled={busy || !name.trim()}
            >
              {busy ? "Salvataggio…" : "Salva tema"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
