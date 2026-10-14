import { useRef, useState } from "react";
import type { Project, Slide } from "../../../shared/types/template";
import { captureSlideNodeToBlob } from "../services/export/exportEngine";

export function useSlideExport(project: Project, activeSlideIndex: number) {
  const offscreenContainerRef = useRef<HTMLDivElement>(null);
  const [offscreenSlide, setOffscreenSlide] = useState<Slide | null>(null);
  const renderSlideToBlob = async (index: number): Promise<Blob> => {
    if (
      !project.slides[index].scene &&
      project.slides[index].content.image?.missing
    )
      throw new Error(
        "Una fotografia non è disponibile. Sostituiscila prima di esportare.",
      );
    setOffscreenSlide(project.slides[index]);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const frame = offscreenContainerRef.current?.querySelector(
      '[data-template-frame="true"]',
    ) as HTMLElement | null;
    if (!frame) throw new Error("La slide non è pronta per l’esportazione.");
    if (frame.querySelector("[data-missing-media]"))
      throw new Error(
        "Una fotografia non è disponibile. Sostituiscila prima di esportare.",
      );
    await Promise.all(
      Array.from(frame.querySelectorAll("img")).map((img) => img.decode()),
    );
    return captureSlideNodeToBlob(frame);
  };

  const renderCurrentSlideToBlob = async (): Promise<Blob> => {
    try {
      return await renderSlideToBlob(activeSlideIndex);
    } finally {
      setOffscreenSlide(null);
    }
  };

  const renderAllSlidesToBlobs = async (): Promise<
    Array<{ index: number; blob: Blob }>
  > => {
    try {
      const blobs: Array<{ index: number; blob: Blob }> = [];
      for (let index = 0; index < project.slides.length; index++) {
        blobs.push({ index, blob: await renderSlideToBlob(index) });
      }
      return blobs;
    } finally {
      setOffscreenSlide(null);
    }
  };

  return { offscreenContainerRef, offscreenSlide, renderCurrentSlideToBlob, renderAllSlidesToBlobs };
}
