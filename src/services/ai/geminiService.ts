import { AiGeneratedCarouselResponse, AiGeneratedCarouselResponseSchema } from './schemas';
import { supabase } from '../supabase/supabaseClient';

export function extractJson(rawText: string): string {
  const trimmed = rawText.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;
}

async function callAi(payload: Record<string, unknown>): Promise<unknown> {
  if (!supabase) throw new Error('L’assistente AI richiede l’accesso online. Puoi continuare a creare post manualmente.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Accedi per usare l’assistente AI.');

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Generazione non riuscita. Riprova.');
  return result;
}

export async function generateCarouselWithAi(prompt: string): Promise<AiGeneratedCarouselResponse> {
  return AiGeneratedCarouselResponseSchema.parse(await callAi({ mode: 'carousel', prompt }));
}

export async function generateCaptionWithAi(projectTitle: string, slidesSummary: string): Promise<string> {
  const result = await callAi({ mode: 'caption', projectTitle, slidesSummary });
  if (!result || typeof result !== 'object' || !('caption' in result) || typeof result.caption !== 'string') {
    throw new Error('Risposta della caption non valida.');
  }
  return result.caption;
}
