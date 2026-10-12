import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getProjects,
  saveProject,
  deleteProject,
} from '../services/supabase/projectService';
import { createInitialProject } from '../engine/defaultData';
import { isOwnProject } from '../studio/ProjectList';
vi.mock('../services/supabase/supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false,
}));
const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe('empty local archive and personal attribution', () => {
  it('starts empty and does not seed a demonstration project on read', async () => {
    expect(await getProjects()).toEqual([]);
    expect(storage.size).toBe(0);
  });
  it('stays empty after deleting the last project and reading again', async () => {
    const project = createInitialProject('single');
    await saveProject(project);
    await deleteProject(project.id);
    expect(await getProjects()).toEqual([]);
    expect(await getProjects()).toEqual([]);
  });
  it('personal projects mean creator attribution, while local projects belong to the device', () => {
    const project = { ...createInitialProject(), userId: 'creator' };
    expect(isOwnProject(project, 'creator', false)).toBe(true);
    expect(isOwnProject(project, 'another-editor', false)).toBe(false);
    expect(
      isOwnProject({ ...project, userId: undefined }, 'another-editor', false),
    ).toBe(false);
    expect(isOwnProject(project, 'local-device', true)).toBe(true);
  });
});
