import React from 'react';

export const PrivacyPage: React.FC = () => (
  <main className="auth-page">
    <article className="auth-card privacy-card" aria-labelledby="privacy-title">
      <span className="auth-eyebrow">GENTILESCHI STUDIO</span>
      <h1 id="privacy-title">Informativa sulla privacy</h1>
      <p>Gentileschi Studio permette di creare, modificare ed esportare post e caroselli per la rappresentanza studentesca.</p>
      <section>
        <h2>Accesso e account</h2>
        <p>Per accedere usi il tuo account Google. Google comunica a Supabase l’identificativo dell’account, l’indirizzo email e le informazioni di base del profilo, come nome e immagine. Servono a gestire il tuo account e la sessione di accesso.</p>
        <p>La sessione viene conservata nel browser per mantenere l’accesso tra una visita e l’altra. Puoi terminarla con il comando Esci.</p>
      </section>
      <section>
        <h2>Progetti e fotografie condivisi</h2>
        <p>Testi, caption, fotografie caricate e modifiche dei progetti vengono archiviati in Supabase. Tutti gli utenti registrati possono vedere e modificare i progetti e accedere alle fotografie. L’archivio è protetto dai visitatori senza accesso.</p>
        <p>Carica solo fotografie che sei autorizzato a utilizzare. Per fotografie di studenti minorenni, assicurati di disporre della liberatoria. La rimozione dello sfondo viene elaborata nel browser.</p>
      </section>
      <section>
        <h2>Funzioni AI</h2>
        <p>Quando richiedi una generazione, la descrizione, la data selezionata o i testi delle slide necessari per la caption vengono inviati a Google Gemini dal server ospitato su Vercel. Le fotografie non sono incluse nelle attuali richieste AI.</p>
        <p>Supabase registra il numero di richieste associate al tuo account per applicare i limiti giornalieri.</p>
      </section>
      <section>
        <h2>Servizi utilizzati</h2>
        <p>Il sito è ospitato su Vercel; Supabase gestisce autenticazione e archivio; Google gestisce l’accesso e le generazioni Gemini. Le sessioni e i progetti locali possono usare la memoria del browser. Il sito carica inoltre font da Google Fonts.</p>
        <p>Puoi consultare le informative di <a href="https://policies.google.com/privacy">Google</a>, <a href="https://supabase.com/privacy">Supabase</a> e <a href="https://vercel.com/legal/privacy-policy">Vercel</a>.</p>
      </section>
      <section>
        <h2>Gestione dei dati e contatto</h2>
        <p>Puoi modificare ed eliminare i progetti dall’app. Per richieste relative al tuo account o ai dati archiviati, contatta l’amministratore di Gentileschi Studio: <a href="mailto:alessandrobottone2005@gmail.com">alessandrobottone2005@gmail.com</a>.</p>
      </section>
      <p><small>Aggiornata il 12 ottobre 2026.</small></p>
      <a className="auth-privacy-link" href="/">Torna a Gentileschi Studio</a>
    </article>
  </main>
);
