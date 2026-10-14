import React, { useState } from 'react';
import {
  getStudioUsers,
  setStudioRole,
} from './services/accountService';
import type { Profile, StudioRole } from '../../shared/types/studio';
import { useResource } from '../../shared/hooks/useResource';
import { useDialogFocus } from '../../shared/hooks/useDialogFocus';
import { Avatar, formatDate, ResourceError, roleLabel } from '../../shared/ui/StudioUi';

function RoleDialog({
  user,
  role,
  onClose,
  onSaved,
}: {
  user: Profile;
  role: StudioRole;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ref = useDialogFocus(() => {
    if (!busy) onClose();
  });
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await setStudioRole(user.id, role);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Cambio di ruolo non riuscito.',
      );
      setBusy(false);
    }
  };
  return (
    <div className="studio-dialog-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-dialog-title"
        ref={ref}
        tabIndex={-1}
        className="studio-dialog"
      >
        <h2 id="role-dialog-title">Cambiare il ruolo?</h2>
        <p>
          {user.displayName} diventerà{' '}
          {role === 'admin'
            ? 'amministratore e potrà gestire i ruoli degli altri utenti'
            : 'editor e continuerà a gestire tutti i progetti dello studio'}
          .
        </p>
        {error && (
          <p className="app-error" role="alert">
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
            type="button"
            className="studio-button studio-button-primary"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'Salvataggio…' : 'Conferma ruolo'}
          </button>
        </div>
      </section>
    </div>
  );
}
export function UsersPanel({
  currentId,
  onRolesChanged,
}: {
  currentId: string;
  onRolesChanged: () => void;
}) {
  const users = useResource(getStudioUsers);
  const [search, setSearch] = useState('');
  const [change, setChange] = useState<{
    user: Profile;
    role: StudioRole;
  } | null>(null);
  const admins =
    users.data?.filter((user) => user.role === 'admin').length || 0;
  const filtered = (users.data || []).filter((user) =>
    `${user.displayName} ${user.email}`
      .toLocaleLowerCase('it')
      .includes(search.toLocaleLowerCase('it')),
  );
  return (
    <>
      <p className="studio-permissions-note">
        Chi accede con Google entra come editor e può creare, modificare ed
        eliminare tutti i progetti. Gli amministratori gestiscono anche i ruoli.
      </p>
      <div className="studio-toolbar">
        <input
          type="search"
          aria-label="Cerca utenti"
          placeholder="Cerca nome o email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="button"
          className="studio-button"
          disabled={users.loading}
          onClick={users.reload}
        >
          Aggiorna utenti
        </button>
      </div>
      {users.error && (
        <ResourceError message={users.error} retry={users.reload} />
      )}
      {users.loading ? (
        <p role="status" className="studio-loading">
          Caricamento utenti…
        </p>
      ) : (
        !users.error && (
          <div className="studio-user-list">
            {filtered.map((user) => (
              <article key={user.id} className="studio-user-row">
                <Avatar person={user} />
                <div className="studio-user-info">
                  <h2>
                    {user.displayName}
                    {user.id === currentId && (
                      <span className="studio-you-label">Tu</span>
                    )}
                  </h2>
                  <p>{user.email}</p>
                  <small>Nello studio dal {formatDate(user.createdAt)}</small>
                </div>
                <span className="studio-role-badge">
                  {roleLabel(user.role)}
                </span>
                <button
                  type="button"
                  className="studio-button"
                  disabled={user.role === 'admin' && admins === 1}
                  title={
                    user.role === 'admin' && admins === 1
                      ? 'Lo studio deve mantenere un amministratore'
                      : undefined
                  }
                  onClick={() =>
                    setChange({
                      user,
                      role: user.role === 'admin' ? 'editor' : 'admin',
                    })
                  }
                >
                  {user.role === 'admin' ? 'Rendi editor' : 'Rendi admin'}
                </button>
              </article>
            ))}
            {filtered.length === 0 && (
              <p className="studio-loading">
                Nessun utente corrisponde alla ricerca.
              </p>
            )}
          </div>
        )
      )}
      {change && (
        <RoleDialog
          {...change}
          onClose={() => setChange(null)}
          onSaved={() => {
            setChange(null);
            void users.reload();
            onRolesChanged();
          }}
        />
      )}
    </>
  );
}
