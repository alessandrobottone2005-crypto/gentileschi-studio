import { createInitialProject } from "../../../shared/composition/defaultData";
import { adaptScene, clone, transferScene } from "../../../shared/composition/scene";
import { captureLegacyScene } from "../../../shared/composition/captureLegacy";
import type { Project } from "../../../shared/types/template";
import type { GraphicTheme, ProjectFormat } from "../../../shared/types/scene";
import importedThemes from '../../../assets/figma/themes.json';

export function officialThemes(): GraphicTheme[] {
  return [originalTheme(), ...clone(importedThemes as unknown as GraphicTheme[])];
}

export function originalTheme(): GraphicTheme {
  return {
    id: "gentileschi-original",
    name: "Gentileschi originale",
    official: true,
    format: "portrait",
    slides: createInitialProject().slides,
  };
}
// These are verified Figma section IDs. They are deliberately not fabricated layouts.
export const FIGMA_THEME_SOURCES = [
  2459, 2539, 2619, 2699, 2779, 2859, 2939, 3027, 3115, 3203, 3284, 3365,
].map((node, index) => ({
  id: `assemblea-${String(index + 1).padStart(2, "0")}`,
  nodeId: `53:${node}`,
}));
export async function prepareTheme(theme: GraphicTheme): Promise<GraphicTheme> {
  return {
    ...clone(theme),
    slides: await Promise.all(
      theme.slides.map(async (slide) => ({
        ...clone(slide),
        scene: await captureLegacyScene(slide),
      })),
    ),
  };
}
export async function projectFromTheme(
  theme: GraphicTheme,
  type: Project["type"],
  format: ProjectFormat,
): Promise<Project> {
  const ready = await prepareTheme(theme);
  const project = createInitialProject(type);
  const slides =
    type === "single"
      ? [
          ready.slides.find((slide) => slide.templateType === "cover") ||
            ready.slides[0],
        ]
      : ready.slides;
  return {
    ...project,
    format,
    themeRef: { id: theme.id, name: theme.name, revision: theme.revision },
    themeSnapshot: clone(ready),
    slides: slides.map((slide) => ({
      ...clone(slide),
      id: `slide-${crypto.randomUUID()}`,
      scene: adaptScene(slide.scene!, format),
    })),
  };
}
export async function applyTheme(
  project: Project,
  theme: GraphicTheme,
  preserve: boolean,
): Promise<{ project: Project; warnings: string[] }> {
  const ready = await prepareTheme(theme);
  const warnings: string[] = [];
  const occurrences = new Map<string, number>();
  const slides = await Promise.all(
    project.slides.map(async (slide) => {
      const index = occurrences.get(slide.templateType) || 0;
      occurrences.set(slide.templateType, index + 1);
      const matches = ready.slides.filter(
        (item) => item.templateType === slide.templateType,
      );
      const layout = matches[index] || matches[0];
      if (!layout) {
        warnings.push(
          `Slide «${slide.templateType}»: composizione conservata, nessun layout compatibile.`,
        );
        return slide;
      }
      const base = adaptScene(layout.scene!, project.format || "portrait");
      if (!preserve)
        return {
          ...slide,
          scene: clone(base),
          customFields: { ...layout.customFields, ...slide.customFields },
        };
      const old = await captureLegacyScene(slide);
      const transferred = transferScene(old, base);
      warnings.push(...transferred.warnings);
      return {
        ...slide,
        scene: transferred.scene,
        customFields: { ...layout.customFields, ...slide.customFields },
      };
    }),
  );
  return {
    project: {
      ...project,
      slides,
      themeRef: { id: theme.id, name: theme.name, revision: theme.revision },
      themeSnapshot: clone(ready),
    },
    warnings,
  };
}
export async function changeProjectFormat(
  project: Project,
  format: ProjectFormat,
): Promise<Project> {
  return {
    ...project,
    format,
    slides: await Promise.all(
      project.slides.map(async (slide) => ({
        ...slide,
        scene: adaptScene(await captureLegacyScene(slide), format),
      })),
    ),
  };
}
