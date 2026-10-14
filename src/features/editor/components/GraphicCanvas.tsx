import React, { useEffect, useRef, useState } from "react";
import type { Slide } from "../../../shared/types/template";
import type { SceneNode, SlideScene } from "../../../shared/types/scene";
import {
  findNode,
  parentNodes,
  updateNode,
  editText,
  resolveText,
} from "../../../shared/composition/scene";
import { SceneRenderer } from "../../../shared/rendering/SceneRenderer";

export function GraphicCanvas({
  slide,
  selected,
  onSelect,
  onCommit,
  aspectLocked,
  guides,
  previewScale,
  onChangeSlide,
  cropping,
  textRequest,
}: {
  slide: Slide;
  selected: string[];
  onSelect: (id: string, additive: boolean) => void;
  onCommit: (scene: SlideScene) => void;
  aspectLocked: boolean;
  guides: boolean;
  previewScale: number;
  onChangeSlide?: (slide: Slide) => void;
  cropping?: string;
  textRequest?: { id: string; nonce: number };
}) {
  const [editingText, setEditingText] = useState<string>();
  useEffect(() => {
    if (textRequest) setEditingText(textRequest.id);
  }, [textRequest]);
  const [draft, setDraft] = useState<SlideScene | null>(null);
  const cleanup = useRef<(() => void) | undefined>();
  useEffect(() => {
    const cancel = () => cleanup.current?.();
    window.addEventListener("studio-camera-start", cancel);
    return () => {
      cancel();
      window.removeEventListener("studio-camera-start", cancel);
    };
  }, []);
  useEffect(() => {
    cleanup.current?.();
    setDraft(null);
    setEditingText(undefined);
  }, [slide.id, slide.scene]);
  const gesture = (
    event: React.PointerEvent,
    node: SceneNode,
    operation: "move" | "resize" | "rotate",
  ) => {
    if (
      event.button !== 0 ||
      node.locked ||
      parentNodes(slide.scene!, node.id)?.some((parent) => parent.locked)
    )
      return;
    event.preventDefault();
    cleanup.current?.();
    const element = event.currentTarget.closest(
      "[data-scene-node]",
    ) as HTMLElement;
    const inverseAt = (target: HTMLElement, includeSelf = false) => {
      let matrix = new DOMMatrix();
      let parent: HTMLElement | null = includeSelf
        ? target
        : target.parentElement;
      while (parent) {
        const transform = getComputedStyle(parent).transform;
        if (transform !== "none")
          matrix = new DOMMatrix(transform).multiply(matrix);
        parent = parent.parentElement;
      }
      return matrix.inverse();
    };
    const active =
      operation === "move" && selected.includes(node.id)
        ? selected.filter(
            (id) =>
              !findNode(slide.scene!, id)?.locked &&
              !parentNodes(slide.scene!, id)?.some((parent) => parent.locked),
          )
        : [node.id];
    // A selected parent already moves its descendants.
    const topIds = active.filter(
      (id) =>
        !parentNodes(slide.scene!, id)?.some((parent) =>
          active.includes(parent.id),
        ),
    );
    const matrices = new Map(
      topIds.map((id) => {
        const candidate = element
          .closest("[data-scene-frame]")
          ?.querySelector<HTMLElement>(`[data-scene-node="${id}"]`);
        return [id, inverseAt(candidate || element)];
      }),
    );
    const ownInverse = inverseAt(element, true);
    const initial = slide.scene!;
    let next = initial;
    const startX = event.clientX;
    const startY = event.clientY;
    const bounds = element.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== event.pointerId) return;
      const dx = pointer.clientX - startX;
      const dy = pointer.clientY - startY;
      next = initial;
      if (
        operation === "move" &&
        cropping === node.id &&
        node.kind === "image"
      ) {
        const media =
          node.binding === "image"
            ? slide.content.image || node.media
            : node.media;
        // Pointer deltas are vectors: camera translations must not affect them.
        const delta = ownInverse.transformPoint(new DOMPoint(dx, dy, 0, 0));
        next = updateNode(initial, node.id, {
          media: {
            ...media,
            crop: {
              scale: media?.crop?.scale ?? media?.scale ?? 1,
              x: (media?.crop?.x ?? media?.posX ?? 0) + delta.x,
              y: (media?.crop?.y ?? media?.posY ?? 0) + delta.y,
            },
          },
        });
      } else if (operation === "move") {
        for (const id of topIds) {
          const source = findNode(initial, id)!;
          const delta = matrices.get(id)!.transformPoint(new DOMPoint(dx, dy, 0, 0));
          let x = source.x + delta.x;
          let y = source.y + delta.y;
          if (guides && !parentNodes(initial, id)?.length) {
            if (Math.abs(x + source.width / 2 - initial.width / 2) < 12)
              x = (initial.width - source.width) / 2;
            if (Math.abs(y + source.height / 2 - initial.height / 2) < 12)
              y = (initial.height - source.height) / 2;
          }
          next = updateNode(next, id, { x, y });
        }
      } else if (operation === "resize") {
        const delta = ownInverse.transformPoint(new DOMPoint(dx, dy, 0, 0));
        let width = Math.max(12, node.width + delta.x);
        let height = Math.max(12, node.height + delta.y);
        if (aspectLocked || node.kind === "group") {
          const ratio = Math.max(width / node.width, height / node.height);
          width = node.width * ratio;
          height = node.height * ratio;
        }
        next = updateNode(
          initial,
          node.id,
          node.kind === "group"
            ? { scale: ((node.scale || 1) * width) / node.width }
            : { width, height },
        );
      } else {
        const angle = Math.atan2(
          pointer.clientY - centerY,
          pointer.clientX - centerX,
        );
        let rotation = node.rotation + ((angle - startAngle) * 180) / Math.PI;
        if (pointer.shiftKey) rotation = Math.round(rotation / 15) * 15;
        next = updateNode(initial, node.id, { rotation });
      }
      setDraft(next);
    };
    const controller = new AbortController();
    const finish = (commit: boolean) => {
      controller.abort();
      cleanup.current = undefined;
      setDraft(null);
      if (commit && next !== initial) {
        if (cropping === node.id && node.binding === "image" && onChangeSlide)
          onChangeSlide({
            ...slide,
            content: {
              ...slide.content,
              image: findNode(next, node.id)?.media,
            },
            scene: next,
          });
        else onCommit(next);
      }
    };
    cleanup.current = () => finish(false);
    window.addEventListener("pointermove", move, { signal: controller.signal });
    window.addEventListener(
      "pointerup",
      (pointer) => {
        if (pointer.pointerId === event.pointerId) finish(true);
      },
      {
        signal: controller.signal,
      },
    );
    window.addEventListener("pointercancel", () => finish(false), {
      once: true,
      signal: controller.signal,
    });
    window.addEventListener("blur", () => finish(false), {
      once: true,
      signal: controller.signal,
    });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  return (
    <div
      className="graphic-canvas"
      onPointerDown={(event) => {
        if (
          event.target === event.currentTarget ||
          (event.target as HTMLElement).dataset.sceneFrame
        )
          onSelect("", false);
      }}
      style={
        {
          position: "relative",
          touchAction: "none",
          width: slide.scene!.width,
          height: slide.scene!.height,
          "--scene-handle": `${Math.max(44, 44 / previewScale)}px`,
        } as React.CSSProperties
      }
    >
      <SceneRenderer
        slide={{ ...slide, scene: draft || slide.scene }}
        interaction={{
          selected,
          onSelect,
          onGesture: gesture,
          editingText,
          onTextEdit: setEditingText,
          onTextCancel: () => setEditingText(undefined),
          onTextCommit: (node, text) => {
            setEditingText(undefined);
            if (text !== resolveText(slide, node))
              onChangeSlide?.(editText(slide, node, text));
          },
        }}
      />
      {guides && (
        <div
          className="scene-guides"
          aria-hidden="true"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
