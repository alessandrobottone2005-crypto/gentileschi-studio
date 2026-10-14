# Identità e interfaccia

## Marchio

Il marchio dell’app usa il simbolo ufficiale dell’Istituto Superiore Gentileschi e la scritta **Gentileschi Studio**, ricavati dalle reference Figma `53:3682` e `53:3447` del file [PostAssembleaIstituto](https://www.figma.com/design/ywejsvJaT41fwJ1KnwDsU2/PostAssembleaIstituto). Conservare forma e proporzioni del simbolo; usare la versione monocromatica adatta allo sfondo. Il simbolo da solo identifica favicon e icona dell’app; il marchio completo compare nelle superfici principali.

Non ridisegnare il logo con un’icona generica. Usare gli asset acquisiti e salvati nel progetto; l’app non deve dipendere da URL temporanei Figma.

Gli asset utilizzati dall’interfaccia sono in `public/brand/`; le copie acquisite da Figma sono conservate in `public/brand/originals/`. La versione UI usa nero puro mantenendo geometria e proporzioni originali. Il componente condiviso `Brand` associa al simbolo la scritta dell’app; il logo istituzionale completo rimane disponibile come risorsa.

## Colori dell’interfaccia

L’intera app usa il light mode: accesso, caricamenti, navigazione, dashboard, account, utenti, libreria, editor e finestre di dialogo. La palette UI è composta da bianco, nero e gradazioni neutre ottenute da questi colori. Non usare accenti blu, lime o altri colori nelle superfici dell’app.

- Pannelli e controlli su fondo bianco; area di lavoro e separatori in neutri chiari.
- Testi e azioni principali neri; testi secondari con contrasto sufficiente.
- Selezione, focus, caricamento, conferma ed errore riconoscibili mediante bordo, icona e testo; il colore non è l’unico segnale.
- Stato disabilitato visibile senza confonderlo con un controllo attivo.

Le fotografie, i temi, gli elementi, i campioni del selettore colore e i contenuti esportati conservano i propri colori. I token dell’interfaccia sono separati dai token grafici delle slide: modificare la palette UI non modifica le 39 composizioni ufficiali.

## Tipografia e layout

L’interfaccia mantiene una gerarchia leggibile, etichette italiane e controlli coerenti. I font delle slide sono quelli ufficiali e quelli importati dai temi Figma; non dipendono dalla tipografia dei pannelli.

La dashboard organizza Panoramica, Progetti, Libreria, Account e Utenti. L’editor mantiene tela centrale, strumenti contestuali, pannelli Temi/Elementi/Testo/Foto/Caricamenti/Dati e miniature delle pagine. Misure e regolazioni meno frequenti restano in Avanzate.

Su desktop la navigazione laterale e i pannelli usano lo spazio disponibile senza ridurre inutilmente la tela. Su telefono la barra inferiore e i pannelli compatti mantengono accessibili le stesse operazioni; il documento rimane visibile durante l’editing.

## Interazioni e accessibilità

- Focus da tastiera visibile e gestione del focus nei dialoghi.
- Nomi accessibili per i pulsanti con sola icona; stato espanso, selezionato e premuto dove pertinente.
- Controlli touch sufficientemente grandi, senza azioni disponibili solo al passaggio del mouse.
- Nessun overflow orizzontale delle pagine; la tela può essere esplorata con zoom e spostamento.
- Messaggi di recupero specifici per rete, sessione scaduta e conflitto di revisione.
- Durante caricamenti ed errori, un conteggio sconosciuto non viene mostrato come zero.

La galleria temi presenta copertine grandi e un’anteprima navigabile prima dell’applicazione. La ricerca fotografica mostra autore e provenienza; ritaglio, scontorno ed effetti restano modificabili e annullabili.
