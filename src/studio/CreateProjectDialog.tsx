import React, { useState } from 'react';
import { Layers, Image, X } from 'lucide-react';
import { useDialogFocus } from '../editor/useDialogFocus';
import { createInitialProject } from '../engine/defaultData';
import { saveProject } from '../services/supabase/projectService';

export function CreateProjectDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'single' | 'carousel'>('carousel');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => {
    if (!busy) onClose();
  };
  const ref = useDialogFocus(close);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const project = createInitialProject(type);
      if (title.trim()) project.title = title.trim();
      const saved = await saveProject(project);
      onCreated(saved.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Creazione non riuscita. Riprova.',
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
        className="studio-dialog"
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
            {(['single', 'carousel'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={type === value}
                onClick={() => setType(value)}
                disabled={busy}
              >
                {value === 'single' ? (
                  <Image size={22} />
                ) : (
                  <Layers size={22} />
                )}
                <span>{value === 'single' ? 'Post singolo' : 'Carosello'}</span>
              </button>
            ))}
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
              {busy ? 'Creazione…' : 'Crea progetto'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
