import type { GraphicTheme } from "../../types/scene";
import type { Project } from "../../types/template";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { hydrateProject, serializeProject } from "../image/mediaStore";
import { officialThemes } from "../../engine/themes";

const KEY = "gentileschi_studio_themes_v1";
const envelope = (theme: GraphicTheme): Project => ({
  id: theme.id,
  title: theme.name,
  type: "carousel",
  slides: theme.slides,
  createdAt: "",
  updatedAt: "",
  format: theme.format,
});
const readLocal = (): GraphicTheme[] =>
  JSON.parse(localStorage.getItem(KEY) || "[]");
export class ThemeConflictError extends Error {
  constructor() {
    super(
      "Il tema è stato modificato da un altro utente. Ricarica la libreria oppure salva una copia.",
    );
    this.name = "ThemeConflictError";
  }
}
export async function listThemes(): Promise<GraphicTheme[]> {
  let custom: GraphicTheme[];
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("graphic_themes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error)
      throw new Error(
        "La libreria dei temi condivisi non è disponibile. Riprova.",
      );
    custom = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      slides: row.slides,
      format: row.format,
      official: false,
      revision: row.revision,
      creatorId: row.creator_id,
      updatedAt: row.updated_at,
    }));
  } else custom = readLocal();
  return [
    ...officialThemes(),
    ...(await Promise.all(
      custom.map(async (theme) => ({
        ...theme,
        slides: (await hydrateProject(envelope(theme))).slides,
      })),
    )),
  ];
}
export async function saveTheme(theme: GraphicTheme): Promise<GraphicTheme> {
  if (theme.official)
    throw new Error("Salva una copia per personalizzare un tema ufficiale.");
  if (
    !theme.name.trim() ||
    theme.name.trim().length > 120 ||
    !theme.slides.length
  )
    throw new Error(
      "Inserisci un nome da 1 a 120 caratteri e almeno una slide.",
    );
  const storedSlides = serializeProject(envelope(theme)).slides;
  storedSlides.forEach((slide) => {
    delete slide.projectSettings;
  });
  const stored = { ...theme, name: theme.name.trim(), slides: storedSlides };
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user)
      throw new Error("Accedi per salvare un tema condiviso.");
    const row = {
      name: stored.name,
      slides: stored.slides,
      format: stored.format,
      updated_at: now,
    };
    const result =
      theme.revision === undefined
        ? await supabase
            .from("graphic_themes")
            .insert({
              ...row,
              id: stored.id,
              creator_id: user.user.id,
              revision: 1,
            })
            .select()
            .single()
        : await supabase
            .from("graphic_themes")
            .update({ ...row, revision: theme.revision + 1 })
            .eq("id", theme.id)
            .eq("revision", theme.revision)
            .select()
            .maybeSingle();
    if (result.error)
      throw new Error(
        `Salvataggio del tema non riuscito: ${result.error.message}`,
      );
    if (!result.data) throw new ThemeConflictError();
    return {
      ...theme,
      name: stored.name,
      revision: result.data.revision,
      creatorId: result.data.creator_id,
      updatedAt: now,
    };
  }
  const themes = readLocal();
  const index = themes.findIndex((item) => item.id === theme.id);
  if (
    theme.revision !== undefined &&
    (index < 0 || themes[index].revision !== theme.revision)
  )
    throw new ThemeConflictError();
  const next = {
    ...stored,
    revision: (theme.revision || 0) + 1,
    updatedAt: now,
  };
  if (index >= 0) themes[index] = next;
  else themes.unshift(next);
  localStorage.setItem(KEY, JSON.stringify(themes));
  return {
    ...theme,
    name: stored.name,
    revision: next.revision,
    updatedAt: now,
  };
}
export async function deleteTheme(theme: GraphicTheme): Promise<void> {
  if (theme.official)
    throw new Error("I temi ufficiali rimangono disponibili nello studio.");
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("graphic_themes")
      .delete()
      .eq("id", theme.id)
      .eq("revision", theme.revision)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Eliminazione del tema non riuscita.");
    if (!data) throw new ThemeConflictError();
  } else {
    const themes = readLocal();
    if (
      !themes.some(
        (item) => item.id === theme.id && item.revision === theme.revision,
      )
    )
      throw new ThemeConflictError();
    localStorage.setItem(
      KEY,
      JSON.stringify(themes.filter((item) => item.id !== theme.id)),
    );
  }
}
