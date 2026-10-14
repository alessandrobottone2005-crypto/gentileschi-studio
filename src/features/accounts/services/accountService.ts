import { supabase } from '../../../shared/lib/supabaseClient';
import type { AiUsage, Author, Profile, StudioRole } from '../../../shared/types/studio';

export const LOCAL_USER_ID = 'local-device';
const LOCAL_NAME_KEY = 'gentileschi_display_name';
export function mapProfile(row: Record<string, any>): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    googleName: row.google_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
  };
}
export async function getProfile(userId: string): Promise<Profile> {
  if (!supabase)
    return {
      id: LOCAL_USER_ID,
      displayName: localStorage.getItem(LOCAL_NAME_KEY) || 'Questo dispositivo',
      googleName: '',
      email: '',
      avatarUrl: null,
      role: 'editor',
      createdAt: '',
    };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data)
    throw new Error('Impossibile caricare il profilo. Riprova.');
  return mapProfile(data);
}
export async function saveDisplayName(
  userId: string,
  name: string,
): Promise<Profile> {
  const clean = name.trim();
  if (clean.length < 1 || clean.length > 80)
    throw new Error('Il nome deve contenere da 1 a 80 caratteri.');
  if (!supabase) {
    localStorage.setItem(LOCAL_NAME_KEY, clean);
    return getProfile(userId);
  }
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: clean })
    .eq('id', userId)
    .select()
    .single();
  if (error || !data) throw new Error('Nome non salvato. Riprova.');
  return mapProfile(data);
}
export async function getAuthors(): Promise<Author[]> {
  if (!supabase) {
    const p = await getProfile(LOCAL_USER_ID);
    return [p];
  }
  const { data, error } = await supabase.rpc('studio_authors');
  if (error)
    throw new Error('Impossibile caricare i nomi degli autori. Riprova.');
  return (data || []).map((row: Record<string, any>) => ({
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }));
}
export async function getStudioUsers(): Promise<Profile[]> {
  if (!supabase)
    throw new Error('La gestione utenti richiede lo studio online.');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (error) throw new Error('Impossibile caricare gli utenti. Riprova.');
  return (data || []).map(mapProfile);
}
export async function setStudioRole(
  userId: string,
  role: StudioRole,
): Promise<void> {
  if (!supabase) throw new Error('Studio online non disponibile.');
  const { error } = await supabase.rpc('set_studio_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) {
    if (error.message.includes('almeno un amministratore'))
      throw new Error('Lo studio deve mantenere almeno un amministratore.');
    if (error.code === '42501')
      throw new Error('Solo un amministratore può cambiare i ruoli.');
    throw new Error(
      'Cambio di ruolo non riuscito. Aggiorna gli utenti e riprova.',
    );
  }
}
export async function getAiUsage(): Promise<AiUsage> {
  if (!supabase)
    throw new Error('Accedi allo studio online per vedere il tuo utilizzo AI.');
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Sessione scaduta. Accedi di nuovo.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/api/account', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    });
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new Error('Utilizzo AI disponibile sul sito pubblicato.');
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || 'Impossibile caricare l’utilizzo AI.');
    if (
      !Number.isInteger(data.used) ||
      !Number.isInteger(data.limit) ||
      !Number.isInteger(data.available) ||
      !Number.isInteger(data.remaining) ||
      !Number.isFinite(Date.parse(data.resetsAt))
    )
      throw new Error('Risposta utilizzo AI non valida. Riprova.');
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new Error('Il server non risponde. Riprova.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
