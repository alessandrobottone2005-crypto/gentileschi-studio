import { describe, expect, it, vi } from "vitest";
import { composeAiDraft } from "../engine/aiComposition";
import { applyTheme } from "../engine/themes";
import {
  createDefaultSlide,
  createInitialProject,
} from "../engine/defaultData";
import { allNodes, clone, makeNode } from "../engine/scene";
import type { Slide } from "../types/template";
import type { GraphicTheme, SlideScene } from "../types/scene";

vi.mock("../engine/captureLegacy", () => ({
  captureLegacyScene: async (slide: Slide) =>
    slide.scene || {
      version: 1,
      width: 1080,
      height: 1350,
      background: "#1728e8",
      nodes: [],
    },
}));
const scene = (): SlideScene => ({
  version: 1,
  width: 1080,
  height: 1350,
  background: "#1728e8",
  nodes: [
    {
      ...makeNode("text"),
      id: "layout-title",
      added: false,
      binding: "title",
      x: 58,
    },
  ],
});
const draft = () => {
  const slide = createDefaultSlide("cover");
  slide.id = "generated";
  slide.content = {
    ...slide.content,
    title: "Titolo AI",
  } as typeof slide.content;
  return { title: "Progetto AI", caption: "Caption AI", slides: [slide] };
};
describe("AI application and theme replacement", () => {
  it("updates compatible contents without losing positions, photos or extra slides", async () => {
    const project = createInitialProject();
    project.slides[0].scene = scene();
    project.slides[0].scene.nodes[0].x = 700;
    project.slides[0].content.image = {
      storagePath: "cloud:custom.png",
      url: "blob:custom",
    };
    const result = await composeAiDraft(project, draft(), true);
    expect(result.project.slides).toHaveLength(3);
    expect(result.project.slides[0].scene?.nodes[0].x).toBe(700);
    expect(result.project.slides[0].content).toHaveProperty(
      "title",
      "Titolo AI",
    );
    expect(result.project.slides[0].content.image?.storagePath).toBe(
      "cloud:custom.png",
    );
    expect(result.warnings).toHaveLength(1);
    expect(project.title).not.toBe("Progetto AI");
  });
  it("regenerates using the saved theme snapshot even after its library entry disappears", async () => {
    const project = createInitialProject("single");
    const base = createDefaultSlide("cover");
    base.scene = scene();
    project.themeSnapshot = {
      id: "deleted-theme",
      name: "Tema salvato",
      format: "portrait",
      official: false,
      slides: [base],
    };
    project.slides[0].scene = clone(base.scene);
    project.slides[0].scene.nodes[0].x = 850;
    const result = await composeAiDraft(project, draft(), false);
    expect(result.project.slides[0].scene?.nodes[0].x).toBe(58);
    expect(result.project.slides[0].content).toHaveProperty(
      "title",
      "Titolo AI",
    );
  });
  it("retains stable agenda IDs when replacing their text from an AI response", async () => {
    const project = createInitialProject();
    const agenda = project.slides[1];
    if ("items" in agenda.content)
      agenda.content.items[0].id = "stable-local-id";
    const generated = createDefaultSlide("agenda");
    if ("items" in generated.content)
      generated.content.items[0] = {
        ...generated.content.items[0],
        id: "different-generated-id",
        text: "Punto AI",
      };
    const result = await composeAiDraft(
      project,
      { ...draft(), slides: [generated] },
      true,
    );
    expect(result.project.slides[1].content).toHaveProperty(
      "items.0.id",
      "stable-local-id",
    );
    expect(result.project.slides[1].content).toHaveProperty(
      "items.0.text",
      "Punto AI",
    );
  });
  it("preserves counts, order, text and photos on a fresh theme change", async () => {
    const project = createInitialProject();
    project.slides.push(createDefaultSlide("cover"));
    const template = createDefaultSlide("cover");
    template.scene = scene();
    const theme: GraphicTheme = {
      id: "theme-new",
      name: "Nuovo",
      format: "portrait",
      official: false,
      slides: [template],
    };
    const result = await applyTheme(project, theme, false);
    expect(result.project.slides.map((slide) => slide.id)).toEqual(
      project.slides.map((slide) => slide.id),
    );
    expect(result.project.slides[0].content).toEqual(project.slides[0].content);
    expect(result.project.slides[3].scene?.nodes[0].x).toBe(58);
    expect(result.warnings).toHaveLength(2);
    expect(result.project.themeSnapshot?.id).toBe("theme-new");
  });
  it("creates independent per-slide copies when using one layout repeatedly", async () => {
    const project = createInitialProject("single");
    project.slides.push(createDefaultSlide("cover"));
    const template = createDefaultSlide("cover");
    template.scene = scene();
    const theme: GraphicTheme = {
      id: "theme-repeat",
      name: "Ripetuto",
      format: "portrait",
      official: false,
      slides: [template],
    };
    const result = await applyTheme(project, theme, false);
    allNodes(result.project.slides[0].scene!.nodes)[0].x = 400;
    expect(result.project.slides[1].scene!.nodes[0].x).toBe(58);
    expect(theme.slides[0].scene!.nodes[0].x).toBe(58);
  });
});
