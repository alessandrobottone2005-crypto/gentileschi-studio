import React from "react";
import { SceneRenderer } from "./SceneRenderer";
import { FORMATS, ProjectFormat } from "../types/scene";
import { TemplateType, Slide } from "../types/template";
import { TemplateCover } from "./TemplateCover";
import { TemplateAgenda } from "./TemplateAgenda";
import { TemplateNotice } from "./TemplateNotice";
import { TEMPLATE_THUMBNAILS } from "../engine/defaultAssets";
import {
  validateCoverContent,
  validateAgendaContent,
  validateNoticeContent,
  LayoutWarning,
} from "../engine/adaptiveLayout";
import {
  DEFAULT_COVER_CONTENT,
  DEFAULT_AGENDA_CONTENT,
  DEFAULT_NOTICE_CONTENT,
} from "../engine/defaultData";

export interface TemplateDefinition<T extends TemplateType = TemplateType> {
  id: T;
  name: string;
  category: "cover" | "content" | "notice";
  description: string;
  thumbnailUrl: string;
  component: React.ComponentType<{ content: any }>;
  defaultContent: any;
  validate: (content: any) => LayoutWarning[];
}

export const TEMPLATE_REGISTRY: Record<
  TemplateType,
  TemplateDefinition<any>
> = {
  cover: {
    id: "cover",
    name: "Copertina Assemblea",
    category: "cover",
    description:
      "Slide principale con data grande, orario, titolo e statua/ritaglio fotografico.",
    thumbnailUrl: TEMPLATE_THUMBNAILS.cover,
    component: TemplateCover,
    defaultContent: DEFAULT_COVER_CONTENT,
    validate: validateCoverContent,
  },
  agenda: {
    id: "agenda",
    name: "Ordine del Giorno (O.D.G.)",
    category: "content",
    description:
      "Slide per l'elenco dei punti di discussione con badge numerati ed elemento in evidenza.",
    thumbnailUrl: TEMPLATE_THUMBNAILS.agenda,
    component: TemplateAgenda,
    defaultContent: DEFAULT_AGENDA_CONTENT,
    validate: (c) => validateAgendaContent(c.items || []),
  },
  notice: {
    id: "notice",
    name: "Avviso Importante / Regola",
    category: "notice",
    description:
      "Slide per comunicazioni istituzionali con cifra in evidenza, etichetta e sticker CTA.",
    thumbnailUrl: TEMPLATE_THUMBNAILS.notice,
    component: TemplateNotice,
    defaultContent: DEFAULT_NOTICE_CONTENT,
    validate: validateNoticeContent,
  },
};

export function renderSlideTemplate(
  slide: Slide,
  format: ProjectFormat = "portrait",
): React.ReactNode {
  if (slide.scene) return <SceneRenderer slide={slide} />;
  const definition = TEMPLATE_REGISTRY[slide.templateType];
  if (!definition) {
    return <div>Template non supportato: {slide.templateType}</div>;
  }
  const Component = definition.component;
  const { width, height } = FORMATS[format];
  const scale = Math.min(width / 1080, height / 1350);
  const background =
    slide.templateType === "notice"
      ? "#f4f0e6"
      : slide.templateType === "agenda"
        ? "#10108c"
        : "#1728e8";
  return (
    <div
      style={{
        width,
        height,
        background,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (width - 1080 * scale) / 2,
          top: (height - 1350 * scale) / 2,
          width: 1080,
          height: 1350,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <Component content={slide.content} />
      </div>
    </div>
  );
}
