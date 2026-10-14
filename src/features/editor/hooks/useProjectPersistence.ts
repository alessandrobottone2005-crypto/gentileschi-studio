import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../../../shared/types/template";
import { getProjects, ProjectConflictError, saveProject } from "../../../shared/data/projectService";

type SaveStatus = "saved" | "saving" | "error" | "conflict";

/** Serializes revisions and flushes the debounce before leaving the editor. */
export function useProjectPersistence(project: Project, reset: (project: Project) => void) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const revision = useRef(project.revision);
  const latest = useRef(project);
  latest.current = project;
  const observed = useRef(project);
  const saved = useRef(project);
  const sequence = useRef(0);
  const blocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pendingWrites = useRef(0);

  const clearPending = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const enqueue = useCallback((snapshot: Project, edit: number) => {
    pendingWrites.current += 1;
    const result = queue.current.then(async () => {
      if (blocked.current) return false;
      if (saved.current === snapshot) {
        if (edit === sequence.current) setSaveStatus("saved");
        return true;
      }
      try {
        const persisted = await saveProject({ ...snapshot, revision: revision.current });
        revision.current = persisted.revision;
        saved.current = snapshot;
        if (edit === sequence.current) {
          setSaveError("");
          setSaveStatus("saved");
        }
        return true;
      } catch (error) {
        // A queued newer edit must never overwrite a revision conflict.
        blocked.current = true;
        setSaveError(error instanceof Error ? error.message : "Salvataggio non riuscito.");
        setSaveStatus(error instanceof ProjectConflictError ? "conflict" : "error");
        return false;
      }
    }).finally(() => { pendingWrites.current -= 1; });
    queue.current = result.then(() => undefined);
    return result;
  }, []);

  useEffect(() => {
    if (observed.current === project && retryTick === 0) return;
    observed.current = project;
    const edit = ++sequence.current;
    if (blocked.current) return;
    if (saved.current === project && pendingWrites.current === 0) {
      setSaveStatus("saved");
      return;
    }
    setSaveStatus("saving");
    timer.current = setTimeout(() => {
      timer.current = undefined;
      void enqueue(project, edit);
    }, 700);
    return clearPending;
  }, [project, retryTick, enqueue, clearPending]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== "saved") event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveStatus]);

  const flush = useCallback(async () => {
    clearPending();
    return enqueue(latest.current, sequence.current);
  }, [clearPending, enqueue]);

  const retrySave = useCallback(() => {
    blocked.current = false;
    setRetryTick((value) => value + 1);
  }, []);

  const reloadProject = useCallback(async () => {
    clearPending();
    await queue.current;
    try {
      const current = (await getProjects()).find((item) => item.id === latest.current.id);
      if (!current) throw new Error("Progetto non trovato.");
      revision.current = current.revision;
      observed.current = current;
      saved.current = current;
      blocked.current = false;
      sequence.current += 1;
      reset(current);
      setSaveError("");
      setSaveStatus("saved");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Ricarica non riuscita.");
    }
  }, [clearPending, reset]);

  const saveAsCopy = useCallback(async (onSaved: () => void) => {
    try {
      await saveProject({
        ...latest.current,
        id: `proj-${crypto.randomUUID()}`,
        title: `${latest.current.title} (Copia)`,
        revision: undefined,
        createdAt: new Date().toISOString(),
      });
      clearPending();
      onSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Copia non salvata.");
    }
  }, [clearPending]);

  return { saveStatus, saveError, setSaveError, retrySave, reloadProject, saveAsCopy, flush };
}
