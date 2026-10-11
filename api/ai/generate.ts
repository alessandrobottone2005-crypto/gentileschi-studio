import type { VercelRequest, VercelResponse } from '@vercel/node';

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
5. Rispondi ESCLUSIVAMENTE in formato JSON valido.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY non configurata sul server.',
    });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt mancante o non valido.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\nRichiesta utente:\n${prompt}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const json = JSON.parse(text);

    return res.status(200).json(json);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Errore interno del server' });
  }
}
