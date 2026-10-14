import React, { useState } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import type { Author, Profile } from '../types/studio';

export function Avatar({
  person,
  size = 'normal',
}: {
  person: Pick<Author, 'displayName' | 'avatarUrl'> | null;
  size?: 'normal' | 'large' | 'small';
}) {
  const [failed, setFailed] = useState(false);
  const initials =
    person?.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'GS';
  return (
    <span className={`studio-avatar studio-avatar-${size}`} aria-hidden="true">
      {person?.avatarUrl && !failed ? (
        <img
          src={person.avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
export function roleLabel(role?: Profile['role']) {
  return role === 'admin' ? 'Amministratore' : 'Editor';
}
export function ResourceError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div role="alert" className="app-error">
      {message}
      <button type="button" onClick={retry}>
        Riprova
      </button>
    </div>
  );
}
export function EmptyProjects({
  onCreate,
  personal = false,
}: {
  onCreate: () => void;
  personal?: boolean;
}) {
  return (
    <div className="studio-empty">
      <FolderOpen size={32} aria-hidden="true" />
      <h3>
        {personal ? 'Nessun progetto creato da te' : 'Nessun progetto creato'}
      </h3>
      <p>
        {personal
          ? 'I tuoi prossimi lavori appariranno qui e saranno condivisi con lo studio.'
          : 'Lo studio è pronto per il prossimo post o carosello.'}
      </p>
      <button
        type="button"
        className="studio-button studio-button-primary"
        onClick={onCreate}
      >
        <Plus size={17} />
        Crea {personal ? 'un progetto' : 'il primo progetto'}
      </button>
    </div>
  );
}
export function formatDate(date: string | null) {
  if (!date || !Number.isFinite(Date.parse(date)))
    return 'Data non disponibile';
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
