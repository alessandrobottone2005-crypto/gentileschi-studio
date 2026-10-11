import { AiGeneratedCarouselResponse, AiGeneratedCarouselResponseSchema } from './schemas';

const SYSTEM_PROMPT = `Sei l'assistente AI ufficiale dei Rappresentanti degli Studenti del Liceo Gentileschi di Napoli.
Il tuo compito è analizzare la richiesta dell'utente e generare un carosello Instagram strutturato per "Gentileschi Studio".

REGOLE CRUCIALI:
1. NON inventare mai informazioni ufficiali non fornite (date, orari precisi, regole). Se mancano, segnalalo nel campo "missingInformation".
2. Mantieni lo stile di comunicazione fresco, autorevole, rispettoso ma vicino agli studenti del liceo (tono accattivante, energico, in italiano).
3. I template disponibili sono SOLO 3, usa ESCLUSIVAMENTE questi valori per templateType:
   - "cover": Titolo (es. "ASSEMBLEA D'ISTITUTO"), giorno (es. "20"), mese (in maiuscolo, es. "NOVEMBRE"), timeSlot (es. "DALLE ORE 10:00\\nALLE ORE 13:00").
   - "agenda": Titolo (default "O.D.G."), subtitle ("ORDINE DEL GIORNO"), items (array di { id: string, number: "01", text: string, isHighlight?: boolean }).
   - "notice": Slide per comunicazioni importanti o regole. highlightQuantity (es. "2"), highlightLabel (es. "STUDENTI\\nPER CLASSE"), badgeText ("NUOVA REGOLA"), paragraph1, paragraph2, ctaText ("PARTECIPARE FA LA DIFFERENZA").
4. Genera sempre una caption Instagram completa e coinvolgente con emoji e hashtag pertinenti (#LiceoGentileschi, #StudentiNapoli, #AssembleaDiIstituto).
5. Rispondi ESCLUSIVAMENTE in formato JSON valido aderente allo schema:
{
  "projectTitle": "Titolo del progetto",
  "slides": [
    { "templateType": "cover", "content": { "title": "...", "day": "...", "month": "...", "timeSlot": "..." } },
    { "templateType": "agenda", "content": { "title": "O.D.G.", "subtitle": "ORDINE DEL GIORNO", "items": [{ "id": "1", "number": "01", "text": "...", "isHighlight": false }] } },
    { "templateType": "notice", "content": { "title": "IMPORTANTE!", "highlightQuantity": "2", "highlightLabel": "RAPPRESENTANTI", "badgeText": "NUOVA REGOLA", "paragraph1": "...", "paragraph2": "...", "ctaText": "..." } }
  ],
  "missingInformation": [],
  "caption": "testo caption"
}`;

export function extractJson(rawText: string): string {
  const trimmed = rawText.trim();
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

const SUPPORTED_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash'];

async function callGeminiApi(apiKey: string, body: any): Promise<any> {
  let lastError: Error | null = null;

  for (const model of SUPPORTED_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return await response.json();
      }

      const errText = await response.text();
      // If temporary overload (503), rate limit (429) or model missing (404), fall back
      if (response.status === 503 || response.status === 429 || response.status === 404) {
        lastError = new Error(`Gemini API [${model}] (${response.status}): ${errText}`);
        continue;
      }

      throw new Error(`Errore API Gemini (${response.status}): ${errText}`);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Impossibile contattare i modelli Gemini.');
}

export async function generateCarouselWithAi(prompt: string): Promise<AiGeneratedCarouselResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // We try backend endpoint first (useful in Vercel production deployment)
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return AiGeneratedCarouselResponseSchema.parse(data);
    }
  } catch (err) {
    // If backend route isn't running or network error, proceed to direct client API key fallback
  }

  if (!apiKey) {
    throw new Error(
      'Configurazione Gemini non rilevata. Aggiungi GEMINI_API_KEY nel file .env o nelle impostazioni Vercel per abilitare la generazione automatica. Puoi proseguire normalmente in Modalità Manuale.'
    );
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${SYSTEM_PROMPT}\n\nRichiesta utente:\n${prompt}` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    }
  };

  const result = await callGeminiApi(apiKey, requestBody);
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Nessuna risposta generata da Gemini.');
  }

  const cleanJson = extractJson(textOutput);
  const parsedJson = JSON.parse(cleanJson);
  return AiGeneratedCarouselResponseSchema.parse(parsedJson);
}

export async function generateCaptionWithAi(
  projectTitle: string,
  slidesSummary: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Configurazione Gemini non rilevata. Inserisci GEMINI_API_KEY per generare la caption.');
  }

  const promptText = `Sei l'assistente social del Liceo Gentileschi di Napoli.
Scrivi una caption Instagram accattivante per il post intitolato "${projectTitle}".
Dettagli del carosello:
${slidesSummary}

Linee guida:
- Linguaggio chiaro, coinvolgente, in italiano per studenti del liceo.
- Usa emoji e hashtag scolastici pertinenti (#LiceoGentileschi #AssembleaDiIstituto #NapoliStudenti).
- Non inventare orari o fatti non citati nei dettagli sopra.
- Restituisci soltanto il testo della caption pronto per la pubblicazione.`;

  const requestBody = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.7 }
  };

  const result = await callGeminiApi(apiKey, requestBody);
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error('Impossibile generare la caption con Gemini.');
  }

  return text;
}
