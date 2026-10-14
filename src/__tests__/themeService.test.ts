import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createInitialProject } from "../shared/composition/defaultData";
import {
  deleteTheme,
  listThemes,
  saveTheme,
  ThemeConflictError,
} from "../features/themes/services/themeService";
import type { GraphicTheme } from "../shared/types/scene";
vi.mock("../shared/lib/supabaseClient", () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));
const store = new Map<string, string>();
const sample = (): GraphicTheme => ({
  id: "theme-test",
  name: "Il mio tema",
  format: "square",
  official: false,
  slides: createInitialProject().slides,
});
beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("shared theme persistence contract", () => {
  it("always includes the real original theme and includes the twelve imported Figma sets", async () => {
    const themes = await listThemes();
    expect(themes).toHaveLength(13);
    expect(themes[0].official).toBe(true);
  });
  it("saves the full ordered set and format, then loads it again", async () => {
    const saved = await saveTheme(sample());
    expect(saved.revision).toBe(1);
    const themes = await listThemes();
    expect(themes[13]).toMatchObject({
      name: "Il mio tema",
      format: "square",
      revision: 1,
    });
    expect(themes[13].slides.map((slide) => slide.templateType)).toEqual([
      "cover",
      "agenda",
      "notice",
    ]);
  });
  it("rejects updating a stale revision rather than losing another editor’s work", async () => {
    const first = await saveTheme(sample());
    const second = await saveTheme({ ...first, name: "Aggiornato" });
    expect(second.revision).toBe(2);
    await expect(
      saveTheme({ ...first, name: "Obsoleto" }),
    ).rejects.toBeInstanceOf(ThemeConflictError);
    expect((await listThemes())[13].name).toBe("Aggiornato");
  });
  it("protects deletion against stale revisions and leaves independent project snapshots intact", async () => {
    const saved = await saveTheme(sample());
    const project = createInitialProject();
    project.themeSnapshot = saved;
    const updated = await saveTheme({ ...saved, name: "Revisionato" });
    await expect(deleteTheme(saved)).rejects.toBeInstanceOf(ThemeConflictError);
    await deleteTheme(updated);
    expect(await listThemes()).toHaveLength(13);
    expect(project.themeSnapshot.name).toBe("Il mio tema");
  });
  it("preserves official themes and requires a named, non-empty composition", async () => {
    await expect(saveTheme({ ...sample(), official: true })).rejects.toThrow(
      /copia/,
    );
    await expect(deleteTheme({ ...sample(), official: true })).rejects.toThrow(
      /ufficiali/,
    );
    await expect(saveTheme({ ...sample(), name: " " })).rejects.toThrow(/nome/);
    await expect(saveTheme({ ...sample(), slides: [] })).rejects.toThrow(
      /slide/,
    );
  });
});
