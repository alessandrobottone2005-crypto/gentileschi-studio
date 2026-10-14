# Architettura

## Applicazione e responsabilità

Gentileschi Studio usa React, TypeScript e Vite. Le API vengono eseguite come funzioni Vercel; Supabase fornisce Auth, PostgreSQL e Storage. L’entrypoint del browser è `src/main.tsx`, con orchestrazione in `src/App.tsx`.

Il frontend è organizzato per funzionalità, con il seguente albero:

```text
src/
├── App.tsx, main.tsx
├── features/
│   ├── auth/          # Accesso Google e informativa pubblica
│   ├── dashboard/     # Navigazione, elenco e creazione progetti
│   ├── editor/        # Pagina, strumenti, hook, AI ed esportazione
│   ├── themes/        # Galleria, salvataggio, modello e servizio temi
│   ├── media/         # Libreria, fotografie, effetti e persistenza media
│   └── accounts/      # Account, utenti e servizi dei profili
├── shared/
│   ├── ui/, hooks/    # Marchio, componenti comuni e risorse asincrone
│   ├── data/, lib/    # Persistenza progetti e client Supabase
│   ├── types/         # Contratti documenti, composizioni e studio
│   ├── composition/   # Geometria, contenuti e adattamento storico
│   ├── rendering/     # Renderer DOM/SVG e template originali
│   └── styles/        # Token e superfici dell’interfaccia
├── assets/            # Asset ufficiali e catalogo Figma
└── __tests__/         # Test unitari, API e permessi
```

Le funzionalità consumano contratti e utilità condivisi. La resa delle fotografie è condivisa fra editor e renderer attraverso il servizio media: non introdurre un secondo motore di effetti nei template. API e server rimangono nelle cartelle root `api/` e `server/`, con endpoint invariati.

L’editor orchestra selezione, cronologia, applicazione delle bozze e salvataggio. Il motore compositivo gestisce geometria, contenuti collegati e trasferimento dei temi. Il renderer produce DOM/SVG; il motore di esportazione cattura lo stesso risultato in PNG e raccoglie il carosello in ZIP.

Gli hook dell’editor separano persistenza del progetto, composizione, cronologia, esportazione, selezione, scala dell’anteprima e camera della tela. I componenti presentano questi stati senza introdurre archivi alternativi. I moduli caricati su richiesta riducono il lavoro iniziale del browser: controllare le dimensioni della build quando si aggiungono import alle pagine principali.

## Modello dei documenti

`Project` contiene slide ordinate, titolo, caption, formato e riferimento al tema. `Slide` mantiene il ruolo `cover`, `agenda` o `notice`, i contenuti strutturati e una composizione versionata.

`SlideScene` versione 1 definisce dimensioni, sfondo e nodi. Ogni `SceneNode` conserva identità, tipo, geometria, stile, visibilità, blocco, eventuale collegamento al contenuto e figli. I gruppi mantengono geometria locale; le operazioni fra gruppi rispettano trasformazioni e rotazioni.

I campi rapidi aggiornano i dati strutturati e gli elementi collegati. I nodi aggiunti sono fissi salvo collegamento esplicito. La rimozione di un nodo non elimina il dato sottostante. Identificativi, annotazioni di rimozione e override sono parte del documento e vanno preservati durante il refactoring.

I formati sono `portrait` (1080 × 1350), `square` (1080 × 1080) e `story` (1080 × 1920). Il cambio formato scala uniformemente e centra la composizione. Anteprima, miniature ed export usano le dimensioni del progetto.

## Compatibilità e salvataggio

I progetti storici privi di composizione vengono convertiti in memoria mantenendo il renderer originale come riferimento. L’apertura non deve salvare automaticamente la conversione: il nuovo modello viene persistito alla prima modifica.

Nel database i metadati aggiuntivi sono serializzati in `slides[0].projectSettings`. Non introdurre colonne o cambiare questo contratto per una riorganizzazione del codice. La serializzazione rimuove URL runtime e conserva riferimenti durevoli ai media; l’idratazione li trasforma in URL utilizzabili dalla sessione.

