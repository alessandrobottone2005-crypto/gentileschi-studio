import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { aiLimits, quotaDay, quotaSummary } from '../server/aiLimits.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET')
    return res.status(405).json({ error: 'Metodo non consentito.' });
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token)
    return res
      .status(401)
      .json({ error: 'Accedi per vedere il tuo utilizzo AI.' });
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey =
    process.env.SUPABASE_SERVER_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey)
    return res
      .status(503)
      .json({ error: 'Utilizzo AI non disponibile. Riprova più tardi.' });
  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    if (error || !user)
      return res
        .status(401)
        .json({ error: 'Sessione scaduta. Accedi di nuovo.' });
    const server = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { day, resetsAt } = quotaDay();
    const keys = [`user:${user.id}`, 'global'];
    const { data, error: usageError } = await server
      .from('ai_usage')
      .select('quota_key,used')
      .eq('day', day)
      .in('quota_key', keys);
    if (usageError)
      return res
        .status(503)
        .json({ error: 'Impossibile leggere l’utilizzo AI. Riprova.' });
    const used = data?.find((row) => row.quota_key === keys[0])?.used ?? 0;
    const globalUsed =
      data?.find((row) => row.quota_key === 'global')?.used ?? 0;
    const { userLimit, globalLimit } = aiLimits();
    return res
      .status(200)
      .json({
        ...quotaSummary(used, globalUsed, userLimit, globalLimit),
        resetsAt,
      });
  } catch {
    return res
      .status(503)
      .json({ error: 'Utilizzo AI non disponibile. Riprova più tardi.' });
  }
}
