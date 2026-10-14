import { Brand } from '../../shared/ui/Brand';
import React, { useEffect, useState } from 'react';
import { clearGoogleOAuthReturnError, continueWithGoogle, googleOAuthReturnError } from './services/googleAuth';

export const AuthPage: React.FC = () => {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(() => typeof window === 'undefined' ? ''
    : googleOAuthReturnError(window.location.search, window.location.hash));

  useEffect(() => { clearGoogleOAuthReturnError(); }, []);

  const handleGoogleLogin = async () => {
    if (opening) return;
    setOpening(true);
    setError('');
    try {
      await continueWithGoogle();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Accesso con Google non riuscito. Riprova.');
      setOpening(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Brand variant="school" />
        <h1 id="auth-title">Entra nello studio</h1>
        <p>Crea e modifica post e caroselli Instagram per la rappresentanza studentesca. Accedi con il tuo account Google per iniziare.</p>
        {error && <p role="alert" className="auth-error">{error}</p>}
        <button type="button" className="google-auth-button" onClick={handleGoogleLogin} disabled={opening}>
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 48 48">
            <path fill="currentColor" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="currentColor" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.04 46.98 31.9 46.98 24.55z" />
            <path fill="currentColor" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.86 23.86 0 0 0 0 24c0 3.87.94 7.53 2.56 10.78l7.97-6.19z" />
            <path fill="currentColor" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {opening ? 'Apertura accesso Google…' : 'Continua con Google'}
        </button>
        {opening && <p role="status" className="auth-success">Ti stiamo indirizzando a Google.</p>}
        <small>I progetti e le fotografie sono visibili a tutti gli utenti registrati.</small>
        <a className="auth-privacy-link" href="/privacy">Informativa sulla privacy</a>
      </section>
    </main>
  );
};
