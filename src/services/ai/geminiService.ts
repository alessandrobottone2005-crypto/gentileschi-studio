import { AiGeneratedCarouselResponse, AiGeneratedCarouselResponseSchema } from './schemas';

const SYSTEM_PROMPT = `Sei l'assistente AI ufficiale dei Rappresentanti degli Studenti del Liceo Gentileschi di Napoli.
Il tuo compito è analizzare la richiesta dell'utente e generare un carosello Instagram strutturato per "Gentileschi Studio".

REGOLE CRUCIALI:
1. NON inventare mai informazioni ufficiali non fornite (date, orari precisi, regole). Se mancano, segnalalo nel campo "missingInformation".
2. Mantieni lo stile di comunicazione fresco, autorevole, rispettoso ma vicino agli studenti del liceo (tono accattivante, energico, in italiano).
3. I template disponibili sono SOLO 3:
   - "cover": Titolo (es. "ASSEMBLEA D'ISTITUTO"), giorno (es. "20"), mese (in maiuscolo, es. "NOVEMBRE"), timeSlot (es. "DALLE ORE 10:00\\nALLE ORE 13:00").
   - "agenda": Titolo (default "O.D.G."), subtitle ("ORDINE DEL GIORNO"), items (array di { id, number: "01", text, isHighlight: boolean }).
   - "notice": Slide per comunicazioni importanti o regole. highlightQuantity (es. "2"), highlightLabel (es. "STUDENTI\\nPER CLASSE"), badgeText ("NUOVA REGOLA"), paragraph1, paragraph2, ctaText ("PARTECIPARE FA LA DIFFERENZA").
4. Genera sempre una caption Instagram completa e coinvolgente con emoji e hashtag pertinenti (#LiceoGentileschi, #StudentiNapoli, #AssembleaDiIstituto).
5. Rispondi ESCLUSIVAMENTE in formato JSON valido aderente allo schema richiesto.`;

export async function generateCarouselWithAi(prompt: string): Promise<AiGeneratedCarouselResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // We try backend endpoint first, or direct API key if provided locally
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const data = await res.json();
      return AiGeneratedCarouselResponseSchema.parse(data);
    }
  } catch (err) {
    // If backend route isn't running, check for VITE_GEMINI_API_KEY
  }

  if (!apiKey) {
    throw new Error(
      'Configurazione Gemini non rilevata. Aggiungi GEMINI_API_KEY nel file .env o nelle impostazioni Vercel per abilitare la generazione automatica. Puoi proseguire normalmente in Modalità Manuale.'
    );
  }

  // Direct client request with Gemini Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Errore API Gemini (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Nessuna risposta generata da Gemini.');
  }

  const parsedJson = JSON.parse(textOutput);
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `Sei l'assistente social del Liceo Gentileschi di Napoli.
Scrivi una caption Instagram accattivante per il post intitolato "${projectTitle}".
Dettagli del carosello:
${slidesSummary}

Linee guida:
- Linguaggio chiaro, coinvolgente, in italiano per studenti del liceo.
- Usa emoji e hashtag scolastici pertinenti (#LiceoGentileschi #AssembleaDiIstituto #NapoliStudenti).
- Non inventare orari o fatti non citati nei dettagli sopra.
- Restituisci soltanto il testo della caption pronto per la pubblicazione.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.7 }
    }),
  });

  if (!response.ok) {
    throw new Error('Impossibile generare la caption con Gemini.');
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}
