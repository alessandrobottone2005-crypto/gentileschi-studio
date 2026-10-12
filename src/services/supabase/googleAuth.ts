import { supabase } from './supabaseClient';

export const GOOGLE_AUTH_ERROR = 'Impossibile avviare l’accesso con Google. Riprova tra poco.';

export function googleOAuthReturnError(search: string, hash: string): string {
  for (const source of [search.replace(/^\?/, ''), hash.replace(/^#/, '')]) {
    const params = new URLSearchParams(source);
    const error = params.get('error_code') || params.get('error');
    if (error === 'access_denied') return 'Accesso con Google annullato. Puoi riprovare quando vuoi.';
    if (error || params.has('error_description')) return 'Accesso con Google non riuscito. Riprova.';
  }
  return '';
}

/** Remove only OAuth error parameters; leave successful session tokens to Supabase. */
export function clearGoogleOAuthReturnError() {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  let changed = false;
  for (const params of [url.searchParams, hash]) {
    if (['error', 'error_code', 'error_description'].some((key) => params.has(key))) {
      for (const key of ['error', 'error_code', 'error_description']) params.delete(key);
      changed = true;
    }
  }
  if (changed) {
    url.hash = hash.toString();
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

export async function continueWithGoogle(): Promise<void> {
  if (!supabase) throw new Error('L’accesso online non è configurato.');
  try {
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
    });
    if (result.error || !result.data.url) throw new Error(GOOGLE_AUTH_ERROR);
  } catch {
    throw new Error(GOOGLE_AUTH_ERROR);
  }
}
