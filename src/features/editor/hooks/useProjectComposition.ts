import { useCallback, useState } from "react";
import type { Project, Slide } from "../../../shared/types/template";
import type { GraphicTheme, ProjectFormat } from "../../../shared/types/scene";
import { applyTheme, changeProjectFormat, originalTheme } from "../../themes/model/themes";
import { composeAiDraft } from "../../../shared/composition/aiComposition";

export function useProjectComposition(project: Project, setProject: (project: Project) => void, setActionError: (message: string) => void) {
  const [pendingAi, setPendingAi] = useState<{
    title: string;
    slides: Slide[];
    caption: string;
  } | null>(null);
  const [formatBusy, setFormatBusy] = useState(false);
  const changeFormat = async (format: ProjectFormat) => {
    if (format === (project.format || "portrait")) return;
    setFormatBusy(true);
    setActionError("");
    try {
      setProject(await changeProjectFormat(project, format));
    } catch (cause) {
      setActionError((cause as Error).message);
    } finally {
      setFormatBusy(false);
    }
  };
  const buildThemeReview = useCallback(
    (preserve: boolean, theme?: GraphicTheme) =>
      applyTheme(project, theme || originalTheme(), preserve),
    [project],
  );
  const buildAiReview = useCallback(
    async (preserve: boolean) => {
      if (!pendingAi) return { project, warnings: [] };
      return composeAiDraft(project, pendingAi, preserve);
    },
    [project, pendingAi],
  );

  return { pendingAi, setPendingAi, formatBusy, changeFormat, buildThemeReview, buildAiReview };
}
