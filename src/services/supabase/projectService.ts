import type { Project } from '../../types/template';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { hydrateProject, moveLocalMediaToCloud, serializeProject } from '../image/mediaStore';

const LOCAL_STORAGE_KEY = 'gentileschi_studio_projects';
const IMPORTED_IDS_KEY = 'gentileschi_imported_local_ids';

export class ProjectConflictError extends Error {
  constructor() {
    super('Il progetto è stato modificato da un altro utente. Ricarica la versione aggiornata o salva una copia.');
    this.name = 'ProjectConflictError';
  }
}

function mapRow(row: Record<string, any>): Project {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slides: row.slides,
    caption: row.caption,
    userId: row.user_id,
    revision: row.revision,
  };
}

async function requireUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase non configurato.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Accedi per usare i progetti condivisi.');
  return data.user.id;
}

function readLocalProjects(): Project[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) return JSON.parse(stored) as Project[];
  return [];
}

export async function getProjects(options: { hydrate?: boolean } = {}): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    await requireUserId();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`Impossibile caricare i progetti condivisi: ${error.message}`);
    const projects = (data || []).map(mapRow);
    return options.hydrate === false ? projects : Promise.all(projects.map(hydrateProject));
  }
  const projects = readLocalProjects();
  return options.hydrate === false ? projects : Promise.all(projects.map(hydrateProject));
}

export async function saveProject(project: Project): Promise<Project> {
  const stored = serializeProject(project);
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const userId = await requireUserId();
    const row = {
      title: stored.title,
      type: stored.type,
      slides: stored.slides,
      caption: stored.caption || '',
      updated_at: now,
    };
    if (project.revision === undefined) {
      const { data, error } = await supabase.from('projects').insert({
        ...row,
        id: stored.id,
        user_id: userId,
        revision: 1,
      }).select().single();
      if (error || !data) throw new Error(`Salvataggio non riuscito: ${error?.message || 'risposta vuota'}`);
      return { ...project, updatedAt: data.updated_at, userId: data.user_id, revision: data.revision };
    }

    const { data, error } = await supabase.from('projects')
      .update({ ...row, revision: project.revision + 1 })
      .eq('id', project.id)
      .eq('revision', project.revision)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Salvataggio non riuscito: ${error.message}`);
    if (!data) throw new ProjectConflictError();
    return { ...project, updatedAt: data.updated_at, revision: data.revision };
  }

  const localProject = { ...stored, updatedAt: now };
  const projects = readLocalProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  if (index >= 0) projects[index] = localProject;
  else projects.unshift(localProject);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  return { ...project, updatedAt: now };
}

export async function duplicateProject(projectId: string): Promise<Project> {
  const target = (await getProjects()).find((project) => project.id === projectId);
  if (!target) throw new Error('Progetto non trovato per duplicazione.');
  const clone: Project = {
    ...target,
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: `${target.title} (Copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revision: undefined,
  };
  return saveProject(clone);
}

export async function deleteProject(projectId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await requireUserId();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw new Error(`Eliminazione non riuscita: ${error.message}`);
    return;
  }
  const projects = readLocalProjects().filter((project) => project.id !== projectId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
}

export function countLocalProjectsToImport(): number {
  if (!isSupabaseConfigured) return 0;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return 0;
  const imported = new Set<string>(JSON.parse(localStorage.getItem(IMPORTED_IDS_KEY) || '[]'));
  return (JSON.parse(raw) as Project[]).filter((project) => !imported.has(project.id)).length;
}

export async function importLocalProjects(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  await requireUserId();
  const projects = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as Project[];
  const imported = new Set<string>(JSON.parse(localStorage.getItem(IMPORTED_IDS_KEY) || '[]'));
  let count = 0;
  for (const project of projects) {
    if (imported.has(project.id)) continue;
    const migrated = await moveLocalMediaToCloud(project);
    await saveProject({
      ...migrated,
      id: `proj-${crypto.randomUUID()}`,
      title: `${project.title} (Importato)`,
      revision: undefined,
      createdAt: new Date().toISOString(),
    });
    imported.add(project.id);
    localStorage.setItem(IMPORTED_IDS_KEY, JSON.stringify([...imported]));
    count++;
  }
  return count;
}