Il salvataggio confronta la revisione letta con quella corrente. Un conflitto offre recupero tramite ricaricamento o copia; non sovrascrive le modifiche di un’altra sessione. La coda conserva l’ordine delle modifiche e attende la persistenza prima dell’uscita dall’editor.

In modalità locale, progetti e temi sono in localStorage e le fotografie in IndexedDB. Le chiavi degli archivi e i riferimenti media sono contratti di compatibilità: non rinominarli durante il refactoring.

## Temi e fotografie

I tredici temi ufficiali comprendono le tre composizioni originali e dodici set acquisiti da Figma. I temi condivisi sono salvati in `graphic_themes`, con revisione e creatore. Applicare un tema copia la composizione nel progetto; i progetti non dipendono dalla futura esistenza del tema.

`SlideImage` conserva originale, scontorno, provenienza, ritaglio ed effetti. La provenienza Pixabay contiene provider, identificativo, autore e pagina sorgente. `PhotoEffects` versione 1 conserva impostazioni modificabili; il risultato elaborato è riutilizzato da renderer ed export. Il padding protegge bordo e ombra dai tagli.

I file sono nel bucket privato `gentileschi-media`, con sessioni autenticate e anteprime firmate. Eliminare un progetto non elimina i file, riutilizzabili altrove. URL `blob:` o link temporanei del provider non sono riferimenti persistenti.

## Contratti server

| Endpoint | Richiesta | Risultato |
| --- | --- | --- |
| `GET /api/photos?status=1` | Sessione Bearer | Disponibilità del servizio fotografico |
| `GET /api/photos` | Sessione Bearer, ricerca, orientamento e pagina | Risultati Pixabay con provenienza |
| `POST /api/photos` | Sessione Bearer e identificativo Pixabay | Riferimento persistente e provenienza della foto acquisita |
| `GET /api/account` | Sessione Bearer | Quota AI del solo utente autenticato |
| `POST /api/ai/generate` | Sessione Bearer, tipo e dati della richiesta | Bozza validata di slide o caption |

Le richieste AI di carosello richiedono `eventDate` nel formato `YYYY-MM-DD`. Il server valida la data prima di chiamare Gemini o consumare quota. La generazione valida la risposta strutturata e può eseguire un tentativo di correzione senza consumare una seconda quota applicativa.

In sviluppo Vite collega gli stessi handler tramite `server/devApi.ts`, che converte query e JSON nell’interfaccia comune definita in `server/http.ts`. L’adattatore non modifica le regole di autenticazione o le risposte dei servizi; il server statico di anteprima della build non espone queste route.

La ricerca Pixabay usa cache durevole di 24 ore e limite condiviso di 45 richieste upstream al minuto. L’acquisizione risolve l’immagine dal suo identificativo, accetta solo download HTTPS del provider e limita la dimensione a 10 MB. Le chiavi dei provider e quella privilegiata Supabase restano sul server.

RLS e RPC proteggono accesso condiviso, identità dei creatori, ruoli, revisioni e cache privata. La quota AI è atomica e si azzera a mezzanotte UTC; la UI mostra l’orario nel fuso del browser.

## Acquisizione delle reference

Gli script Figma sono in `scripts/figma/` e si eseguono dalla root della repository. `fetch-figma-data.mjs` e `export-figma-svgs.mjs` richiedono `FIGMA_TOKEN` nel processo; non salvare il token negli script. Gli intermedi storici `scripts/figma-*.json` e `scripts/figma-analysis.txt` restano ignorati da Git.

`import-figma-themes.mjs` converte i sorgenti acquisiti nelle fixture native e scarica gli asset mancanti. `capture-figma-themes.mjs` acquisisce dal server locale sulla porta 5174 le composizioni modificabili e riscrive il catalogo ufficiale. Non eseguire questi script durante una normale verifica o un refactoring: rigenerano materiale di riferimento e gli URL di acquisizione possono essere scaduti. Le fixture e gli asset locali già acquisiti bastano per i confronti automatici.
