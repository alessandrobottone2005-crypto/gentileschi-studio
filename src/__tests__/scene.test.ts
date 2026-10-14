import { describe, expect, it } from "vitest";
import type { SceneNode, SlideScene } from "../shared/types/scene";
import {
  adaptScene,
  allNodes,
  duplicateNode,
  editText,
  groupNodes,
  makeNode,
  reconcileAgenda,
  removeNodes,
  resolveText,
  transferScene,
  ungroupNode,
  updateNode,
  reorderNode,
  visibleSlideText,
} from "../shared/composition/scene";
import {
  createDefaultSlide,
  createInitialProject,
} from "../shared/composition/defaultData";
import { serializeProject, projectImages } from "../features/media/services/mediaStore";

const text = (id = "title"): SceneNode => ({
  ...makeNode("text"),
  id,
  added: false,
  x: 40,
  y: 50,
  binding: "title",
});
const frame = (...nodes: SceneNode[]): SlideScene => ({
  version: 1,
  width: 1080,
  height: 1350,
  background: "#1728e8",
  nodes,
});
describe("graphic composition and compatibility", () => {
  it("preserves an explicitly edited background on theme transfer", () => {
    const source = {
      ...frame(text()),
      background: "#ff5500",
      backgroundModified: true,
    };
    expect(transferScene(source, frame(text())).scene.background).toBe(
      "#ff5500",
    );
  });
  it("preserves a compatible change to layer order", () => {
    const source = frame(text("a"), { ...text("b"), binding: "month" });
    const changed = reorderNode(source, "a", 1);
    const result = transferScene(changed, source);
    expect(result.scene.nodes.map((node) => node.id)).toEqual(["b", "a"]);
  });
  it("summarizes visible added text and omits hidden content for captions", () => {
    const slide = createDefaultSlide("cover");
    slide.scene = frame(
      { ...text(), visible: false },
      { ...makeNode("text"), text: "Testo aggiunto" },
      {
        ...makeNode("group"),
        visible: false,
        children: [{ ...makeNode("text"), text: "Nascosto" }],
      },
    );
    expect(visibleSlideText(slide)).toEqual(["Testo aggiunto"]);
  });
  it("reads and edits the same title as the existing quick form", () => {
    const slide = { ...createDefaultSlide("cover"), scene: frame(text()) };
    const next = editText(slide, text(), "Nuova assemblea");
    expect(resolveText(next, text())).toBe("Nuova assemblea");
    expect(next.content).toHaveProperty("title", "Nuova assemblea");
    expect(slide.content).not.toHaveProperty("title", "Nuova assemblea");
  });
  it("binds agenda text to stable item IDs instead of positions", () => {
    const slide = createDefaultSlide("agenda");
    const node = { ...text(), binding: "item:2:text" };
    const edited = editText(slide, node, "Un punto aggiornato");
    if ("items" in edited.content) edited.content.items.reverse();
    expect(resolveText(edited, node)).toBe("Un punto aggiornato");
  });
  it("does not share default photo objects between projects", () => {
    const first = createDefaultSlide("cover");
    first.content.image!.posX = 400;
    expect(createDefaultSlide("cover").content.image?.posX).toBe(0);
  });
  it("fits the original composition inside a square without distortion or clipping", () => {
    const scene = frame({ ...text(), x: 0, y: 0, width: 1080, height: 1350 });
    const square = adaptScene(scene, "square");
    expect(square.width).toBe(1080);
    expect(square.height).toBe(1080);
    expect(square.nodes[0]).toMatchObject({ x: 108, y: 0, scale: 0.8 });
    expect(square.nodes[0].children?.[0]).toMatchObject({
      width: 1080,
      height: 1350,
    });
    expect(scene.width).toBe(1080);
    expect(scene.height).toBe(1350);
  });
  it("centers a square in a story while extending the background", () => {
    const square = { ...frame(text()), height: 1080 };
    const story = adaptScene(square, "story");
    expect(story.nodes[0]).toMatchObject({ x: 0, y: 420, scale: 1 });
    expect(story.background).toBe(square.background);
  });
  it("groups siblings without changing their positions in the scene", () => {
    const a = text("a");
    const b = { ...text("b"), x: 220, y: 110 };
    const grouped = groupNodes(frame(a, b), ["a", "b"]);
    expect(grouped.nodes).toHaveLength(1);
    expect(grouped.nodes[0].x + grouped.nodes[0].children![1].x).toBe(b.x);
    const released = ungroupNode(grouped, grouped.nodes[0].id);
    expect(released.nodes).toHaveLength(2);
    expect(released.nodes[1].baseTransform).toContain("translate(180px, 60px)");
  });
  it("keeps parent transformations when separating a rotated group", () => {
    const group = {
      ...makeNode("group"),
      rotation: 30,
      scale: 2,
      children: [text()],
    };
    const scene = ungroupNode(frame(group), group.id);
    const child = scene.nodes.find((node) => node.id === "title")!;
    expect(child.baseTransform).toContain("rotate(30deg) scale(2)");
    expect(child.style.transformOrigin).toBe("0 0");
  });
  it("groups elements from different containers without duplicating their contents on theme transfer", () => {
    const a = {
      ...makeNode("group"),
      added: false,
      id: "container-a",
      x: 100,
      children: [text("a")],
    };
    const b = {
      ...makeNode("group"),
      added: false,
      id: "container-b",
      x: 400,
      children: [{ ...text("b"), binding: "month" }],
    };
    const source = frame(a, b);
    const grouped = groupNodes(source, ["a", "b"]);
    expect(
      allNodes(grouped.nodes).filter((node) => node.binding === "title"),
    ).toHaveLength(1);
    const transferred = transferScene(grouped, source);
    expect(
      allNodes(transferred.scene.nodes).filter(
        (node) => node.binding === "title",
      ),
    ).toHaveLength(1);
    expect(
      allNodes(transferred.scene.nodes).filter(
        (node) => node.binding === "month",
      ),
    ).toHaveLength(1);
  });
  it("duplicates with independent IDs and without content bindings", () => {
    const source = { ...makeNode("group"), children: [text()] };
    const { scene, id } = duplicateNode(frame(source), source.id);
    const duplicate = scene.nodes.find((node) => node.id === id)!;
    expect(duplicate.children?.[0].id).not.toBe("title");
    expect(duplicate.children?.[0].binding).toBeUndefined();
    expect(source.children[0].binding).toBe("title");
  });
  it("transfers only explicit overrides, leaving target layout defaults intact", () => {
    const original = frame(text());
    const updated = updateNode(original, "title", {
      x: 100,
      style: { color: "#ff5500" },
    });
    const target = frame({
      ...text("new-title"),
      y: 500,
      style: { fontSize: 90, color: "#ffffff" },
    });
    const result = transferScene(updated, target);
    expect(result.scene.nodes[0]).toMatchObject({ x: 100, y: 500 });
    expect(result.scene.nodes[0].style.color).toBe("#ff5500");
    expect(result.scene.nodes[0].style.fontSize).toBe(90);
    expect(result.warnings).toHaveLength(0);
  });
  it("reports incompatible overrides and preserves added elements", () => {
    const source = updateNode(
      frame(
        { ...text(), binding: "subtitle" },
        { ...makeNode("shape"), id: "addition" },
      ),
      "title",
      { x: 700 },
    );
    const result = transferScene(source, frame(text("target")));
    expect(result.warnings).toHaveLength(1);
    expect(result.scene.nodes.some((node) => node.id === "addition")).toBe(
      true,
    );
  });
  it("retains the ancestor transform of an added element", () => {
    const group = {
      ...makeNode("group"),
      added: false,
      x: 200,
      y: 300,
      scale: 0.8,
      children: [makeNode("text")],
    };
    const result = transferScene(frame(group), frame(text("target")));
    expect(result.scene.nodes[1]).toMatchObject({ x: 200, y: 300, scale: 0.8 });
    expect(result.scene.nodes[1].children).toHaveLength(1);
  });
  it("keeps removed bound elements removed on a compatible theme", () => {
    const removed = removeNodes(frame(text()), ["title"]);
    const result = transferScene(removed, frame(text("different-id")));
    expect(result.scene.nodes).toHaveLength(0);
  });
  it("does not recreate a deliberately deleted agenda row", () => {
    const slide = createDefaultSlide("agenda");
    const row = {
      ...makeNode("group"),
      id: "row",
      agendaItemId: "1",
      children: [{ ...text(), binding: "item:1:text" }],
    };
    const other = {
      ...row,
      id: "row-2",
      agendaItemId: "2",
      children: [{ ...text(), id: "text-2", binding: "item:2:text" }],
    };
    slide.scene = {
      ...frame({ ...makeNode("group"), children: [row, other] }),
      agendaPrototype: row,
    };
    slide.scene = removeNodes(slide.scene, ["row"]);
    const next = reconcileAgenda(slide);
    expect(
      allNodes(next.scene!.nodes).some((node) => node.agendaItemId === "1"),
    ).toBe(false);
    expect(
      allNodes(next.scene!.nodes).some((node) => node.agendaItemId === "3"),
    ).toBe(true);
  });
  it("strips temporary URLs from nested photos, prototypes and theme snapshots", () => {
    const project = createInitialProject("single");
    const photo = {
      ...makeNode("image"),
      media: {
        storagePath: "cloud:photo.png",
        url: "blob:temporary",
        originalUrl: "blob:original",
      },
    };
    project.slides[0].scene = frame({
      ...makeNode("group"),
      children: [photo],
    });
    project.slides[0].scene.agendaPrototype = photo;
    project.themeSnapshot = {
      id: "theme-x",
      name: "Snapshot",
      format: "portrait",
      official: false,
      slides: [project.slides[0]],
    };
    const stored = serializeProject(project);
    expect(
      projectImages(stored).every(
        ({ image }) => !image.url && !image.originalUrl,
      ),
    ).toBe(true);
    expect(JSON.stringify(stored)).not.toContain("blob:");
    expect(stored.slides[0].projectSettings?.themeSnapshot?.id).toBe("theme-x");
    expect(photo.media.url).toBe("blob:temporary");
  });
});
