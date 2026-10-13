import { useCallback, useRef, useState } from "react";
import type { Project } from "../types/template";

export function useProjectHistory(initial: Project) {
  const [project, publish] = useState(initial);
  const current = useRef(initial);
  const past = useRef<Project[]>([]);
  const future = useRef<Project[]>([]);
  const setProject = useCallback(
    (value: Project | ((old: Project) => Project)) => {
      const next = typeof value === "function" ? value(current.current) : value;
      if (next === current.current) return;
      past.current = [...past.current.slice(-49), current.current];
      future.current = [];
      current.current = next;
      publish(next);
    },
    [],
  );
  const undo = useCallback(() => {
    const next = past.current.pop();
    if (!next) return;
    future.current.push(current.current);
    current.current = next;
    publish(next);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(current.current);
    current.current = next;
    publish(next);
  }, []);
  const reset = useCallback((next: Project) => {
    past.current = [];
    future.current = [];
    current.current = next;
    publish(next);
  }, []);
  return {
    project,
    setProject,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
