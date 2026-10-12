import React, { useState } from 'react';
import {
  ArrowUpRight,
  Copy,
  Pencil,
  Trash2,
  Check,
  X,
  Layers,
  Image,
} from 'lucide-react';
import type { Project } from '../types/template';
import type { Author } from '../types/studio';
import {
  duplicateProject,
  deleteProject,
  saveProject,
} from '../services/supabase/projectService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { useDialogFocus } from '../editor/useDialogFocus';
import { formatDate } from './StudioUi';

export function isOwnProject(project: Project, userId: string, local: boolean) {
  return local || project.userId === userId;
}
function DeleteDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => {
    if (!busy) onClose();
  };
  const ref = useDialogFocus(close);
  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteProject(project.id);
      onDeleted();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Eliminazione non riuscita.',
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
        aria-labelledby="delete-project-title"
        className="studio-dialog"
      >
        <h2 id="delete-project-title">Eliminare questo progetto?</h2>
        <p>
          “{project.title}” verrà eliminato dallo studio condiviso. Le
          fotografie resteranno nella libreria.
        </p>
        {error && (
          <p role="alert" className="studio-inline-error">
            {error}
          </p>
        )}
        <div className="studio-dialog-actions">
          <button className="studio-button" onClick={close} disabled={busy}>
            Annulla
          </button>
          <button
            className="studio-button studio-button-danger"
            onClick={remove}
            disabled={busy}
          >
            {busy ? 'Eliminazione…' : 'Elimina progetto'}
          </button>
        </div>
      </section>
    </div>
  );
}
export function ProjectList({
  projects,
  authors,
  onOpen,
  onChanged,
}: {
  projects: Project[];
  authors: Author[];
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Project | null>(null);
  const run = async (id: string, action: () => Promise<unknown>) => {
    if (busyId) return;
    setBusyId(id);
    setError('');
    try {
      await action();
      setRenaming(null);
      onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Operazione non riuscita.',
      );
    } finally {
      setBusyId(null);
    }
  };
  return (
    <>
      {error && (
        <div role="alert" className="app-error">
          {error}
        </div>
      )}
      <div className="studio-project-list">
        {projects.map((project) => (
          <article key={project.id} className="studio-project-row">
            <span className="studio-project-format" aria-hidden="true">
              {project.type === 'carousel' ? (
                <Layers size={23} />
              ) : (
                <Image size={23} />
              )}
            </span>
            <div className="studio-project-info">
              {renaming === project.id ? (
                <form
                  className="studio-rename"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (title.trim())
                      void run(project.id, () =>
                        saveProject({ ...project, title: title.trim() }),
                      );
                  }}
                >
                  <input
                    aria-label="Nuovo titolo del progetto"
                    value={title}
                    maxLength={200}
                    autoFocus
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setRenaming(null);
                    }}
                    disabled={busyId !== null}
                  />
                  <button
                    className="studio-icon-button"
                    aria-label="Salva titolo"
                    disabled={!title.trim() || busyId !== null}
                  >
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    className="studio-icon-button"
                    aria-label="Annulla rinomina"
                    onClick={() => setRenaming(null)}
                    disabled={busyId !== null}
                  >
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="studio-project-title"
                  onClick={() => onOpen(project.id)}
                >
                  {project.title}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              )}
              <p>
                {project.type === 'carousel'
                  ? `Carosello · ${project.slides.length} slide`
                  : 'Post singolo'}
                <span className="studio-project-author">
                  {' '}
                  ·{' '}
                  {authors.find((person) => person.id === project.userId)
                    ?.displayName ||
                    (isSupabaseConfigured || project.userId
                      ? 'Autore non disponibile'
                      : 'Questo dispositivo')}
                </span>
              </p>
            </div>
            <time className="studio-project-date" dateTime={project.updatedAt}>
              {formatDate(project.updatedAt)}
            </time>
            <div className="studio-project-actions">
              <button
                type="button"
                className="studio-icon-button"
                aria-label={`Rinomina ${project.title}`}
                disabled={busyId !== null}
                onClick={() => {
                  setRenaming(project.id);
                  setTitle(project.title);
                }}
              >
                <Pencil size={17} />
              </button>
              <button
                type="button"
                className="studio-icon-button"
                aria-label={`Duplica ${project.title}`}
                disabled={busyId !== null}
                onClick={() =>
                  void run(project.id, () => duplicateProject(project.id))
                }
              >
                <Copy size={17} />
              </button>
              <button
                type="button"
                className="studio-icon-button studio-danger-text"
                aria-label={`Elimina ${project.title}`}
                disabled={busyId !== null}
                onClick={() => setDeleting(project)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {deleting && (
        <DeleteDialog
          project={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}
