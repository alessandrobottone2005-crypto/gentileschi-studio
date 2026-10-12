import React, { useEffect, useState } from 'react';
import type { Profile } from '../types/studio';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import {
  getAiUsage,
  saveDisplayName,
} from '../services/supabase/accountService';
import { useResource } from './useResource';
import { Avatar, formatDate, ResourceError, roleLabel } from './StudioUi';

export function AccountPanel({
  profile,
  projectsCount,
  photosCount,
  onSaved,
}: {
  profile: Profile;
  projectsCount: number | null;
  photosCount: number | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(profile.displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setName(profile.displayName);
  }, [profile.displayName]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await saveDisplayName(profile.id, name);
      setSaved(true);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Nome non salvato. Riprova.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <section className="studio-account-identity" aria-label="Profilo">
        <Avatar person={profile} size="large" />
        <div className="studio-identity-info">
          <h2>{profile.displayName}</h2>
          <p className="studio-identity-email">
            {profile.email || 'Profilo locale su questo dispositivo'}
          </p>
          <span className="studio-role-badge">{roleLabel(profile.role)}</span>
          {profile.createdAt && (
            <p className="studio-registered">
              Nello studio dal {formatDate(profile.createdAt)}
            </p>
          )}
        </div>
        <form className="studio-name-form" onSubmit={submit}>
          <label htmlFor="display-name">Nome visualizzato</label>
          <input
            id="display-name"
            value={name}
            maxLength={80}
            required
            disabled={saving}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
          <button
            type="submit"
            className="studio-button studio-button-lime"
            disabled={
              saving || !name.trim() || name.trim() === profile.displayName
            }
          >
            {saving ? 'Salvataggio…' : 'Salva nome'}
          </button>
          <small>Il nome cambia solo in Gentileschi Studio.</small>
          {saved && (
            <span className="studio-success" role="status">
              Nome salvato.
            </span>
          )}
          {error && (
            <span className="studio-inline-error" role="alert">
              {error}
            </span>
          )}
        </form>
      </section>
      <dl className="studio-stat-strip">
        <div>
          <dt>Progetti creati</dt>
          <dd>{projectsCount ?? '—'}</dd>
        </div>
        <div>
          <dt>Foto caricate</dt>
          <dd>{photosCount ?? '—'}</dd>
        </div>
        <div>
          <dt>Accesso</dt>
          <dd className="studio-stat-text">
            {isSupabaseConfigured ? 'Google' : 'Locale'}
          </dd>
        </div>
      </dl>
      {isSupabaseConfigured ? (
        <AiUsagePanel />
      ) : (
        <p className="studio-muted">
          Il profilo Google e l’utilizzo AI sono disponibili nello studio
          online.
        </p>
      )}
    </>
  );
}
function AiUsagePanel() {
  const quota = useResource(getAiUsage);
  useEffect(() => {
    const refresh = () => {
      void quota.reload();
    };
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, [quota.reload]);
  return (
    <section className="studio-ai-panel" aria-labelledby="ai-usage-title">
      <div className="studio-section-heading">
        <h2 id="ai-usage-title">Utilizzo AI</h2>
        <button
          type="button"
          className="studio-text-button"
          onClick={quota.reload}
          disabled={quota.loading}
        >
          Aggiorna
        </button>
      </div>
      {quota.error ? (
        <ResourceError message={quota.error} retry={quota.reload} />
      ) : quota.loading ? (
        <p role="status" className="studio-muted">
          Caricamento utilizzo AI…
        </p>
      ) : (
        quota.data && (
          <>
            <p>Richieste di oggi</p>
            <div className="studio-quota-number">
              {quota.data.used}
              <span> / {quota.data.limit}</span>
            </div>
            <progress
              value={Math.min(quota.data.used, quota.data.limit)}
              max={quota.data.limit}
              aria-label={`${quota.data.used} richieste consumate su ${quota.data.limit}`}
            />
            <div className="studio-quota-details">
              <p>
                {quota.data.available === 0
                  ? 'Nessuna richiesta disponibile al momento.'
                  : `${quota.data.available} richieste disponibili.`}
                {quota.data.available < quota.data.remaining &&
                  ' Il limite condiviso dello studio riduce la disponibilità.'}
              </p>
              <p>
                Si azzera il{' '}
                {new Date(quota.data.resetsAt).toLocaleString('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
                .
              </p>
            </div>
            <small className="studio-muted">
              Le richieste vengono conteggiate anche se la generazione fallisce
              dopo aver consumato la quota.
            </small>
          </>
        )
      )}
    </section>
  );
}
