import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AiGeneratedCarouselResponseSchema } from '../../src/services/ai/schemas';

const carouselInput = z.object({ mode: z.literal('carousel'), prompt: z.string().trim().min(1).max(6000) });
const captionInput = z.object({
  mode: z.literal('caption'),
  projectTitle: z.string().trim().min(1).max(200),
  slidesSummary: z.string().trim().min(1).max(12000),
});
const inputSchema = z.discriminatedUnion('mode', [carouselInput, captionInput]);

const CAROUSEL_PROMPT = `Sei l'assistente dei rappresentanti del Liceo Gentileschi. Crea un carosello Instagram in italiano usando solo i template cover, agenda e notice. Non inventare date, orari o regole: segnala le informazioni mancanti in missingInformation. Rispondi solo con JSON valido nella forma {"projectTitle":"...","slides":[{"templateType":"cover","content":{"title":"...","day":"...","month":"...","timeSlot":"..."}},{"templateType":"agenda","content":{"title":"O.D.G.","subtitle":"ORDINE DEL GIORNO","items":[{"id":"1","number":"01","text":"...","isHighlight":false}]}},{"templateType":"notice","content":{"title":"IMPORTANTE!","highlightQuantity":"2","highlightLabel":"STUDENTI PER CLASSE","badgeText":"NUOVA REGOLA","paragraph1":"...","paragraph2":"...","ctaText":"PARTECIPARE FA LA DIFFERENZA"}}],"missingInformation":[],"caption":"..."}.`;
const CAPTION_PROMPT = `Scrivi una caption Instagram chiara e coinvolgente in italiano per i rappresentanti del Liceo Gentileschi. Non inventare date, orari o fatti. Restituisci solo il testo della caption.`;
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];

function dailyLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse(match ? match[1] : trimmed);
}

async function generateWithGemini(apiKey: string, prompt: string, json: boolean): Promise<string> {
  let lastError = 'Il servizio AI non è disponibile.';
  for (const model of MODELS) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: json ? 0.2 : 0.7, ...(json ? { responseMimeType: 'application/json' } : {}) },
      }),
    });
    if (response.ok) {
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string' && text.trim()) return text.trim();
      lastError = 'Risposta AI vuota.';
      continue;
    }
    lastError = `Errore del servizio AI (${response.status}).`;
    if (![404, 429, 503].includes(response.status)) break;
  }
  throw new Error(lastError);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito.' });
  const input = inputSchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Richiesta non valida.' });

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVER_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!url || !anonKey || !serviceKey || !geminiKey) return res.status(503).json({ error: 'Servizio AI non configurato.' });

  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Accedi per usare l’assistente AI.' });
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Sessione non valida.' });

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const userLimit = dailyLimit(process.env.AI_USER_DAILY_LIMIT, 20);
  const globalLimit = dailyLimit(process.env.AI_GLOBAL_DAILY_LIMIT, 500);
  const { data: allowed, error: quotaError } = await adminClient.rpc('consume_ai_quota', {
    p_user_id: user.id,
    p_user_limit: userLimit,
    p_global_limit: globalLimit,
  });
  if (quotaError) return res.status(503).json({ error: 'Limite AI non disponibile. Riprova più tardi.' });
  if (!allowed) return res.status(429).json({ error: 'Limite giornaliero AI raggiunto. Riprova domani.' });

  try {
    if (input.data.mode === 'carousel') {
      const text = await generateWithGemini(geminiKey, `${CAROUSEL_PROMPT}\n\nRichiesta: ${input.data.prompt}`, true);
      return res.status(200).json(AiGeneratedCarouselResponseSchema.parse(parseJson(text)));
    }
    const text = await generateWithGemini(geminiKey,
      `${CAPTION_PROMPT}\n\nTitolo: ${input.data.projectTitle}\nSlide: ${input.data.slidesSummary}`, false);
    return res.status(200).json({ caption: text });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Generazione non riuscita.' });
  }
}
