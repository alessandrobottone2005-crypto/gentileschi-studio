-- Schema per Gentileschi Studio su Supabase

-- 1. Tabella Progetti
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single', 'carousel')),
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    caption TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- Abilitazione Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy di sicurezza: ogni utente autenticato può gestire i propri progetti
CREATE POLICY "Gli utenti possono leggere i propri progetti"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono inserire i propri progetti"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono aggiornare i propri progetti"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono eliminare i propri progetti"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- 2. Storage Bucket per immagini caricate
-- Esegui questo blocco per creare il bucket privato
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gentileschi-media', 'gentileschi-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy di lettura pubblica immagini del bucket
CREATE POLICY "Media pubblici in lettura"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'gentileschi-media');

-- Policy di caricamento immagini per utenti autenticati
CREATE POLICY "Utenti autenticati possono caricare media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'gentileschi-media' AND auth.role() = 'authenticated');
