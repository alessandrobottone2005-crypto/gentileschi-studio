# Gentileschi Studio 🎨⚡

Web application specialistica e professionale progettata per i rappresentanti degli studenti del **Liceo Gentileschi di Napoli**, per la creazione automatica di post Instagram singoli e caroselli ad altissima fedeltà visiva, basati sul Design System ufficiale Figma.

---

## 🎯 Obiettivo del Progetto

Permettere a studenti e rappresentanti d'istituto senza competenze grafiche di generare post Instagram impeccabili, coerenti al 100% con l'identità visiva del Liceo Gentileschi, modificando semplicemente testi, date, orari, punti all'ordine del giorno e fotografie.

- **Non un clone di Canva**: uno strumento specializzato, veloce, intuitivo, affidabile ed editoriale.
- **Formato Instagram standard**: Risoluzione nativa **1080 × 1350 pixel** (rapporto 4:5).
- **Zero lock-in e massima privacy**: Elaborazione immagini e rimozione dello sfondo eseguite **in locale nel browser (WASM)**, senza invio di fotografie di studenti minorenni a servizi terzi.
- **Integrazione AI con Gemini**: Assistente intelligente per la generazione strutturata di slide e caption accattivanti a partire da una descrizione in linguaggio naturale.

---

## 🏛️ Architettura del Sistema

L'applicazione adotta una separazione rigorosa in 7 livelli:

```
src/
├── design-system/       # Token immutabili CSS Variables (colori, font, ombre, raggi)
├── templates/           # Componenti React puri (TemplateCover, TemplateAgenda, TemplateNotice)
│   ├── registry.tsx     # Registro estendibile dei template
├── engine/              # Motore compositivo, auto-scaling dinamico e utilità date in italiano
├── types/               # Modelli dati rigorosi e contratti TypeScript
├── editor/              # Componenti dell'interfaccia di modifica, form reattivi e selettore foto
├── services/
│   ├── export/          # Rendering DOM Canvas 1080x1350, export PNG e bundling ZIP
│   ├── image/           # Rimozione automatica sfondo WASM (@imgly/background-removal)
│   ├── ai/              # Connessione protetta Gemini API e validazione Zod
│   └── supabase/        # Autenticazione, database PostgreSQL e salvataggio progetti
└── pages/               # Dashboard progetti ed Editor split-screen
```

---

## 🎨 Identità Visiva e Design System

Estratto fedelmente dal file Figma originale:

| Token | Valore | Utilizzo |
| :--- | :--- | :--- |
| **Electric Blue** | `#1728E8` | Sfondo copertina, accenti principali, bottoni |
| **Dark Navy** | `#10143D` | Testi scuri, sfondi badge, contrasti |
| **Deep Royal Blue** | `#10108C` | Sfondo slide O.D.G., fasce diagonali |
| **Cobalt Blue** | `#304BFF` | Strisce secondarie, bordi |
| **Acid Lime** | `#DFFF2F` | Cifre giganti, evidenziatori, sticker, adesivi |
| **Warm White** | `#F4F0E6` | Carta del titolo, box avvisi, sfondo Slide 3 |
| **Pure White** | `#FFFFFF` | Testi display e card informative |

### Tipografie Ufficiali
- **Archivo Black (400)**: Titoli bold, grandi date, adesivi, numeri giganti.
- **Inter (400, 700, 900)**: Testi di lettura, regole in evidenza, liste ODG.
- **Roboto Mono (500, 700)**: Orari assemblea, orari di inizio/fine, badge numerati.
- **Comic Neue (700)**: Sticker informali e annotazioni ("NUOVA REGOLA").

---

## 🚀 I Tre Template Figma Implementati

1. **Template 1 — Copertina Assemblea (`4:2758`)**:
   - Titolo dinamico con ridimensionamento automatico.
   - Giorno grande (400px) e mese in italiano con sottolineatura irregolare.
   - Orario iniziale e finale.
   - Elementi grafici originali: esplosioni vettoriali, cerchio disegnato, adesivo lime con asterisco, ritaglio monocromatico della statua.

2. **Template 2 — Ordine del Giorno (`4:2791`)**:
   - Intestazione "O.D.G." con tag espansa "ORDINE DEL GIORNO".
   - Elenco dinamico dei punti con numerazione automatica a 2 cifre (`01`, `02`, ...).
   - Possibilità di contrassegnare qualsiasi voce come "In Evidenza" (stile lime bold Archivo Black).
   - Aereo ritagliato fotografico con ombra dura e anello disegnato.

