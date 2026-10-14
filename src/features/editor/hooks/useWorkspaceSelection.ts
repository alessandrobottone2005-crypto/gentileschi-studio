import type { Slide } from "../../../shared/types/template";
import type { SlideScene, SceneNode } from "../../../shared/types/scene";
import { allNodes, clone, findNode, parentNodes, updateNode, duplicateNode, groupNodes, resolveText } from "../../../shared/composition/scene";

export function useWorkspaceSelection({ slide, scene, node, selected, locked, changeScene, onSelect, setError }: { slide: Slide | null; scene?: SlideScene; node?: SceneNode; selected: string[]; locked: boolean; changeScene: (scene: SlideScene) => void; onSelect: (id: string, additive: boolean) => void; setError: (message: string) => void }) {
  const duplicate = () => {
    if (!scene || !node || locked) return;
    const resolved = clone(scene);
    for (const n of allNodes(resolved.nodes)) {
      if (n.kind === "text") n.text = resolveText(slide!, n);
      if (n.binding === "image")
        n.media = clone(slide!.content.image || n.media);
    }
    const next = duplicateNode(resolved, node.id);
    changeScene(next.scene);
    onSelect(next.id, false);
  };
  const group = () => {
    if (!scene) return;
    const frame = document.querySelector<HTMLElement>(
      ".editor-preview-panel [data-scene-frame]",
    );
    const f = frame?.getBoundingClientRect();
    const ratio = f ? f.width / scene.width : 1;
    const boxes = selected
      .map((id) =>
        frame
          ?.querySelector<HTMLElement>(`[data-scene-node="${id}"]`)
          ?.getBoundingClientRect(),
      )
      .filter(Boolean) as DOMRect[];
    const bounds =
      f && boxes.length === selected.length
        ? {
            x: (Math.min(...boxes.map((b) => b.left)) - f.left) / ratio,
            y: (Math.min(...boxes.map((b) => b.top)) - f.top) / ratio,
            width:
              (Math.max(...boxes.map((b) => b.right)) -
                Math.min(...boxes.map((b) => b.left))) /
              ratio,
            height:
              (Math.max(...boxes.map((b) => b.bottom)) -
                Math.min(...boxes.map((b) => b.top))) /
              ratio,
          }
        : undefined;
    const next = groupNodes(scene, selected, bounds);
    const oldIds = new Set(allNodes(scene.nodes).map((n) => n.id));
    const created = allNodes(next.nodes).find((n) => !oldIds.has(n.id));
    if (!created) {
      setError("Seleziona almeno due elementi sbloccati.");
      return;
    }
    changeScene(next);
    onSelect(created.id, false);
  };
  const geometry = () => {
    if (!scene) return [];
    const frame = document.querySelector<HTMLElement>(
      ".editor-preview-panel [data-scene-frame]",
    );
    const frameBox = frame?.getBoundingClientRect();
    if (!frameBox) return [];
    return selected
      .filter(
        (id) =>
          !parentNodes(scene, id)?.some((parent) =>
            selected.includes(parent.id),
          ),
      )
      .flatMap((id) => {
        const n = findNode(scene, id);
        const element = frame?.querySelector<HTMLElement>(
          `[data-scene-node="${id}"]`,
        );
        if (
          !n ||
          !element ||
          n.locked ||
          parentNodes(scene, id)?.some((parent) => parent.locked)
        )
          return [];
        const box = element.getBoundingClientRect();
        let matrix = new DOMMatrix();
        let parent = element.parentElement;
        while (parent) {
          const transform = getComputedStyle(parent).transform;
          if (transform !== "none")
            matrix = new DOMMatrix(transform).multiply(matrix);
          parent = parent.parentElement;
        }
        return [{ node: n, box, inverse: matrix.inverse(), frame: frameBox }];
      });
  };
  const align = (axis: "x" | "y", position: "start" | "center" | "end") => {
    if (!scene) return;
    const elements = geometry();
    if (!elements.length) return;
    const start = axis === "x" ? "left" : "top",
      end = axis === "x" ? "right" : "bottom",
      length = axis === "x" ? "width" : "height";
    const a =
      elements.length > 1
        ? Math.min(...elements.map((e) => e.box[start]))
        : elements[0].frame[start];
    const b =
      elements.length > 1
        ? Math.max(...elements.map((e) => e.box[end]))
        : elements[0].frame[end];
    let next = scene;
    for (const e of elements) {
      const shift =
        position === "start"
          ? a - e.box[start]
          : position === "end"
            ? b - e.box[end]
            : (a + b - e.box[length]) / 2 - e.box[start];
      const delta = e.inverse.transformPoint(
        // A displacement has w=0, so panning the canvas cannot translate it again.
        new DOMPoint(axis === "x" ? shift : 0, axis === "y" ? shift : 0, 0, 0),
      );
      next = updateNode(next, e.node.id, {
        x: e.node.x + delta.x,
        y: e.node.y + delta.y,
      });
    }
    changeScene(next);
  };
  const distribute = (axis: "x" | "y") => {
    if (!scene) return;
    const start = axis === "x" ? "left" : "top",
      end = axis === "x" ? "right" : "bottom",
      length = axis === "x" ? "width" : "height";
    const elements = geometry().sort((a, b) => a.box[start] - b.box[start]);
    if (elements.length < 3) return;
    const gap =
      (elements[elements.length - 1].box[end] -
        elements[0].box[start] -
        elements.reduce((sum, e) => sum + e.box[length], 0)) /
      (elements.length - 1);
    let cursor = elements[0].box[start],
      next = scene;
    for (const e of elements) {
      const shift = cursor - e.box[start];
      const delta = e.inverse.transformPoint(
        new DOMPoint(axis === "x" ? shift : 0, axis === "y" ? shift : 0, 0, 0),
      );
      next = updateNode(next, e.node.id, {
        x: e.node.x + delta.x,
        y: e.node.y + delta.y,
      });
      cursor += e.box[length] + gap;
    }
    changeScene(next);
  };

  return { duplicate, group, align, distribute };
}
