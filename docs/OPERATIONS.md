# Ambienti e operazioni

## Ambienti

La produzione è [gentileschi-studio.vercel.app](https://gentileschi-studio.vercel.app/), collegata alla branch `main`. L’applicazione è accessibile direttamente; l’accesso ai dati dello studio richiede Google. Le anteprime Vercel rimangono protette e servono per la verifica prima della pubblicazione.

L’installazione Supabase esistente usa il progetto `aukspzeknnbhvdhpntiu` e il bucket privato `gentileschi-media`. Controllare l’identificativo, non soltanto il nome, prima di qualsiasi operazione amministrativa. Le anteprime possono usare lo stesso database della produzione: le modifiche effettuate nell’anteprima possono quindi cambiare contenuti condivisi reali.

I file `.env`, `.env.local`, `.vercel/`, cache, screenshot e report di prova sono locali e ignorati da Git. Non copiare valori segreti nella documentazione, nei log, nelle issue o nelle descrizioni dei commit.

## Variabili e runtime

La lista di riferimento è [`.env.example`](../.env.example). Il browser usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; quest’ultimo nome è mantenuto per compatibilità e contiene la chiave pubblica Supabase.

I servizi server usano `SUPABASE_SERVER_KEY`, `PIXABAY_API_KEY` e `GEMINI_API_KEY`. Sono accettati anche `SUPABASE_SERVICE_ROLE_KEY` come fallback della chiave privilegiata e `SUPABASE_URL`/`SUPABASE_ANON_KEY` come alias server della configurazione pubblica. Non assegnare mai un prefisso `VITE_` alle chiavi private.

Configurare separatamente Preview e Production in Vercel. Una variabile disponibile soltanto per una branch di anteprima non è automaticamente disponibile in produzione. Dopo la modifica, creare un nuovo deployment; per le prove locali, riavviare il processo.

`npm run dev` espone le tre route `/api/photos`, `/api/account` e `/api/ai/generate` con gli stessi handler autenticati di Vercel. Anche in locale, chiavi e sessioni valide sono necessarie per usare servizi e dati cloud. Il middleware locale restituisce 400 per JSON non valido, 413 oltre 64 KiB di corpo richiesta e 503 per un errore inatteso. `npm run preview` verifica gli asset della build, ma non esegue le API.

## Database esistente

Lo schema base e le migrazioni account, temi grafici e cache Pixabay sono già applicati all’installazione esistente. Non rieseguirli per un aggiornamento dell’interfaccia o per una riorganizzazione delle cartelle.

La migrazione Pixabay crea tabelle senza `IF NOT EXISTS` e sostituisce `studio_media()`: non è un comando di verifica né un aggiornamento ripetibile. Prima di una modifica futura, ispezionare lo stato effettivo, preparare una nuova migrazione e verificarla su un ambiente adeguato.

La pulizia di dati di prova è separata dal rilascio. Lo script storico `scripts/maintenance/cleanup-test-projects.mjs` riguarda soltanto identificativi specifici; non avviarlo durante installazione, test, refactoring o deployment. Non cancellare fotografie, account, progetti o temi per ottenere una repository ordinata.

## Nuova installazione

Questa procedura riguarda un database nuovo, non il progetto esistente.

1. Creare il progetto Supabase e configurare URL, chiave pubblica e chiave server negli ambienti appropriati.
2. Applicare [`supabase/schema.sql`](../supabase/schema.sql), che crea progetti, quota AI, bucket privato e politiche iniziali.
3. Configurare l’accesso Google e creare l’identità che dovrà diventare amministratore.
4. Preparare il bootstrap amministratore della migrazione account per la nuova installazione: la copia storica contiene un’identità verificata del progetto originale e rifiuta un database privo di quell’identità. Non applicarla alla cieca e non modificare l’identità di account esistenti.
5. Applicare la migrazione account, poi quella dei temi grafici, infine quella della cache Pixabay, nell’ordine riportato sotto. Non ripetere la migrazione Pixabay dopo un’applicazione riuscita.
6. Verificare RLS, amministratore, libreria, revisioni e disponibilità delle API prima di utilizzare lo studio.

| Ordine | Migrazione |
| --- | --- |
| 1 | `20261012_studio_accounts.sql` |
| 2 | `20261012212457_graphics_themes.sql` |
| 3 | `20261013074040_pixabay_cache.sql` |

I file storici restano una descrizione dell’installazione originale. Per automatizzare un nuovo ambiente, preparare una procedura di bootstrap esplicita e verificata anziché alterare o rieseguire le migrazioni già distribuite.

## Accesso Google

Supabase gestisce il provider Google e la sessione. Client ID e Client Secret OAuth sono configurati nel provider, non nel browser o nelle variabili frontend.

Il callback Google è `https://<project-ref>.supabase.co/auth/v1/callback`. Configurare Site URL e redirect effettivamente usati da produzione, sviluppo e anteprime autorizzate. La pagina pubblica `/privacy` è disponibile senza sessione. Consultare la [procedura ufficiale Google/Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google) per un nuovo ambiente.

Il plugin Supabase e il servizio dell’app hanno autorizzazioni distinte: avere una chiave server funzionante non garantisce che il plugin collegato possa amministrare lo stesso progetto.

## Pubblicazione e recupero

1. Eseguire test, controlli server e build; verificare che la modifica Git non includa segreti o artefatti locali.
2. Pubblicare la branch di lavoro e verificare il deployment Preview con le sue variabili e redirect.
3. Controllare flussi completi, export e compatibilità dei dati secondo [TESTING.md](TESTING.md).
4. Aggiornare `main` con la versione verificata e pubblicare su Production. Confermare variabili richieste, accesso Google e Pixabay sul dominio pubblico.
5. Registrare commit e deployment effettivamente verificati nella consegna, senza aggiungere link temporanei ai documenti permanenti.

Se il rilascio ha una regressione, ripristinare il deployment precedente in Vercel e mantenere una correzione tracciata in Git. Il ripristino del frontend non annulla eventuali dati modificati nel database: questo rebranding e riordino non richiedono migrazioni o trasformazioni distruttive dei dati.
