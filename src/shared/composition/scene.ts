import type { Slide } from "../types/template";
import { FORMATS, ProjectFormat, SceneNode, SlideScene } from "../types/scene";

export const clone = <T>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));
export function visibleSlideText(slide: Slide): string[] {
  const read = (nodes: SceneNode[]): string[] =>
    nodes.flatMap((node) =>
      !node.visible || node.opacity === 0
        ? []
        : node.kind === "text"
          ? [resolveText(slide, node)]
          : read(node.children || []),
    );
  return slide.scene ? read(slide.scene.nodes) : [];
}
export const newId = () => `element-${crypto.randomUUID()}`;
export function allNodes(nodes: SceneNode[]): SceneNode[] {
  return nodes.flatMap((node) => [node, ...allNodes(node.children || [])]);
}
export function findNode(scene: SlideScene, id: string) {
  return allNodes(scene.nodes).find((node) => node.id === id);
}
export function parentNodes(
  scene: SlideScene,
  id: string,
  nodes = scene.nodes,
  parents: SceneNode[] = [],
): SceneNode[] | undefined {
  for (const node of nodes) {
    if (node.id === id) return parents;
    const found =
      node.children &&
      parentNodes(scene, id, node.children, [...parents, node]);
    if (found) return found;
  }
}
export function updateNode(
  scene: SlideScene,
  id: string,
  patch: Partial<SceneNode>,
): SlideScene {
  const walk = (nodes: SceneNode[]): SceneNode[] =>
    nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            ...patch,
            overrides: [
              ...new Set([
                ...(node.overrides || []),
                ...Object.keys(patch).filter(
                  (key) => key !== "overrides" && key !== "style",
                ),
                ...Object.keys(patch.style || {}).map((key) => `style.${key}`),
              ]),
            ],
            style: patch.style ? { ...node.style, ...patch.style } : node.style,
          }
        : { ...node, children: node.children && walk(node.children) },
    );
  return { ...scene, nodes: walk(scene.nodes) };
}
export function removeNodes(scene: SlideScene, ids: string[]): SlideScene {
  const removed = allNodes(scene.nodes)
    .filter((node) => ids.includes(node.id))
    .flatMap((node) => allNodes([node]));
  const walk = (nodes: SceneNode[]): SceneNode[] =>
    nodes
      .filter((node) => !ids.includes(node.id))
      .map((node) => ({
        ...node,
        children: node.children && walk(node.children),
      }));
  return {
    ...scene,
    nodes: walk(scene.nodes),
    removedKeys: [
      ...new Set([...(scene.removedKeys || []), ...removed.map(nodeKey)]),
    ],
    deletedItemIds: [
      ...new Set([
        ...(scene.deletedItemIds || []),
        ...removed.flatMap((node) =>
          node.agendaItemId ? [node.agendaItemId] : [],
        ),
      ]),
    ],
  };
}
export function remapIds(node: SceneNode): SceneNode {
  return {
    ...clone(node),
    id: newId(),
    children: node.children?.map(remapIds),
  };
}
export function duplicateNode(
  scene: SlideScene,
  id: string,
): { scene: SlideScene; id: string } {
  const source = findNode(scene, id);
  if (!source) return { scene, id };
  const copy = remapIds(source);
  copy.added = true;
  copy.x += 24;
  copy.y += 24;
  copy.binding = undefined;
  copy.agendaItemId = undefined;
  const clearBindings = (node: SceneNode) => {
    delete node.binding;
    delete node.agendaItemId;
    node.children?.forEach(clearBindings);
  };
  clearBindings(copy);
  const walk = (nodes: SceneNode[]): SceneNode[] =>
    nodes.flatMap((node) =>
      node.id === id
        ? [node, copy]
        : [{ ...node, children: node.children && walk(node.children) }],
    );
  return { scene: { ...scene, nodes: walk(scene.nodes) }, id: copy.id };
}
export function reorderNode(
  scene: SlideScene,
  id: string,
  direction: -1 | 1,
): SlideScene {
  const walk = (nodes: SceneNode[]): SceneNode[] => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index >= 0) {
      const next = [...nodes];
      const destination = Math.max(
        0,
        Math.min(nodes.length - 1, index + direction),
      );
      [next[index], next[destination]] = [next[destination], next[index]];
      next[destination] = {
        ...next[destination],
        orderIndex: destination,
        overrides: [
          ...new Set([...(next[destination].overrides || []), "orderIndex"]),
        ],
      };
      return next;
    }
    return nodes.map((node) => ({
      ...node,
      children: node.children && walk(node.children),
    }));
  };
  return { ...scene, nodes: walk(scene.nodes) };
}
export function groupNodes(
  scene: SlideScene,
  ids: string[],
  bounds?: { x: number; y: number; width: number; height: number },
): SlideScene {
  const tops = ids.filter(
    (id) =>
      findNode(scene, id) &&
      !parentNodes(scene, id)?.some((parent) => ids.includes(parent.id)),
  );
  if (tops.length < 2) return scene;
  const parents = tops.map((id) => parentNodes(scene, id) || []);
  const siblings = parents.every(
    (chain) =>
      chain[chain.length - 1]?.id === parents[0][parents[0].length - 1]?.id,
  );
  if (!siblings) {
    const placements = tops.map((id, i) => {
      const node = findNode(scene, id)!;
      let x = node.x;
      let y = node.y;
      let scale = node.scale || 1;
      for (const parent of [...parents[i]].reverse()) {
        x = parent.x + x * (parent.scale || 1);
        y = parent.y + y * (parent.scale || 1);
        scale *= parent.scale || 1;
      }
      return { x, y, width: node.width * scale, height: node.height * scale };
    });
    const x = bounds?.x ?? Math.min(...placements.map((box) => box.x));
    const y = bounds?.y ?? Math.min(...placements.map((box) => box.y));
    const children = tops.map((id, i) => {
      let child = clone(findNode(scene, id)!);
      for (const parent of [...parents[i]].reverse())
        child = {
          ...clone(parent),
          id: newId(),
          name: "Posizione conservata",
          style: {
            transformOrigin: parent.style.transformOrigin,
            overflow: parent.style.overflow,
            filter: parent.style.filter,
          },
          children: [child],
        };
      return { ...child, x: child.x - x, y: child.y - y };
    });
    const group: SceneNode = {
      id: newId(),
      name: "Gruppo",
      kind: "group",
      added: true,
      x,
      y,
      width:
        bounds?.width ??
        Math.max(...placements.map((box) => box.x + box.width)) - x,
      height:
        bounds?.height ??
        Math.max(...placements.map((box) => box.y + box.height)) - y,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      style: {},
      children,
    };
    const next = removeNodes(scene, tops);
    return { ...next, nodes: [...next.nodes, group] };
  }
  const walk = (nodes: SceneNode[]): SceneNode[] => {
    const selected = nodes.filter((node) => ids.includes(node.id));
    if (selected.length >= 2) {
      const x = Math.min(...selected.map((node) => node.x));
      const y = Math.min(...selected.map((node) => node.y));
      const group: SceneNode = {
        id: newId(),
        name: "Gruppo",
        kind: "group",
        added: true,
        x,
        y,
        width: Math.max(...selected.map((node) => node.x + node.width)) - x,
        height: Math.max(...selected.map((node) => node.y + node.height)) - y,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        style: {},
        children: selected.map((node) => ({
          ...node,
          x: node.x - x,
          y: node.y - y,
        })),
      };
      const last = Math.max(
        ...nodes.map((node, i) => (ids.includes(node.id) ? i : -1)),
      );
      return nodes.flatMap((node, i) =>
        i === last ? [group] : ids.includes(node.id) ? [] : [node],
      );
    }
    return nodes.map((node) => ({
      ...node,
      children: node.children && walk(node.children),
    }));
  };
  return { ...scene, nodes: walk(scene.nodes) };
}
export function ungroupNode(scene: SlideScene, id: string): SlideScene {
  const node = findNode(scene, id);
  if (!node?.children) return scene;
  const transform = (item: SceneNode) => {
    const origin =
      item.scale && !item.baseTransform
        ? [0, 0]
        : item.style.transformOrigin
          ? String(item.style.transformOrigin)
              .split(" ")
              .map((value, i) =>
                value === "center"
                  ? (i ? item.height : item.width) / 2
                  : value.endsWith("%")
                    ? (parseFloat(value) / 100) * (i ? item.height : item.width)
                    : parseFloat(value),
              )
          : [item.width / 2, item.height / 2];
    const x = Number.isFinite(origin[0]) ? origin[0] : item.width / 2;
    const y = Number.isFinite(origin[1]) ? origin[1] : item.height / 2;
    return `translate(${x}px, ${y}px) ${item.baseTransform || ""} rotate(${item.rotation}deg) scale(${item.scale ?? 1}) translate(${-x}px, ${-y}px)`;
  };
  const parentTransform = transform(node);
  const released: SceneNode[] = node.children.map((child) => ({
    ...child,
    x: node.x,
    y: node.y,
    baseTransform: `${parentTransform} translate(${child.x}px, ${child.y}px) ${transform(child)}`,
    rotation: 0,
    scale: 1,
    opacity: child.opacity * node.opacity,
    visible: child.visible && node.visible,
    style: { ...child.style, transformOrigin: "0 0" },
    overrides: [
      ...new Set([
        ...(child.overrides || []),
        "x",
        "y",
        "baseTransform",
        "rotation",
        "scale",
        "opacity",
        "style",
      ]),
    ],
  }));
  if (
    (node.style.backgroundColor &&
      node.style.backgroundColor !== "rgba(0, 0, 0, 0)") ||
    (node.style.backgroundImage && node.style.backgroundImage !== "none") ||
    (node.style.boxShadow && node.style.boxShadow !== "none")
  ) {
    released.unshift({
      ...clone(node),
      id: newId(),
      kind: "shape",
      name: `${node.name} — sfondo`,
      children: undefined,
      added: true,
    });
  }
  const walk = (nodes: SceneNode[]): SceneNode[] =>
    nodes.flatMap((item) =>
      item.id === id
        ? released
        : [{ ...item, children: item.children && walk(item.children) }],
    );
  return { ...scene, nodes: walk(scene.nodes) };
}
export function adaptScene(
  scene: SlideScene,
  format: ProjectFormat,
): SlideScene {
  const target = FORMATS[format];
  if (scene.width === target.width && scene.height === target.height)
    return clone(scene);
  const scale = Math.min(
    target.width / scene.width,
    target.height / scene.height,
  );
  return {
    ...clone(scene),
    width: target.width,
    height: target.height,
    nodes: [
      {
        id: newId(),
        name: "Composizione adattata",
        kind: "group",
        x: (target.width - scene.width * scale) / 2,
        y: (target.height - scene.height * scale) / 2,
        width: scene.width,
        height: scene.height,
        rotation: 0,
        scale,
        opacity: 1,
        visible: true,
        locked: false,
        style: {},
        children: clone(scene.nodes),
      },
    ],
  };
}
export function resolveText(slide: Slide, node: SceneNode): string {
  if (!node.binding) return node.text || "";
  if (node.binding.startsWith("custom:"))
    return slide.customFields?.[node.binding.slice(7)] ?? node.text ?? "";
  if (node.binding.startsWith("item:")) {
    const [, id, field] = node.binding.split(":");
    const item =
      "items" in slide.content
        ? slide.content.items.find((item) => item.id === id)
        : undefined;
    return item
      ? field === "number"
        ? item.number.padStart(2, "0")
        : item.text
      : "";
  }
  const value = (slide.content as unknown as Record<string, unknown>)[
    node.binding
  ];
  return typeof value === "string" ? value : node.text || "";
}
export function editText(slide: Slide, node: SceneNode, text: string): Slide {
  if (node.binding?.startsWith("custom:"))
    return {
      ...slide,
      customFields: { ...slide.customFields, [node.binding.slice(7)]: text },
    };
  if (node.binding?.startsWith("item:") && "items" in slide.content) {
    const [, id, field] = node.binding.split(":");
    return {
      ...slide,
      content: {
        ...slide.content,
        items: slide.content.items.map((item) =>
          item.id === id ? { ...item, [field]: text } : item,
        ),
      },
    } as Slide;
  }
  if (node.binding)
    return {
      ...slide,
      content: { ...slide.content, [node.binding]: text },
    } as Slide;
  return { ...slide, scene: updateNode(slide.scene!, node.id, { text }) };
}
export function reconcileAgenda(slide: Slide): Slide {
  if (!slide.scene?.agendaPrototype || !("items" in slide.content))
    return slide;
  const scene = clone(slide.scene);
  const items = slide.content.items;
  const container = scene.agendaContainerId
    ? findNode(scene, scene.agendaContainerId)
    : allNodes(scene.nodes).find((node) =>
        node.children?.some((child) => child.agendaItemId),
      );
  if (!container?.children) return slide;
  container.children = container.children.filter(
    (node) =>
      !node.agendaItemId || items.some((item) => item.id === node.agendaItemId),
  );
  items.forEach((item, index) => {
    if (
      scene.deletedItemIds?.includes(item.id) ||
      container.children!.some((node) => node.agendaItemId === item.id)
    )
      return;
    const row = remapIds(scene.agendaPrototype!);
    const oldId = row.agendaItemId;
    row.agendaItemId = item.id;
    row.y = index * (row.height + (scene.agendaGap ?? 14));
    allNodes([row]).forEach((node) => {
      if (node.agendaContext === oldId) node.agendaContext = item.id;
      if (node.binding?.startsWith(`item:${oldId}:`))
        node.binding = node.binding.replace(
          `item:${oldId}:`,
          `item:${item.id}:`,
        );
    });
    container.children!.push(row);
  });
  let cursor = 0;
  items.forEach((item) => {
    const row = container.children!.find(
      (node) => node.agendaItemId === item.id,
    );
    if (!row) return;
    if (!row.overrides?.includes("y")) row.y = cursor;
    cursor += row.height + (scene.agendaGap ?? 14);
  });
  if (!container.overrides?.includes("height"))
    container.height = Math.max(
      0,
      ...container.children.map((node) => node.y + node.height),
    );
  return { ...slide, scene };
}
export function makeNode(kind: SceneNode["kind"]): SceneNode {
  return {
    id: newId(),
    name: kind === "text" ? "Nuovo testo" : "Nuovo elemento",
    kind,
    x: 100,
    y: 100,
    width: kind === "text" ? 500 : 250,
    height: kind === "text" ? 100 : 250,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: kind === "text" ? "Il tuo testo" : undefined,
    added: true,
    style:
      kind === "text"
        ? {
            fontFamily: "Inter",
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#ffffff",
            whiteSpace: "pre-wrap",
          }
        : { backgroundColor: "#dfff2f" },
  };
}
export function nodeKey(node: SceneNode) {
  return node.binding || node.media?.assetId || node.id;
}
export function transferScene(
  source: SlideScene,
  target: SlideScene,
): { scene: SlideScene; warnings: string[] } {
  const byKey = new Map(
    allNodes(target.nodes).map((node) => [nodeKey(node), node]),
  );
  let next = clone(target);
  const warnings: string[] = [];
  for (const node of allNodes(source.nodes)) {
    if (node.added || !node.overrides?.length) continue;
    const match = byKey.get(nodeKey(node));
    if (!match) {
      warnings.push(`«${node.name}»: modifica non trasferibile.`);
      continue;
    }
    const patch: Partial<SceneNode> = {};
    for (const key of node.overrides) {
      if (key.startsWith("style.")) {
        const property = key.slice(6);
        patch.style = {
          ...patch.style,
          [property]: (node.style as Record<string, unknown>)[property],
        };
      } else if (key !== "children" && key !== "id" && key !== "binding")
        (patch as Record<string, unknown>)[key] = (
          node as unknown as Record<string, unknown>
        )[key];
    }
    next = updateNode(next, match.id, patch);
    if (node.orderIndex !== undefined) {
      const parents = parentNodes(next, match.id) || [];
      const siblings = parents.length
        ? parents[parents.length - 1].children!
        : next.nodes;
      const current = siblings.findIndex((item) => item.id === match.id);
      const desired = Math.min(node.orderIndex, siblings.length - 1);
      for (let i = 0; i < Math.abs(desired - current); i++)
        next = reorderNode(next, match.id, desired > current ? 1 : -1);
    }
  }
  const removedIds = allNodes(next.nodes)
    .filter((node) => source.removedKeys?.includes(nodeKey(node)))
    .map((node) => node.id);
  next = removeNodes(next, removedIds);
  const groupedKeys: string[] = [];
  const grouped = (nodes: SceneNode[]) =>
    nodes.forEach((node) => {
      if (node.added && node.kind === "group")
        groupedKeys.push(
          ...allNodes(node.children || [])
            .filter((child) => !child.added)
            .map(nodeKey),
        );
      else grouped(node.children || []);
    });
  grouped(source.nodes);
  next = removeNodes(
    next,
    allNodes(next.nodes)
      .filter((node) => groupedKeys.includes(nodeKey(node)))
      .map((node) => node.id),
  );
  // Copy complete added subtrees once, not every descendant.
  const collectAdded = (
    nodes: SceneNode[],
    parents: SceneNode[] = [],
  ): SceneNode[] =>
    nodes.flatMap((node) => {
      if (!node.added)
        return collectAdded(node.children || [], [...parents, node]);
      let added = clone(node);
      for (const parent of [...parents].reverse())
        added = {
          ...clone(parent),
          id: newId(),
          name: "Posizione conservata",
          style: {
            transformOrigin: parent.style.transformOrigin,
            overflow: parent.style.overflow,
          },
          children: [added],
          added: true,
        };
      return [added];
    });
  next.nodes.push(...collectAdded(source.nodes));
  if (source.backgroundModified) {
    next.background = source.background;
    next.backgroundModified = true;
  }
  return { scene: next, warnings };
}
