import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, it, expect } from "vitest";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;CREATE TABLE storage.objects(id uuid,name text,owner_id text,metadata jsonb,user_metadata jsonb,created_at timestamptz,bucket_id text);CREATE FUNCTION public.studio_media() RETURNS integer LANGUAGE sql AS $$SELECT 1$$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;`,
  );
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261013074040_pixabay_cache.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
it("keeps the provider cache and quota private to the server", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec("SET ROLE " + role);
    await expect(
      db.query("SELECT * FROM public.pixabay_search_cache"),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query("SELECT public.consume_pixabay_request()"),
    ).rejects.toThrow(/permission denied/);
    await db.exec("RESET ROLE");
  }
  await db.exec("SET ROLE service_role");
  await db.exec(
    `INSERT INTO public.pixabay_search_cache VALUES ('q=scuola','{"hits":[]}',now()+interval '24 hours')`,
  );
  expect(
    (await db.query("SELECT * FROM public.pixabay_search_cache")).rows,
  ).toHaveLength(1);
  await db.exec("RESET ROLE");
});
it("limits shared requests atomically and clears expired caches", async () => {
  await db.exec(
    `INSERT INTO public.pixabay_search_cache VALUES ('expired','{}',now()-interval '1 second');SET ROLE service_role;`,
  );
  for (let i = 0; i < 45; i++)
    expect(
      (
        await db.query<{ allowed: boolean }>(
          "SELECT public.consume_pixabay_request() AS allowed",
        )
      ).rows[0].allowed,
    ).toBe(true);
  expect(
    (
      await db.query<{ allowed: boolean }>(
        "SELECT public.consume_pixabay_request() AS allowed",
      )
    ).rows[0].allowed,
  ).toBe(false);
  expect(
    (
      await db.query(
        `SELECT * FROM public.pixabay_search_cache WHERE key='expired'`,
      )
    ).rows,
  ).toHaveLength(0);
  await db.exec("RESET ROLE");
});
it("retains source attribution for both authenticated accounts and denies anonymous access", async () => {
  await db.exec(
    `INSERT INTO storage.objects VALUES ('11111111-1111-4111-8111-111111111111','image.png','owner','{"size":1024,"mimetype":"image/png"}','{"originalName":"Pixabay","source":{"provider":"pixabay","id":42,"author":"Autore"}}',now(),'gentileschi-media');`,
  );
  for (const id of [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
  ]) {
    await db.exec(
      `SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${id}',false);`,
    );
    expect(
      (await db.query<{ source: any }>("SELECT * FROM public.studio_media()"))
        .rows[0].source,
    ).toMatchObject({ provider: "pixabay", id: 42, author: "Autore" });
    await db.exec("RESET ROLE");
  }
  await db.exec("SET ROLE anon");
  await expect(db.query("SELECT * FROM public.studio_media()")).rejects.toThrow(
    /permission denied/,
  );
  await db.exec("RESET ROLE");
});
