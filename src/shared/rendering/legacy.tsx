import React from "react";
import { Slide } from "../types/template";
import { TemplateCover } from "./TemplateCover";
import { TemplateAgenda } from "./TemplateAgenda";
import { TemplateNotice } from "./TemplateNotice";
export function renderLegacySlide(slide: Slide) {
  if (slide.templateType === "cover")
    return <TemplateCover content={slide.content as any} />;
  if (slide.templateType === "agenda")
    return <TemplateAgenda content={slide.content as any} />;
  return <TemplateNotice content={slide.content as any} />;
}
