// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../shared/types/template';
import { useProjectPersistence } from '../features/editor/hooks/useProjectPersistence';
import { ProjectConflictError } from '../shared/data/projectService';

const { saveProject, getProjects } = vi.hoisted(() => ({ saveProject: vi.fn(), getProjects: vi.fn() }));
vi.mock('../shared/data/projectService', () => ({
  saveProject, getProjects,
  ProjectConflictError: class extends Error {},
}));

let root: Root;
let host: HTMLDivElement;
let state: ReturnType<typeof useProjectPersistence>;
const reset = vi.fn();
const initial: Project = { id: 'legacy-project', title: 'Originale', type: 'single', slides: [], createdAt: '', updatedAt: '', revision: 1 };
function Harness({ project }: { project: Project }) {
  state = useProjectPersistence(project, reset);
  return null;
}
async function render(project: Project) {
  await act(async () => { root.render(<Harness project={project} />); });
}
async function debounce() {
  await act(async () => { await vi.advanceTimersByTimeAsync(700); });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  saveProject.mockReset();
  saveProject.mockImplementation(async (project: Project) => ({ ...project, revision: (project.revision || 0) + 1 }));
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('editor persistence', () => {
  it('does not rewrite a legacy project just by opening it or flushing it', async () => {
    const legacy = { ...initial, revision: undefined };
    await render(legacy);
    await debounce();
    let result: boolean | undefined;
    await act(async () => { result = await state.flush(); });
    expect(result).toBe(true);
    expect(saveProject).not.toHaveBeenCalled();
    expect(state.saveStatus).toBe('saved');
  });

  it('flushes an edit before debounce exactly once, cancelling the pending timer', async () => {
    await render(initial);
    await render({ ...initial, title: 'Modificato' });
    await act(async () => { expect(await state.flush()).toBe(true); });
    await debounce();
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(saveProject.mock.calls[0][0]).toMatchObject({ title: 'Modificato', revision: 1 });
    expect(state.saveStatus).toBe('saved');
  });

  it('serializes a newer edit behind an in-flight write with the resulting revision', async () => {
    const first = deferred<Project>();
    saveProject.mockImplementationOnce(() => first.promise);
    const a = { ...initial, title: 'A' };
    const b = { ...initial, title: 'B' };
    await render(initial);
    await render(a);
    await debounce();
    await render(b);
    await debounce();
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(state.saveStatus).toBe('saving');
    await act(async () => { first.resolve({ ...a, revision: 2 }); });
    await act(async () => { await state.flush(); });
    expect(saveProject).toHaveBeenCalledTimes(2);
    expect(saveProject.mock.calls[1][0]).toMatchObject({ title: 'B', revision: 2 });
    expect(state.saveStatus).toBe('saved');
  });

  it('persists undo to the initial snapshot after a prior edit finishes saving', async () => {
    const first = deferred<Project>();
    const a = { ...initial, title: 'A' };
    saveProject.mockImplementationOnce(() => first.promise);
    await render(initial);
    await render(a);
    await debounce();
    await render(initial);
    await debounce();
    await act(async () => { first.resolve({ ...a, revision: 2 }); });
    await act(async () => { await state.flush(); });
    expect(saveProject).toHaveBeenCalledTimes(2);
    expect(saveProject.mock.calls[1][0]).toMatchObject({ title: 'Originale', revision: 2 });
    expect(state.saveStatus).toBe('saved');
  });

  it.each(['conflict', 'network'])('blocks queued writes and flush after %s without losing the newest edit', async (failure) => {
    const first = deferred<Project>();
    saveProject.mockImplementationOnce(() => first.promise);
    const a = { ...initial, title: 'A' };
    const b = { ...initial, title: 'B conservato' };
    await render(initial);
    await render(a);
    await debounce();
    await render(b);
    await debounce();
    await act(async () => {
      first.reject(failure === 'conflict' ? new ProjectConflictError() : new Error('Rete assente'));
    });
    await act(async () => { expect(await state.flush()).toBe(false); });
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(state.saveStatus).toBe(failure === 'conflict' ? 'conflict' : 'error');
    // Explicit retry writes the current snapshot, not the stale failed edit.
    await act(async () => { state.retrySave(); });
    await debounce();
    expect(saveProject).toHaveBeenCalledTimes(2);
    expect(saveProject.mock.calls[1][0]).toMatchObject({ title: 'B conservato', revision: 1 });
    expect(state.saveStatus).toBe('saved');
  });

  it('reloads the server revision after conflict before subsequent edits', async () => {
    const server = { ...initial, title: 'Versione condivisa', revision: 7 };
    getProjects.mockResolvedValueOnce([server]);
    saveProject.mockRejectedValueOnce(new ProjectConflictError());
    await render(initial);
    await render({ ...initial, title: 'Locale' });
    await debounce();
    await act(async () => { await state.reloadProject(); });
    expect(reset).toHaveBeenCalledWith(server);
    await render(server);
    await render({ ...server, title: 'Ripresa' });
    await debounce();
    expect(saveProject.mock.calls[1][0]).toMatchObject({ title: 'Ripresa', revision: 7 });
    expect(state.saveStatus).toBe('saved');
  });
});
