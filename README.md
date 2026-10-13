# Gentileschi Studio 🎨⚡

## Editor, temi e fotografie — anteprima

L’editor usa uno spazio di lavoro chiaro con Temi, Elementi, Testo, Foto, Caricamenti e Dati. La tela resta visibile; strumenti contestuali, livelli, modifica diretta dei testi, ritaglio, allineamenti, distribuzione, zoom e spostamento della vista funzionano anche con pannelli touch. I tre formati sono 1080 × 1350, 1080 × 1080 e 1080 × 1920. Annulla/Ripristina, campi sincronizzati, cambio tema e bozze AI conservano il modello strutturato.

**Catalogo:** 13 temi ufficiali / 39 composizioni. I dodici set Figma sono stati acquisiti tramite `get_design_context`, con asset originali e geometrie convertite in composizioni modificabili. Le reference native per il confronto sono in `tests/figma-reference`; gli script `scripts/import-figma-themes.mjs` e `scripts/capture-figma-themes.mjs` consentono la rigenerazione quando gli URL Figma sono ancora disponibili e il server locale è attivo. I progetti conservano una copia indipendente del tema.

**Fotografie:** ricerca Pixabay in italiano con filtri di orientamento, anteprima e provenienza, aggiunta o sostituzione, archivio persistente, scontorno automatico locale e Stile Gentileschi regolabile (bianco e nero, puntini, bordo e ombra). Originale, scontorno, ritaglio ed effetti restano separati e riutilizzabili. La stessa immagine elaborata serve tela, miniature ed esportazione.

Il servizio `/api/photos` verifica la sessione Supabase, protegge la chiave Pixabay, conserva le ricerche per 24 ore e limita le richieste upstream. Acquisisce solo immagini HTTPS del provider, limita i download a 10 MB e carica le foto nel bucket privato con le autorizzazioni dell’utente. Originali Pixabay non vengono collegati permanentemente da URL esterni.

### Configurazione cloud e verifica reale

- Il 13 ottobre 2026 sono state applicate sul progetto effettivo `aukspzeknnbhvdhpntiu`, tramite SQL Editor, le migrazioni `20261012212457_graphics_themes.sql` e `20261013074040_pixabay_cache.sql` in un’unica transazione. Account, progetti esistenti e bucket privato erano già configurati. Non ripetere la migrazione Pixabay su questa installazione.
- La chiave Pixabay è conservata in `.env.local`, ignorato da Git, con permessi `600`. Il server usa `PIXABAY_API_KEY`, le impostazioni pubbliche Supabase già presenti e `SUPABASE_SERVER_KEY` oppure `SUPABASE_SERVICE_ROLE_KEY`. Nessuna chiave privata va impostata con prefisso `VITE_`. Dopo la configurazione riavviare il server.
- Verificati ricerca reale in italiano, cache condivisa di 24 ore, acquisizione Pixabay nel bucket privato, scontorno locale, stile, salvataggio e ricaricamento cloud ed esportazione PNG. Il progetto dimostrativo si chiama `Anteprima Pixabay e cloud`.
- `supabase/tests-graphics-cloud.sql` ha verificato sul database reale, con le due identità esistenti, lettura/modifica/eliminazione dei temi condivisi, attribuzione del creatore, conflitti di revisione, indipendenza dei progetti e accesso riservato alla cache. Tutte le modifiche di questo test sono state annullate con rollback; la prova dei permessi non equivale a due sessioni contemporanee nel browser.

In assenza di configurazione, il pannello Foto mostra un messaggio esplicito e lascia disponibili caricamenti e libreria. Il server Vite espone la stessa route fotografica per la verifica locale; in produzione la route è eseguita da Vercel.

Verifica: `npm test`, `npm run build`, `npm run test:browser`. Le prove confrontano tutte le composizioni importate con le reference native Figma e conservano le tre originali, verificano editing, temi, ricaricamento, foto, ritaglio, effetti, export e mobile. La prova fotografica del bordo verifica che i residui quasi trasparenti dello scontorno non vengano amplificati in anelli bianchi.

