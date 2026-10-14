import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
async function asUser(id: string, sql: string) {
  try {
    await db.exec(
      `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${id}', false);`,
    );
    return await db.query(sql);
  } finally {
    await db.exec("RESET ROLE;");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
    GRANT USAGE ON SCHEMA auth,public TO authenticated,anon,service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY); INSERT INTO auth.users VALUES ('${A}'),('${B}');`);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/20261012212457_graphics_themes.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("theme database permissions with two accounts", () => {
  it("requires actual creator attribution when inserting", async () => {
    await expect(
      asUser(
        A,
        `INSERT INTO public.graphic_themes(id,name,format,slides,creator_id) VALUES ('theme-forged','Test','portrait','[{}]','${B}')`,
      ),
    ).rejects.toThrow(/row-level security/);
    await asUser(
      A,
      `INSERT INTO public.graphic_themes(id,name,format,slides,creator_id) VALUES ('theme-shared','Tema','portrait','[{}]','${A}')`,
    );
  });
  it("allows another account to read and update shared themes", async () => {
    expect(
      (await asUser(B, `SELECT id FROM public.graphic_themes`)).rows,
    ).toHaveLength(1);
    const next = await asUser(
      B,
      `UPDATE public.graphic_themes SET name='Aggiornato',revision=2 WHERE id='theme-shared' AND revision=1 RETURNING revision`,
    );
    expect(next.rows[0]).toHaveProperty("revision", 2);
  });
  it("does not overwrite concurrent changes made after the caller’s revision", async () => {
    const stale = await asUser(
      A,
      `UPDATE public.graphic_themes SET name='Obsoleto',revision=2 WHERE id='theme-shared' AND revision=1 RETURNING id`,
    );
    expect(stale.rows).toHaveLength(0);
  });
  it("protects creator attribution and requires revision progression", async () => {
    await expect(
      asUser(
        B,
        `UPDATE public.graphic_themes SET creator_id='${B}',revision=3 WHERE id='theme-shared'`,
      ),
    ).rejects.toThrow(/creatore/);
    await expect(
      asUser(
        B,
        `UPDATE public.graphic_themes SET name='Errore' WHERE id='theme-shared'`,
      ),
    ).rejects.toThrow(/Revisione/);
  });
  it("denies anonymous reads and writes", async () => {
    await db.exec("SET ROLE anon;");
    try {
      await expect(
        db.query("SELECT * FROM public.graphic_themes"),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("DELETE FROM public.graphic_themes"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("RESET ROLE;");
    }
  });
  it("allows another signed-in account to delete a shared theme", async () => {
    const removed = await asUser(
      B,
      `DELETE FROM public.graphic_themes WHERE id='theme-shared' AND revision=2 RETURNING id`,
    );
    expect(removed.rows).toHaveLength(1);
  });
});