3. **Template 3 — Avviso Importante / Regola (`4:2838`)**:
   - Intestazione "IMPORTANTE!".
   - Card regola in evidenza (es. "2 STUDENTI PER CLASSE") con sticker "NUOVA REGOLA".
   - Box messaggio con doppio paragrafo motivazionale e separatore lime.
   - Sticker call-to-action "PARTECIPARE FA LA DIFFERENZA".
   - Fotografia ritagliata del gruppo studenti.

---

## 🛠️ Tecnologie Utilizzate

- **Core**: React 18, TypeScript 5, Vite 6
- **Styling**: CSS Variables + Modern CSS
- **Esportazione**: `html-to-image`, `jszip`, `file-saver`
- **Elaborazione Immagini**: `@imgly/background-removal` (WASM / ONNX locale)
- **AI**: `@google/genai` (Gemini 2.5 Flash), `zod`
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, Storage)
- **Testing**: Vitest, Playwright

---

## 📦 Installazione e Avvio Locale

### 1. Prerequisiti
- Node.js versione 18 o superiore
- npm versione 9 o superiore

### 2. Clona il repository e installa le dipendenze
```bash
git clone <url-del-repo>
cd PresetPostGentileschi
npm install
```

### 3. Configura le variabili d'ambiente
Copia il file di esempio:
```bash
cp .env.example .env
```
Inserisci le tue credenziali (opzionali per il funzionamento manuale/locale):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### 4. Avvia il server di sviluppo
```bash
npm run dev
```
L'applicazione sarà attiva all'indirizzo: `http://localhost:5173`

### 5. Esegui i test automatici
```bash
npm test
```

### 6. Build di produzione
```bash
npm run build
```

---

## 🗄️ Configurazione Supabase

1. Crea un nuovo progetto su [Supabase](https://supabase.com).
2. Vai nella sezione **SQL Editor**.
3. Incolla ed esegui lo script contenuto nel file `supabase/schema.sql`.
4. Verrà creata la tabella `projects` protetta da Row Level Security (RLS) e il bucket di storage `gentileschi-media`.
5. Copia `Project URL` e `anon public key` dalle impostazioni API e incollale nel file `.env`.

*Nota*: Se Supabase non è configurato, Gentileschi Studio funziona perfettamente in **Modalità Locale**, memorizzando in modo trasparente e affidabile tutti i progetti in `localStorage`.

---

## 🤖 Configurazione Gemini AI

1. Ottieni una chiave API gratuita da [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Aggiungi la chiave nel file `.env`:
   - `GEMINI_API_KEY=AIzaSy...`
3. Nel caso di deploy su Vercel, aggiungi `GEMINI_API_KEY` nelle **Environment Variables** del progetto su Vercel: le chiamate passeranno dalla Serverless Function protetta in `api/ai/generate.ts`.

---

## ☁️ Deployment su Vercel

1. Collega il repository GitHub al tuo account [Vercel](https://vercel.com).
2. Vercel rileverà automaticamente il framework **Vite**.
3. Nelle impostazioni del progetto (Settings $\rightarrow$ Environment Variables), aggiungi:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clicca su **Deploy**.

---

## 🧩 Come Aggiungere Nuovi Template in Futuro

Il motore è progettato secondo i principi Open/Closed:

1. **Definisci i tipi di contenuto** in `src/types/template.ts`.
2. **Crea il componente grafico** in `src/templates/TemplateNuovo.tsx` rispettando il formato 1080×1350 px.
3. **Crea il form di modifica** in `src/editor/FormNuovo.tsx`.
4. **Registra il template** in `src/templates/registry.tsx` aggiungendo la definizione all'oggetto `TEMPLATE_REGISTRY`.
5. Il nuovo template sarà immediatamente disponibile nel selettore slide dell'editor e compatibile con esportazione, duplicazione e salvataggio!

---

## 🛡️ Licenza e Sicurezza

Progettato esclusivamente per l'uso istituzionale da parte dei Rappresentanti degli Studenti del Liceo Gentileschi di Napoli.
Non utilizzare immagini di studenti senza autorizzazione e liberatoria formale.
