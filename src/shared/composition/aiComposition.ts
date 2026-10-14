import type { Project, Slide } from "../types/template";
import { adaptScene, clone, reconcileAgenda } from "./scene";
import { prepareTheme, originalTheme } from "../../features/themes/model/themes";
import { captureLegacyScene } from "./captureLegacy";

export async function composeAiDraft(
  project: Project,
  draft: { title: string; slides: Slide[]; caption: string },
  preserve: boolean,
): Promise<{ project: Project; warnings: string[] }> {
  const ready = await prepareTheme(project.themeSnapshot || originalTheme());
  const instances = new Map<string, number>();
  const generateScene = async (slide: Slide) => {
    const index = instances.get(slide.templateType) || 0;
    instances.set(slide.templateType, index + 1);
    const layouts = ready.slides.filter(
      (item) => item.templateType === slide.templateType,
    );
    const layout = layouts[index] || layouts[0];
    const source = layout || slide;
    const scene = clone(await captureLegacyScene(source));
    const content = { ...slide.content, image: source.content.image };
    if ("items" in content && "items" in source.content) {
      const oldItems = source.content.items;
      content.items = content.items.map((item, i) => ({
        ...item,
        id: oldItems[i]?.id || `item-${crypto.randomUUID()}`,
      }));
    }
    return reconcileAgenda({
      ...slide,
      content,
      customFields: clone(source.customFields || {}),
      scene: adaptScene(scene, project.format || "portrait"),
    } as Slide);
  };
  let slides: Slide[];
  if (preserve) {
    const used = new Set<string>();
    slides = project.slides.map((old) => {
      const count = instances.get(old.templateType) || 0;
      instances.set(old.templateType, count + 1);
      const incoming = draft.slides.filter(
        (item) => item.templateType === old.templateType,
      )[count];
      if (!incoming) return old;
      used.add(incoming.id);
      const content = { ...incoming.content, image: old.content.image };
      if ("items" in content && "items" in old.content) {
        const oldItems = old.content.items;
        content.items = content.items.map((item, i) => ({
          ...item,
          id: oldItems[i]?.id || `item-${crypto.randomUUID()}`,
        }));
      }
      return reconcileAgenda({ ...old, content } as Slide);
    });
    slides.push(
      ...(await Promise.all(
        draft.slides.filter((item) => !used.has(item.id)).map(generateScene),
      )),
    );
  } else slides = await Promise.all(draft.slides.map(generateScene));
  return {
    project: { ...project, title: draft.title, caption: draft.caption, slides },
    warnings:
      preserve && slides.length !== draft.slides.length
        ? [
            "Le slide senza nuovi contenuti AI conservano il proprio contenuto e la propria grafica.",
          ]
        : [],
  };
}
