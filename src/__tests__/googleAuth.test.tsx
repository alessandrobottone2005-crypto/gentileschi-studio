import React from 'react';
import { renderToPipeableStream, renderToStaticMarkup } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from '../features/auth/AuthPage';
import { App } from '../App';
import { clearGoogleOAuthReturnError, continueWithGoogle, GOOGLE_AUTH_ERROR, googleOAuthReturnError } from '../features/auth/services/googleAuth';

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock('../shared/lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: { auth: { signInWithOAuth } },
}));

const replaceState = vi.fn();
function location(href: string) {
  const parsed = new URL(href);
  vi.stubGlobal('window', {
    location: { href, origin: parsed.origin, pathname: parsed.pathname, search: parsed.search, hash: parsed.hash },
    history: { replaceState },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  signInWithOAuth.mockReset();
  location('https://gentileschi-studio.vercel.app/');
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('Google sign in', () => {
  it('starts Google OAuth and returns to the current app origin', async () => {
    signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://accounts.google.com/' }, error: null });
    await continueWithGoogle();
    expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://gentileschi-studio.vercel.app', queryParams: { prompt: 'select_account' } } });
  });
  it.each(['provider', 'network', 'missing-url'])('returns a retryable error without provider details (%s)', async (failure) => {
    if (failure === 'network') signInWithOAuth.mockRejectedValueOnce(new Error('Private details'));
    else signInWithOAuth.mockResolvedValueOnce({ data: { url: null }, error: failure === 'provider' ? { message: 'Private details' } : null });
    await expect(continueWithGoogle()).rejects.toThrow(GOOGLE_AUTH_ERROR);
  });
  it('offers only Google as the sign-in method and links the privacy notice', () => {
    const html = renderToStaticMarkup(<AuthPage />);
    expect(html).toContain('Continua con Google');
    expect(html).toContain('href="/privacy"');
    expect(html).not.toContain('type="email"');
    expect(html).not.toContain('Invia link di accesso');
  });
  it('renders the privacy route without a session', async () => {
    location('https://gentileschi-studio.vercel.app/privacy');
    // Wait for lazy route modules, while retaining the assertion that privacy
    // renders without consulting an authenticated session.
    const html = await new Promise<string>((resolve, reject) => {
      const output = new PassThrough();
      let markup = '';
      output.on('data', (chunk) => { markup += chunk.toString(); });
      output.on('end', () => resolve(markup));
      output.on('error', reject);
      const stream = renderToPipeableStream(<App />, {
        onAllReady() { stream.pipe(output); },
        onError: reject,
      });
    });
    expect(html).toContain('Informativa sulla privacy');
    expect(html).toContain('Tutti gli utenti registrati');
    expect(html).not.toContain('Caricamento in corso');
  });
});

describe('OAuth callback errors', () => {
  it.each([['?error=access_denied', ''], ['', '#error=access_denied&error_description=Private-details']])('explains canceled consent', (search, hash) => {
    expect(googleOAuthReturnError(search, hash)).toBe('Accesso con Google annullato. Puoi riprovare quando vuoi.');
  });
  it('never displays provider descriptions or tokens', () => {
    expect(googleOAuthReturnError('?error=server_error&error_description=Secret', '#access_token=private'))
      .toBe('Accesso con Google non riuscito. Riprova.');
    expect(googleOAuthReturnError('', '#access_token=private&refresh_token=private')).toBe('');
  });
  it('cleans error parameters while preserving unrelated URL parameters', () => {
    location('https://gentileschi-studio.vercel.app/?view=login&error=access_denied#error_description=Private');
    clearGoogleOAuthReturnError();
    expect(replaceState).toHaveBeenCalledWith(null, '', '/?view=login');
  });
  it('leaves successful session tokens to the Supabase callback handler', () => {
    location('https://gentileschi-studio.vercel.app/#access_token=private&refresh_token=private');
    clearGoogleOAuthReturnError();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