Anteprima senza modificare dati cloud: `VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run dev -- --host 127.0.0.1 --port 5174`. Nessuna pubblicazione in produzione è stata effettuata.

Web application specialistica e professionale progettata per i rappresentanti degli studenti del **Liceo Gentileschi di Napoli**, per la creazione automatica di post Instagram singoli e caroselli ad altissima fedeltà visiva, basati sul Design System ufficiale Figma.

---

## 🎯 Obiettivo del Progetto

Permettere a studenti e rappresentanti d'istituto senza competenze grafiche di generare post Instagram impeccabili, coerenti al 100% con l'identità visiva del Liceo Gentileschi, modificando semplicemente testi, date, orari, punti all'ordine del giorno e fotografie.

- **Flusso familiare a Canva**: strumenti essenziali e contestuali per personalizzare i preset Gentileschi.
- **Formato Instagram standard**: Risoluzione nativa **1080 × 1350 pixel** (rapporto 4:5).
- **Elaborazione locale, archivio condiviso**: la rimozione dello sfondo avviene nel browser. In modalità cloud, le fotografie vengono caricate in un bucket Supabase privato e sono accessibili a tutti gli utenti registrati.
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
- **AI**: Gemini 3.8 Flash con fallback Gemini 3.6 Flash, risposte strutturate JSON e validazione `zod` sul server
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
SUPABASE_SERVER_KEY=your-server-only-secret-key
AI_USER_DAILY_LIMIT=20
AI_GLOBAL_DAILY_LIMIT=500
```

### 4. Avvia il server di sviluppo
```bash
npm run dev
```
L'applicazione sarà attiva all'indirizzo: `http://localhost:5173`
Con `npm run dev` l'editor e l'archivio funzionano, ma l'endpoint server `/api/ai/generate` richiede l'ambiente Vercel (deploy o sviluppo tramite Vercel CLI).

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
4. Verrà creata la tabella `projects` protetta da Row Level Security (RLS) e il bucket privato `gentileschi-media`.
5. Copia `Project URL` e la chiave **Publishable** dalle impostazioni API Keys nel file `.env`, rispettivamente in `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Inserisci la chiave **Secret** in `SUPABASE_SERVER_KEY`, esclusivamente sul server. Il nome dedicato evita conflitti con le variabili gestite da integrazioni Vercel. La funzione AI accetta anche il precedente `SUPABASE_SERVICE_ROLE_KEY` come fallback.
6. In **Authentication**, consenti la creazione di nuovi utenti e aggiungi l'URL pubblicato tra gli URL di reindirizzamento consentiti.
7. Crea un client OAuth Web in Google Cloud con pubblico esterno, stato in produzione e soli ambiti `openid`, email e profilo. Configura l'origine del sito e il callback `https://<project-ref>.supabase.co/auth/v1/callback`. Imposta la pagina pubblica `/privacy` come informativa del consenso.
8. Abilita **Google** in Supabase e salva Client ID e Client Secret esclusivamente nella configurazione del provider. Non servono variabili OAuth nel frontend o in Vercel. Dopo una prova di accesso riuscita, disabilita **Email**. [Procedura ufficiale Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

### Progetto collegato

L'interfaccia offre solo **Continua con Google**, con scelta dell'account, messaggi italiani per errore o consenso annullato e possibilità di riprovare. L'informativa `/privacy` è accessibile anche senza sessione e chiarisce la condivisione di progetti e fotografie tra tutti gli utenti registrati. Il progetto Google Cloud è `gentileschi-studio`, il client Web usa l'origine `https://gentileschi-studio.vercel.app` e il callback Supabase `https://aukspzeknnbhvdhpntiu.supabase.co/auth/v1/callback`. Il contatto di assistenza è `alessandro.bottone.design@gmail.com`. Gli account con la stessa email verificata vengono collegati automaticamente da Supabase; non si eliminano o ricreano account e dati durante il cambio di provider. [Collegamento delle identità](https://supabase.com/docs/guides/auth/auth-identity-linking).

Dal 12 ottobre 2026 Google è attivo, il pubblico OAuth è esterno e in produzione, il provider Email è disabilitato e le richieste OTP email vengono rifiutate con `email_provider_disabled`. Verificati sul sito pubblicato: accesso Google con un nuovo account, consenso annullato, uscita, nuovo accesso, sessione persistente dopo ricaricamento, apertura dei progetti condivisi, rigenerazione AI della caption e caricamento/rilettura di una fotografia di prova nel bucket privato. I visitatori anonimi non possono leggere progetti, fotografie private o usare l'AI. Schermate controllate a 390 e 1440 px, navigazione da tastiera, 49 test automatici e build superati.

L'amministratore ha confermato di aver cambiato il proprio indirizzo Google da `alessandrobottone2005@gmail.com` a `alessandro.bottone.design@gmail.com`. L'accesso è stato verificato con l'indirizzo attuale. Supabase conserva due record perché l'account iniziale usava l'email precedente e il primo accesso OAuth ha presentato quella nuova: il record Google accede agli stessi progetti e fotografie condivisi, mentre il precedente mantiene identificativo e dati. Il controllo che richiedeva un nuovo accesso con la vecchia email è superato dalla conferma del cambio di indirizzo; non si esegue una fusione dei record o una modifica dei proprietari dei progetti.

Il progetto cloud `Gentileschi Studio` (`aukspzeknnbhvdhpntiu`) è stato configurato con lo schema di questo repository, bucket privato `gentileschi-media` e accesso condiviso per tutti gli utenti autenticati. Il sito pubblico è [gentileschi-studio.vercel.app](https://gentileschi-studio.vercel.app/), collegato alla branch `main` della repository GitHub. Il Site URL e il redirect di produzione Supabase sono `https://gentileschi-studio.vercel.app/`; sono consentiti anche i ritorni locali `http://127.0.0.1:5173/` e `http://localhost:5173/`. Le chiavi sono configurate in Vercel per la produzione, con Gemini e `SUPABASE_SERVER_KEY` salvati come variabili Secret, e nel file `.env` locale ignorato da Git.

Verificati sul progetto reale: connessione server, rifiuto delle letture dei progetti e della funzione quota AI da parte del ruolo anonimo, chiamata server della funzione quota, bucket privato con limite di 10 MB e MIME PNG/JPEG/WebP. Il build del browser non contiene le chiavi privilegiate o Gemini.

Il servizio SMTP Brevo rimane configurato in Supabase dal 11 ottobre 2026, ma non viene usato per i nuovi accessi: server `smtp-relay.brevo.com`, porta `587`, nome mittente `Gentileschi Studio`, intervallo minimo di 60 secondi per utente e limite Supabase di 30 email all'ora. Le credenziali SMTP sono salvate esclusivamente nelle impostazioni Supabase. La chiave corrente scade l'11 ottobre 2027; Brevo può farla scadere anche dopo 90 giorni di inattività. Prima della scadenza, creare una nuova chiave e aggiornare la password SMTP in Supabase.

Il mittente Gmail è verificato, ma non dispone di un dominio autenticato: Brevo riscrive temporaneamente l'indirizzo del mittente su un proprio dominio tecnico. Per migliorare la consegna e usare un indirizzo del marchio, occorre collegare un dominio personale e autenticarlo in Brevo. Il sottodominio del sito su `vercel.app` non consente di configurare i record DNS del mittente email.

I modelli di conferma registrazione e link di accesso sono in italiano; le copie senza credenziali sono in `supabase/email-templates/`. Verificati l'invio tramite Brevo, l'accesso con link email e il rifiuto delle richieste AI anonime. Il 12 ottobre 2026 è stato verificato sul sito pubblicato, con una sessione reale, il flusso di generazione di un carosello con cover, agenda e notice, applicazione esplicita, salvataggio cloud e rigenerazione della caption. Giorno, mese e caption sono rimasti corretti dopo il ricaricamento: il calendario indicava 20 novembre 2026 mentre la descrizione conteneva una data discordante. Il progetto di prova è `Prova AI — 20 novembre 2026`. Il progetto di prova è stato successivamente eliminato nella pulizia autorizzata. Nella versione con area account sono stati verificati il rifiuto di un salvataggio con revisione obsoleta e la protezione del creatore, simulando due account autenticati sul database reale con rollback.

*Nota*: senza Supabase, i progetti restano in `localStorage` e le foto in IndexedDB sul dispositivo. Con Supabase configurato, l'accesso con Google è obbligatorio, i progetti sono condivisi tra tutti gli account registrati e le foto sono scaricate tramite sessione autenticata. La dashboard permette di importare esplicitamente i vecchi progetti locali. Le vecchie immagini salvate solo come URL `blob:` non sono recuperabili dopo la chiusura del browser e vanno ricaricate.

---

## 🤖 Configurazione Gemini AI

1. Ottieni una chiave API gratuita da [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Aggiungi la chiave nel file `.env`:
   - `GEMINI_API_KEY=AIzaSy...`
3. Nel caso di deploy su Vercel, aggiungi `GEMINI_API_KEY` nelle **Environment Variables** del progetto su Vercel: le chiamate passeranno dalla Serverless Function protetta in `api/ai/generate.ts`.

L'Assistente AI richiede la **Data dell'evento** scelta nel calendario, oltre alla descrizione. La data selezionata prevale su quelle presenti nel testo: il server calcola giorno e mese delle copertine prima della validazione finale. Date mancanti o impossibili sono rifiutate prima di chiamare Gemini o consumare quota. Le richieste `carousel` all'endpoint `/api/ai/generate` devono includere `eventDate` nel formato `YYYY-MM-DD`; le richieste `caption` mantengono il contratto precedente.

Il carosello è richiesto a Gemini con uno schema strutturato per cover, agenda e notice. Se il JSON o altri campi non sono validi, il server effettua un solo tentativo di correzione nella stessa richiesta e senza una seconda quota applicativa. Un secondo errore produce un messaggio leggibile; i log riportano soltanto codici e percorsi dei campi invalidi. Il progetto cambia solo premendo **Applica al Progetto**. L'avvio locale con `npm run dev` serve l'interfaccia; questa configurazione AI viene eseguita dalle funzioni del sito Vercel.

---

## ☁️ Deployment su Vercel

1. Collega il repository GitHub al tuo account [Vercel](https://vercel.com).
2. Vercel rileverà automaticamente il framework **Vite**.
3. Nelle impostazioni del progetto (Settings $\rightarrow$ Environment Variables), aggiungi:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVER_KEY` (solo server, mai con prefisso `VITE_`)
   - `AI_USER_DAILY_LIMIT` e `AI_GLOBAL_DAILY_LIMIT` se vuoi modificare i limiti predefiniti
4. Esegui lo schema aggiornato in `supabase/schema.sql`, imposta in Supabase Auth l'URL del sito e i redirect OAuth consentiti, e configura Google come unico provider di accesso.
5. Clicca su **Deploy**.

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

## Area account e organizzazione dello studio

La navigazione comprende Panoramica (`/`), Progetti (`/projects`), Libreria (`/library`), Account (`/account`) e Utenti (`/users`, solo amministratori). Tutti gli utenti Google registrati entrano come editor: possono creare, modificare, duplicare ed eliminare qualsiasi progetto condiviso. “Creati da me” indica il creatore originale, senza limitare la visibilità. Il nome personalizzato cambia soltanto in Gentileschi Studio; email, foto e nome Google rimangono separati.

Eseguire `supabase/migrations/20261012_studio_accounts.sql` **dopo lo schema iniziale e prima di pubblicare questa interfaccia**. La migrazione sincronizza i profili con Auth, inizializza gli account esistenti, assegna il primo admin all'account Google verificato di Alessandro e protegge i ruoli tramite permessi di colonna, RLS e RPC. Non modifica i ruoli ai successivi accessi Google. Gli editor leggono il proprio profilo e il nome degli autori; soltanto gli admin leggono l'elenco completo delle email. `set_studio_role` serializza le richieste con un advisory lock e impedisce di retrocedere l'ultimo admin. Nessuna funzione di sospensione o cancellazione account è esposta dal tool. I progetti mantengono il controllo delle revisioni e il creatore non può essere modificato dai client.

La libreria legge i file del bucket privato `gentileschi-media`, con caricatore ricavato da `storage.objects.owner_id`, formato, dimensione, data e nome originale per i nuovi caricamenti. Le foto esistenti senza nome leggibile usano “Foto” e un identificativo abbreviato. Si possono caricare e scaricare foto, visualizzarle e scegliere “Scegli dalla libreria” nell'editor per riutilizzarle senza un secondo upload. L'eliminazione di un progetto conserva tutte le foto. Senza Supabase, progetti, nome e immagini restano sul dispositivo e non vengono più creati progetti dimostrativi automaticamente.

`GET /api/account` richiede una sessione valida e restituisce esclusivamente il consumo dell'utente autenticato (`used`, `limit`, `remaining`, `available`, `resetsAt`), con disponibilità limitata anche dalla quota globale. Non consuma quota. Usa gli stessi limiti configurabili di `/api/ai/generate`, azzeramento UTC e risposta `private, no-store`. In Account l'ora di azzeramento è mostrata nel fuso del browser; richieste fallite dopo il consumo rimangono conteggiate. Con il solo server Vite l'endpoint server non è disponibile: il messaggio distingue questa condizione dal consumo zero.

La pulizia autorizzata dei tre progetti di prova usa esclusivamente i loro ID in `scripts/cleanup-test-projects.mjs`, mai una cancellazione generale. Lo script è ripetibile e conserva un backup privato nella cartella ignorata `.vercel/diagnostic`; account, fotografia presente e storico AI vengono conservati. La pulizia non è eseguita all'avvio, nei deploy o nelle migrazioni.

I test dei permessi eseguono la migrazione su PostgreSQL incorporato tramite PGlite. `supabase/tests-studio-permissions.sql` verifica inoltre i ruoli e la libreria sul progetto reale in una transazione con rollback, senza lasciare le modifiche di prova. Eseguire questo script solo su questa installazione: usa gli identificativi dei due account già verificati.

Per verificare il blocco simultaneo dei ruoli, avviare `supabase/tests-studio-concurrency-a.sql` e subito dopo `supabase/tests-studio-concurrency-b.sql` in due schede SQL indipendenti. La seconda richiesta deve attendere il lock della prima e poi rifiutare la retrocessione dell'ultimo admin. Entrambe le transazioni terminano con rollback. Questa prova è stata eseguita con successo sul database reale il 12 ottobre 2026.

Verifica della versione con account: 77 test automatici e build superati; sul sito pubblicato verificati uscita e nuovo accesso Google, persistenza della sessione, quota AI coerente con il database, archivio vuoto, foto preesistente conservata e scaricabile. Verificati inoltre caricamento con nome originale, riutilizzo della foto senza upload, salvataggio prima di uscire dall’editor ed esportazione PNG 1080×1350. Il progetto e la foto aggiunti per queste prove sono stati rimossi. Schermate controllate a 1440 e 390 px, senza overflow orizzontale.
