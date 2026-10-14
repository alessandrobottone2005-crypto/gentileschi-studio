import { useLayoutEffect, useRef, useState } from "react";
const MIN_PREVIEW_SCALE = 0.05;
const PREVIEW_BORDER = 4;
export function usePreviewScale(dimensions: { width: number; height: number }) {
  const previewStageRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);
  // Dynamic preview scale calculation
  // Adatta la slide allo spazio realmente disponibile sopra il badge.
  useLayoutEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;

    const computeScale = () => {
      const padding = getComputedStyle(stage);
      const availableWidth =
        stage.clientWidth -
        PREVIEW_BORDER -
        parseFloat(padding.paddingLeft) -
        parseFloat(padding.paddingRight);
      const availableHeight =
        stage.clientHeight -
        PREVIEW_BORDER -
        parseFloat(padding.paddingTop) -
        parseFloat(padding.paddingBottom);

      if (availableWidth <= 0 || availableHeight <= 0) return;

      const fitted = Math.min(
        availableWidth / dimensions.width,
        availableHeight / dimensions.height,
        1,
      );
      const next = Math.max(fitted, MIN_PREVIEW_SCALE);

      // Evita loop di rendering inutili: aggiorna solo se la scala è cambiata davvero
      setPreviewScale((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
    };

    computeScale();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(computeScale)
        : null;
    observer?.observe(stage);
    window.addEventListener("resize", computeScale);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", computeScale);
    };
  }, [dimensions.width, dimensions.height]);

  return { previewStageRef, previewScale };
}
