import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createInitialProject } from "../src/engine/defaultData";
import { captureLegacyScene } from "../src/engine/captureLegacy";
import { renderLegacySlide } from "../src/templates/legacy";
import { SceneRenderer } from "../src/templates/SceneRenderer";
import { TemplateWrapper } from "../src/templates/TemplateWrapper";
import type { Slide } from "../src/types/template";
import "../src/design-system/tokens.css";
function Comparison() {
  const [slides, setSlides] = useState<Slide[]>([]);
  useEffect(() => {
    const project = createInitialProject();
    if (new URLSearchParams(location.search).has("zoom"))
      project.slides.forEach((slide) => {
        slide.content.image = {
          ...slide.content.image,
          scale: 1.6,
          posX: 75,
          posY: -45,
        };
      });
    void Promise.all(
      project.slides.map(async (slide) => ({
        ...slide,
        scene: await captureLegacyScene(slide),
      })),
    ).then(setSlides);
  }, []);
  return (
    <main
      data-ready={slides.length}
      style={{ display: "grid", gap: 20, padding: 20 }}
    >
      {slides.map((slide) => (
        <article key={slide.id} style={{ display: "flex", gap: 20 }}>
          <div data-testid={`legacy-${slide.templateType}`}>
            <TemplateWrapper scale={0.5}>
              {renderLegacySlide(slide)}
            </TemplateWrapper>
          </div>
          <div data-testid={`scene-${slide.templateType}`}>
            <TemplateWrapper scale={0.5}>
              <SceneRenderer slide={slide} />
            </TemplateWrapper>
          </div>
        </article>
      ))}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Comparison />);
