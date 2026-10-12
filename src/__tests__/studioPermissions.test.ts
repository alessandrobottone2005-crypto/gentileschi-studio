import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ADMIN = '5efa1b65-6895-426e-9fc1-77f0a8e15a53';
const EDITOR = 'a3b94989-14fb-40d8-8c8c-d0f337adc3ca';
const NEW_USER = '11111111-1111-4111-8111-111111111111';
let db: PGlite;
async function asUser(id: string, query: string) {
  try {
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${id}', false);`,
    );
    return await db.query(query);
  } finally {
    await db.exec('RESET ROLE;');
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    GRANT USAGE ON SCHEMA auth, storage, public TO authenticated, service_role, anon;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', created_at timestamptz DEFAULT now());
    CREATE TABLE auth.identities (user_id uuid, provider text);
    CREATE TABLE public.projects (id text PRIMARY KEY, user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, title text, created_at timestamptz DEFAULT now(), revision int DEFAULT 1);
    GRANT SELECT, UPDATE, INSERT, DELETE ON public.projects TO authenticated;
    CREATE TABLE storage.objects (id uuid, name text, owner_id text, metadata jsonb, user_metadata jsonb, created_at timestamptz, bucket_id text);
    INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ('${ADMIN}','alessandro.bottone.design@gmail.com','{"full_name":"Alessandro Bottone"}'), ('${EDITOR}','old@example.test','{}');
    INSERT INTO auth.identities VALUES ('${ADMIN}','google');
    INSERT INTO public.projects (id,user_id,title) VALUES ('existing-project','${EDITOR}','Progetto condiviso');
    INSERT INTO storage.objects VALUES ('22222222-2222-4222-8222-222222222222','photo.png','${ADMIN}','{"size":123,"mimetype":"image/png"}','{}',now(),'gentileschi-media');
  `);
  const sql = await readFile(
    new URL(
      '../../supabase/migrations/20261012_studio_accounts.sql',
      import.meta.url,
    ),
    'utf8',
  );
  await db.exec(sql);
}, 30000);
afterAll(async () => {
  await db?.close();
});

describe('database account permissions', () => {
  it('bootstraps the verified Google account and preserves the legacy account', async () => {
    const result = await db.query<{ id: string; role: string }>(
      'SELECT id,role FROM public.profiles ORDER BY id',
    );
    expect(result.rows).toContainEqual({ id: ADMIN, role: 'admin' });
    expect(result.rows).toContainEqual({ id: EDITOR, role: 'editor' });
  });
  it('lets an editor read their profile and shared author names but not other emails', async () => {
    const profiles = await asUser(
      EDITOR,
      'SELECT id,email FROM public.profiles',
    );
    expect(profiles.rows).toHaveLength(1);
    expect(profiles.rows[0]).toHaveProperty('id', EDITOR);
    const authors = await asUser(
      EDITOR,
      'SELECT * FROM public.studio_authors()',
    );
    expect(authors.rows).toHaveLength(2);
    expect(authors.rows[0]).not.toHaveProperty('email');
  });
  it('allows each user to change only their own display name', async () => {
    await asUser(
      EDITOR,
      `UPDATE public.profiles SET display_name = 'Nome personalizzato' WHERE id = '${EDITOR}'`,
    );
    await asUser(
      EDITOR,
      `UPDATE public.profiles SET display_name = 'Attacco' WHERE id = '${ADMIN}'`,
    );
    const result = await db.query<{ display_name: string }>(
      `SELECT display_name FROM public.profiles WHERE id = '${ADMIN}'`,
    );
    expect(result.rows[0].display_name).toBe('Alessandro Bottone');
  });
  it('rejects direct role, Google email and avatar edits', async () => {
    for (const assignment of [
      "role = 'admin'",
      "email = 'fake@example.test'",
      "avatar_url = 'fake'",
    ]) {
      await expect(
        asUser(
          EDITOR,
          `UPDATE public.profiles SET ${assignment} WHERE id = '${EDITOR}'`,
        ),
      ).rejects.toThrow(/permission denied/);
    }
  });
  it('rejects role changes from an editor and preserves the last admin', async () => {
    await expect(
      asUser(EDITOR, `SELECT public.set_studio_role('${EDITOR}', 'admin')`),
    ).rejects.toThrow(/Solo un amministratore/);
    await expect(
      asUser(ADMIN, `SELECT public.set_studio_role('${ADMIN}', 'editor')`),
    ).rejects.toThrow(/almeno un amministratore/);
  });
  it('allows an admin to promote and demote another account', async () => {
    await asUser(ADMIN, `SELECT public.set_studio_role('${EDITOR}', 'admin')`);
    const directory = await asUser(
      EDITOR,
      'SELECT id,email FROM public.profiles',
    );
    expect(directory.rows).toHaveLength(2);
    await asUser(ADMIN, `SELECT public.set_studio_role('${EDITOR}', 'editor')`);
    const directoryAfter = await asUser(
      EDITOR,
      'SELECT id,email FROM public.profiles',
    );
    expect(directoryAfter.rows).toHaveLength(1);
  });
  it('creates new profiles as editors and ignores forged metadata roles', async () => {
    await db.exec(
      `INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES ('${NEW_USER}', 'new@example.test', '{"full_name":"Nuovo utente","role":"admin"}');`,
    );
    const result = await db.query<{ role: string }>(
      `SELECT role FROM public.profiles WHERE id = '${NEW_USER}'`,
    );
    expect(result.rows[0].role).toBe('editor');
  });
  it('preserves a custom display name when Google identity updates', async () => {
    await db.exec(
      `UPDATE auth.users SET email='updated@example.test', raw_user_meta_data='{"full_name":"Nome Google"}' WHERE id='${EDITOR}'`,
    );
    const result = await db.query<{
      display_name: string;
      google_name: string;
      email: string;
    }>(
      `SELECT display_name,google_name,email FROM public.profiles WHERE id='${EDITOR}'`,
    );
    expect(result.rows[0]).toEqual({
      display_name: 'Nome personalizzato',
      google_name: 'Nome Google',
      email: 'updated@example.test',
    });
  });
  it('attributes shared media from storage owner_id', async () => {
    const result = await asUser(EDITOR, 'SELECT * FROM public.studio_media()');
    expect(result.rows[0]).toMatchObject({
      owner_id: ADMIN,
      name: 'photo.png',
      size: 123,
    });
  });
  it('preserves project creator while allowing shared title edits', async () => {
    await asUser(
      ADMIN,
      "UPDATE public.projects SET title = 'Modificato da altro account' WHERE id = 'existing-project'",
    );
    await expect(
      asUser(
        ADMIN,
        `UPDATE public.projects SET user_id = '${ADMIN}' WHERE id = 'existing-project'`,
      ),
    ).rejects.toThrow(/creatore/);
    await expect(
      asUser(
        EDITOR,
        "UPDATE public.projects SET id = 'changed' WHERE id = 'existing-project'",
      ),
    ).rejects.toThrow(/creatore/);
  });
  it('does not expose profiles or library functions to anonymous visitors', async () => {
    await db.exec('SET ROLE anon;');
    try {
      await expect(db.query('SELECT * FROM public.profiles')).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        db.query('SELECT * FROM public.studio_media()'),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec('RESET ROLE;');
    }
  });
});
