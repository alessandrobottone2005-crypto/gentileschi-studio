# Test e verifica

## Controlli automatici

```bash
npm run check
npm test
npm run test:browser
npm run build
```

Vitest verifica composizione, contenuti, autenticazione, persistenza, media, API e autorizzazioni. I test PostgreSQL incorporati con PGlite controllano politiche e revisioni senza scrivere nel progetto cloud.

Playwright avvia un server dedicato sulla porta 5185 con Supabase e le chiavi server disattivati. Non riutilizza i processi locali già aperti sulle porte 5173 o 5174. Se la porta 5185 è occupata, il test si ferma: identificare quel processo e liberare la porta prima di riprovare. Immagini di confronto, tracce e report generati non vanno aggiunti alla repository.

`npm run check` esegue lint e controllo TypeScript di frontend, API/server e strumenti. `npm run build` ripete il controllo TypeScript prima di generare gli asset; un frontend compilabile da solo non garantisce che le funzioni Vercel siano valide.

I conteggi dei test appartengono alla consegna del rilascio, non alle istruzioni permanenti. Non trasformare una prova locale con risposte simulate in una dichiarazione di verifica del servizio cloud.

La CI GitHub esegue questi controlli su pull request e su aggiornamenti di `main`, con Node.js 24, `npm ci`, verifica delle dipendenze e Chromium. In caso di errore conserva report e tracce del browser per sette giorni. Per eseguire per la prima volta i test browser in locale, installare Chromium con `npx playwright install chromium`.

## Interfaccia e marchio

- Controllare accesso, caricamento, privacy, dashboard, libreria, account, utenti, editor e dialoghi a 1440 px e 390 px.
- Confermare light mode e soli neutri dell’interfaccia; fotografie, composizioni e campioni colore conservano i colori originali.
- Verificare logo completo, simbolo, favicon, proporzioni e leggibilità nelle dimensioni piccole.
- Provare tastiera, focus dei dialoghi, pulsanti con icona, stati attivi/disabilitati, testi lunghi e assenza di overflow delle pagine.
- Verificare zoom, trascinamento e pannelli touch; non limitarsi a ridurre la larghezza del desktop.

## Documenti e regressione grafica

Le fixture originali Figma in `tests/figma-reference` sono il riferimento delle 36 composizioni importate. Le tre composizioni originali mantengono anche il renderer storico come riferimento. Conservare sorgenti e asset delle fixture durante il riordino.

Verificare creazione e conferma del tema, post singolo e carosello, entrambe le modalità di cambio tema e bozze AI, gestione delle slide prive di layout compatibile e Annulla/Ripristina.

Provare testo diretto, campi rapidi, eliminazione di elementi collegati senza perdita del dato, gruppi ruotati, ordine dei livelli, blocco, visibilità, allineamento e distribuzione. I refactoring di hook e pannelli mantengono gli stessi risultati.

Per ogni formato controllare dimensioni, visibilità degli elementi, testi lunghi e proporzioni. Confrontare tela, miniature e PNG; verificare che lo ZIP contenga il carosello ordinato e completo.

Aprire un progetto storico senza modificarlo e confermare che non venga risalvato automaticamente. Alla prima modifica, salvare e ricaricare; verificare contenuti, composizione, immagini e riferimenti persistenti. Controllare gli stessi flussi in locale e cloud.

## Fotografie

Eseguire ricerca reale → aggiunta → sostituzione → scontorno → Stile Gentileschi → salvataggio → ricaricamento → PNG/ZIP.

Controllare italiano, orientamento, paginazione, autore e provenienza. La sostituzione conserva geometria ed effetti. Originali e scontorni rimangono disponibili dopo il ricaricamento, senza dipendere da link temporanei Pixabay.

Verificare trasparenza, residui quasi trasparenti, trama, contrasto, bordi e ombre nei tre formati; nessun bordo o ombra deve essere tagliato. Provare annullamento e ripristino dello scontorno senza perdita dell’originale.

Provare provider non configurato, rete assente, sessione scaduta, limite upstream e scontorno fallito. Il progetto rimane modificabile e i caricamenti disponibili quando Pixabay fallisce.

## Cloud e pubblicazione

Usare due account distinti per verificare progetti, media e temi condivisi. Aggiornare lo stesso documento da due sessioni e confermare il conflitto di revisione. Aggiornare o eliminare un tema e confermare l’indipendenza dei progetti già creati.

Le prove SQL reali sono contenute in `supabase/tests-*.sql` e usano identità specifiche dell’installazione originale. Leggerle prima dell’esecuzione; non usarle su altri progetti senza adattamento. Le prove di autorizzazione in transazioni con rollback verificano i ruoli, ma non sostituiscono due sessioni browser contemporanee.

Non eliminare dati reali per ripristinare uno stato di test. Le creazioni necessarie a una verifica reale devono avere identificativi riconoscibili; un’eventuale pulizia riguarda soltanto questi elementi, dopo aver verificato che non siano stati riutilizzati.

Prima e dopo il rilascio provare accesso Google, ricaricamento della sessione, apertura/salvataggio, ricerca Pixabay e almeno un export sul deployment effettivo. La produzione apre direttamente l’app; le anteprime mantengono la protezione Vercel. Registrare in consegna i controlli eseguiti e le eventuali verifiche mancanti.
