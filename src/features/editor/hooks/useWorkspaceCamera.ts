import { useEffect, useRef, useState, type RefObject, type PointerEvent } from "react";
import type { ProjectFormat } from "../../../shared/types/scene";

export function useWorkspaceCamera(format: ProjectFormat, stageRef: RefObject<HTMLDivElement>) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hand, setHand] = useState(false);
  const camera = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  camera.current = { zoom, pan };
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const cameraGesture = useRef<{
    distance: number;
    center: { x: number; y: number };
    zoom: number;
    pan: { x: number; y: number };
  }>();
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pointers.current.clear();
    cameraGesture.current = undefined;
  }, [format]);
  useEffect(() => {
    // A pointer can be released outside the viewport before capture starts.
    const end = (event: globalThis.PointerEvent) => {
      pointers.current.delete(event.pointerId);
      if (pointers.current.size < 2) cameraGesture.current = undefined;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        setZoom((old) =>
          Math.max(0.4, Math.min(4, old * (event.deltaY > 0 ? 0.9 : 1.1))),
        );
      } else if (hand) {
        event.preventDefault();
        setPan((old) => ({ x: old.x - event.deltaX, y: old.y - event.deltaY }));
      }
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, [stageRef, hand]);
  const pointerDown = (e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 || hand) {
      e.stopPropagation();
      e.preventDefault();
      window.dispatchEvent(new Event("studio-camera-start"));
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      cameraGesture.current = {
        distance:
          pts.length === 2
            ? Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
            : 0,
        center:
          pts.length === 2
            ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
            : pts[0],
        ...camera.current,
      };
    }
  };
  const pointerMove = (e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const gesture = cameraGesture.current;
    if (!gesture) return;
    e.stopPropagation();
    e.preventDefault();
    const pts = [...pointers.current.values()];
    const center =
      pts.length === 2
        ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        : pts[0];
    setPan({
      x: gesture.pan.x + center.x - gesture.center.x,
      y: gesture.pan.y + center.y - gesture.center.y,
    });
    if (pts.length === 2 && gesture.distance)
      setZoom(
        Math.max(
          0.4,
          Math.min(
            4,
            (gesture.zoom *
              Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)) /
              gesture.distance,
          ),
        ),
      );
  };
  const pointerEnd = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) cameraGesture.current = undefined;
  };

  return { zoom, setZoom, pan, setPan, hand, setHand, pointerDown, pointerMove, pointerEnd };
}
