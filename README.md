# Gentileschi Studio

Applicazione web per creare post e caroselli Instagram dell’Istituto Superiore Gentileschi. Si parte da un tema ufficiale o condiviso, si personalizzano testi, fotografie ed elementi e si esportano PNG o ZIP.

L’interfaccia è chiara e monocromatica. I colori delle composizioni restano indipendenti dall’interfaccia. Il marchio combina il simbolo ufficiale della scuola con la scritta **Gentileschi Studio**.

## Funzionalità

- Tredici temi ufficiali con copertina, ordine del giorno e avviso: 39 composizioni modificabili.
- Formati 1080 × 1350, 1080 × 1080 e 1080 × 1920; anteprima ed esportazione usano le stesse composizioni.
- Editor desktop e mobile con testo diretto, elementi, livelli, ritaglio, zoom, allineamenti e Annulla/Ripristina.
- Fotografie Pixabay, caricamenti e libreria dello studio; scontorno nel browser e Stile Gentileschi regolabile.
- Contenuti e caption AI, con anteprima e applicazione esplicita delle bozze.
- Accesso Google, progetti e temi condivisi, salvataggio automatico e controllo delle revisioni.

In modalità locale, i progetti e le fotografie rimangono sul dispositivo. La modalità cloud richiede Supabase; la ricerca Pixabay e le funzioni AI richiedono anche la configurazione server.

## Avvio locale

Usare Node.js 22.13 o superiore e npm. La versione minima è dichiarata in `package.json`.

```bash
git clone <url-della-repository>
cd gentileschi-studio
npm ci
cp .env.example .env.local
npm run dev
```

Il server Vite usa la porta 5173. Compilare `.env.local` con i valori dell’ambiente scelto; non salvare credenziali nella repository. Le variabili con prefisso `VITE_` sono incluse nel browser: devono contenere soltanto configurazione pubblica.

Per una prova locale senza collegamento al database:

```bash
VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run dev -- --host 127.0.0.1 --port 5174
```

Questo comando disattiva il cloud per quel processo; non trasferisce i dati locali nello studio condiviso.

## Configurazione

| Variabile | Funzione | Visibilità |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | URL del progetto Supabase | Browser |
| `VITE_SUPABASE_ANON_KEY` | Chiave pubblica Supabase; nome mantenuto per compatibilità | Browser |
| `SUPABASE_SERVER_KEY` | Chiave privilegiata per servizi server | Solo server |
| `PIXABAY_API_KEY` | Ricerca e acquisizione fotografie | Solo server |
| `GEMINI_API_KEY` | Generazione AI | Solo server |
| `AI_USER_DAILY_LIMIT` | Quota AI per utente; predefinita 20 | Server |
| `AI_GLOBAL_DAILY_LIMIT` | Quota AI dello studio; predefinita 500 | Server |

Il server accetta anche gli alias Supabase descritti in [Operazioni](docs/OPERATIONS.md). Riavviare il server dopo una modifica alla configurazione. Su Vercel serve un nuovo deployment.

`npm run dev` espone `/api/photos`, `/api/account` e `/api/ai/generate` attraverso gli stessi handler usati in produzione. Le API richiedono una sessione cloud valida e le rispettive variabili server; configurare soltanto le variabili pubbliche non abilita Pixabay o Gemini. Un messaggio di indisponibilità della quota account non indica consumo AI pari a zero.

## Verifiche e build

```bash
npm run check
npm test
npm run test:browser
npm run build
```

I test browser usano una configurazione locale isolata dal cloud. La build produce `dist/`; `npm run preview` serve gli asset compilati e non sostituisce il runtime delle API Vercel.

Prima di una pubblicazione eseguire anche le verifiche server e i flussi cloud riportati in [Test e verifica](docs/TESTING.md). I report generati rimangono fuori da Git.

## Documentazione

- [Prodotto e comportamenti](PRODUCT.md)
- [Identità e interfaccia](DESIGN.md)
- [Architettura e contratti](docs/ARCHITECTURE.md)
- [Ambienti, database e pubblicazione](docs/OPERATIONS.md)
- [Test e verifica](docs/TESTING.md)

La produzione è [gentileschi-studio.vercel.app](https://gentileschi-studio.vercel.app/). Le anteprime Vercel mantengono la protezione di accesso. Un indirizzo `127.0.0.1` indica il dispositivo locale e non è un link condivisibile con un altro computer.
