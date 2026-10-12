import React, { useState } from 'react';
import { supabase } from '../services/supabase/supabaseClient';

export const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSending(true);
    setError('');
    const result = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    setSending(false);
    if (result.error) setError(result.error.message);
    else setSent(true);
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="auth-eyebrow">LICEO GENTILESCHI</span>
        <h1>Gentileschi Studio</h1>
        <p>Accedi con un link inviato alla tua email per creare e modificare i post condivisi.</p>
        <label htmlFor="auth-email">Indirizzo email</label>
        <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@esempio.it" />
        {error && <p role="alert" className="auth-error">{error}</p>}
        {sent && <p role="status" className="auth-success">Controlla la posta e apri il link di accesso su questo dispositivo.</p>}
        <button type="submit" disabled={sending}>{sending ? 'Invio in corso...' : 'Invia link di accesso'}</button>
        <small>I progetti e le fotografie sono visibili a tutti gli utenti registrati.</small>
        <a className="auth-privacy-link" href="/privacy">Informativa sulla privacy</a>
      </form>
    </main>
  );
};
