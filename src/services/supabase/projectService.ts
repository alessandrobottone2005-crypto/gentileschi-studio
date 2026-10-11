import { Project } from '../../types/template';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { createInitialProject } from '../../engine/defaultData';

const LOCAL_STORAGE_KEY = 'gentileschi_studio_projects';

export async function getProjects(): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        slides: row.slides,
        caption: row.caption,
        userId: row.user_id,
      }));
    }
    console.warn('Fallback a storage locale causa errore Supabase:', error);
  }

  // Local storage fallback
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Errore lettura localStorage', e);
  }

  // Initial default project
  const initial = [createInitialProject('carousel')];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export async function saveProject(project: Project): Promise<void> {
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  // 1. Supabase persistence
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('projects').upsert({
      id: updatedProject.id,
      title: updatedProject.title,
      type: updatedProject.type,
      updated_at: updatedProject.updatedAt,
      slides: updatedProject.slides,
      caption: updatedProject.caption,
    });
    if (error) {
      console.error('Errore durante salvataggio su Supabase:', error);
    }
  }

  // 2. Local storage persistence (always synced as reliable cache)
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: Project[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex((p) => p.id === updatedProject.id);
    if (index >= 0) {
      list[index] = updatedProject;
    } else {
      list.unshift(updatedProject);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Errore salvataggio localStorage', e);
  }
}

export async function duplicateProject(projectId: string): Promise<Project> {
  const projects = await getProjects();
  const target = projects.find((p) => p.id === projectId);
  if (!target) {
    throw new Error('Progetto non trovato per duplicazione');
  }

  const clone: Project = {
    ...JSON.parse(JSON.stringify(target)),
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: `${target.title} (Copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveProject(clone);
  return clone;
}

export async function deleteProject(projectId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('projects').delete().eq('id', projectId);
  }

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const list: Project[] = JSON.parse(stored);
      const filtered = list.filter((p) => p.id !== projectId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Errore rimozione da localStorage', e);
  }
}
