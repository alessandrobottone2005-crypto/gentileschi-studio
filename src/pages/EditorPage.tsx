import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { Project, Slide } from "../types/template";
import {
  getProjects,
  ProjectConflictError,
  saveProject,
} from "../services/supabase/projectService";
import { FormCover } from "../editor/FormCover";
import { FormAgenda } from "../editor/FormAgenda";
import { FormNotice } from "../editor/FormNotice";
import { TemplateWrapper } from "../templates/TemplateWrapper";
import { renderSlideTemplate } from "../templates/registry";
import { SlideNavigator } from "../editor/SlideNavigator";
import { ExportModal } from "../editor/ExportModal";
import { CaptionModal } from "../editor/CaptionModal";
import { AiGeneratorModal } from "../editor/AiGeneratorModal";
import { captureSlideNodeToBlob } from "../services/export/exportEngine";
import {
  ArrowLeft,
  Download,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { FORMATS, GraphicTheme, ProjectFormat } from "../types/scene";
import { ProjectReviewDialog } from "../editor/ProjectReviewDialog";
import { SaveThemeDialog } from "../editor/SaveThemeDialog";
import { useProjectHistory } from "../editor/useProjectHistory";
import { captureLegacyScene } from "../engine/captureLegacy";
import {
  adaptScene,
  clone,
  findNode,
  parentNodes,
  reconcileAgenda,
  removeNodes,
  updateNode,
} from "../engine/scene";
import {
  applyTheme,
  changeProjectFormat,
  originalTheme,
} from "../engine/themes";
import { composeAiDraft } from "../engine/aiComposition";
import "../design-system/graphics.css";
import "../design-system/workspace.css";
import { StudioWorkspace } from "../editor/StudioWorkspace";

interface EditorPageProps {
  initialProject: Project;
  onBackToDashboard: () => void;
  onSignOut?: () => Promise<void>;
}

// Rapporto minimo di scala (evita divisioni per zero / anteprima invisibile)
const MIN_PREVIEW_SCALE = 0.05;
const PREVIEW_BORDER = 4;

export const EditorPage: React.FC<EditorPageProps> = ({
  initialProject,
  onBackToDashboard,
  onSignOut,
}) => {
  const { project, setProject, undo, redo, reset, canUndo, canRedo } =
    useProjectHistory(initialProject);
  const editingTab = "graphics";
  const [showThemes, setShowThemes] = useState(false);
  const [reviewTheme, setReviewTheme] = useState<GraphicTheme>();
  const [showSaveTheme, setShowSaveTheme] = useState(false);
  const [pendingAi, setPendingAi] = useState<{
    title: string;
    slides: Slide[];
    caption: string;
  } | null>(null);
  const [preparedSlide, setPreparedSlide] = useState<Slide | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [guides, setGuides] = useState(true);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [actionError, setActionError] = useState("");
  const [formatBusy, setFormatBusy] = useState(false);
  const dimensions = FORMATS[project.format || "portrait"];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | "conflict"
  >("saved");
  const [saveError, setSaveError] = useState("");
  const [retrySaveTick, setRetrySaveTick] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  const revisionRef = useRef(initialProject.revision);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const editSequenceRef = useRef(0);
  const lastObservedRef = useRef({ project: initialProject, retrySaveTick: 0 });
  const previewStageRef = useRef<HTMLDivElement>(null);
  const offscreenContainerRef = useRef<HTMLDivElement>(null);
  const [offscreenSlide, setOffscreenSlide] = useState<Slide | null>(null);

  // Auto-save debounce
  useEffect(() => {
    if (
      lastObservedRef.current.project === project &&
      lastObservedRef.current.retrySaveTick === retrySaveTick
    )
      return;
    lastObservedRef.current = { project, retrySaveTick };
    const sequence = ++editSequenceRef.current;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const saved = await saveProject({
            ...project,
            revision: revisionRef.current,
          });
          revisionRef.current = saved.revision;
          if (sequence === editSequenceRef.current) {
            setSaveError("");
            setSaveStatus("saved");
          }
        } catch (error) {
          if (sequence === editSequenceRef.current) {
            setSaveError(
              error instanceof Error
                ? error.message
                : "Salvataggio non riuscito.",
            );
            setSaveStatus(
              error instanceof ProjectConflictError ? "conflict" : "error",
            );
          }
        }
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [project, retrySaveTick]);

  const leaveEditor = async (onLeave: () => void) => {
    if (saveStatus === "error" || saveStatus === "conflict") return;
    if (saveStatus === "saving") {
      await saveQueueRef.current;
      try {
        const saved = await saveProject({
          ...project,
          revision: revisionRef.current,
        });
        revisionRef.current = saved.revision;
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Salvataggio non riuscito.",
        );
        setSaveStatus(
          error instanceof ProjectConflictError ? "conflict" : "error",
        );
        return;
      }
    }
    onLeave();
  };

  const handleBack = () => leaveEditor(onBackToDashboard);
  const handleSignOut = () => {
    if (onSignOut)
      void leaveEditor(() => {
        void onSignOut().catch(() => {
          setSaveError("Uscita non riuscita. Riprova.");
        });
      });
  };

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== "saved") event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveStatus]);

  const reloadProject = async () => {
    try {
      const latest = (await getProjects()).find(
        (item) => item.id === project.id,
      );
      if (!latest) throw new Error("Progetto non trovato.");
      revisionRef.current = latest.revision;
      setActiveSlideIndex((index) => Math.min(index, latest.slides.length - 1));
      lastObservedRef.current = { project: latest, retrySaveTick };
      reset(latest);
      setSaveError("");
      setSaveStatus("saved");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Ricarica non riuscita.",
      );
    }
  };

  const saveAsCopy = async () => {
    try {
      await saveProject({
        ...project,
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: `${project.title} (Copia)`,
        revision: undefined,
        createdAt: new Date().toISOString(),
      });
      onBackToDashboard();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Copia non salvata.",
      );
    }
  };

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

  const currentSlide = project.slides[activeSlideIndex] || project.slides[0];

  useEffect(() => {
    let active = true;
    setPreparedSlide(null);
    if (editingTab !== "graphics") return;
    void captureLegacyScene(currentSlide)
      .then((scene) => {
        if (active)
          setPreparedSlide({
            ...currentSlide,
            scene: adaptScene(scene, project.format || "portrait"),
          });
      })
      .catch((cause) => {
        if (active) setActionError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [currentSlide, editingTab, project.format]);
  useEffect(() => {
    setSelected([]);
  }, [currentSlide.id]);
  useEffect(() => {
    if (activeSlideIndex >= project.slides.length)
      setActiveSlideIndex(project.slides.length - 1);
  }, [project.slides.length, activeSlideIndex]);
  const graphicSlide = currentSlide.scene ? currentSlide : preparedSlide;
  const selectNode = (id: string, additive: boolean) =>
    setSelected((old) =>
      !id
        ? []
        : additive
          ? old.includes(id)
            ? old.filter((value) => value !== id)
            : [...old, id]
          : [id],
    );
  const commitSlide = (change: Slide | ((current: Slide) => Slide)) => {
    const id = typeof change === "function" ? currentSlide.id : change.id;
    setProject((old) => ({
      ...old,
      slides: old.slides.map((item) =>
        item.id === id
          ? reconcileAgenda(
              typeof change === "function"
                ? change({ ...item, scene: item.scene || preparedSlide?.scene })
                : change,
            )
          : item,
      ),
    }));
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).closest(
          'input,textarea,select,[contenteditable="true"]',
        ) ||
        document.querySelector('[aria-modal="true"]')
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (editingTab !== "graphics" || !graphicSlide?.scene || !selected.length)
        return;
      if (event.key === "Escape") {
        setSelected([]);
        return;
      }
      const scene = graphicSlide.scene;
      const ids = selected.filter(
        (id) =>
          !findNode(scene, id)?.locked &&
          !parentNodes(scene, id)?.some((parent) => parent.locked),
      );
      if (!ids.length) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        commitSlide({ ...graphicSlide, scene: removeNodes(scene, ids) });
        setSelected([]);
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        let next = scene;
        const step = event.shiftKey ? 10 : 1;
        ids
          .filter(
            (id) =>
              !parentNodes(scene, id)?.some((parent) =>
                ids.includes(parent.id),
              ),
          )
          .forEach((id) => {
            const node = findNode(scene, id)!;
            next = updateNode(next, id, {
              x:
                node.x +
                (event.key === "ArrowLeft"
                  ? -step
                  : event.key === "ArrowRight"
                    ? step
                    : 0),
              y:
                node.y +
                (event.key === "ArrowUp"
                  ? -step
                  : event.key === "ArrowDown"
                    ? step
                    : 0),
            });
          });
        commitSlide({ ...graphicSlide, scene: next });
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [editingTab, graphicSlide, selected, undo, redo]);
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

  const handleUpdateCurrentSlideContent = (newContent: any) => {
    const copy = [...project.slides];
    copy[activeSlideIndex] = reconcileAgenda({
      ...copy[activeSlideIndex],
      content: newContent,
    });
    setProject({ ...project, slides: copy });
  };

  const handleAddSlide = async (newSlide: Slide) => {
    try {
      const source =
        project.themeSnapshot?.slides.find(
          (slide) => slide.templateType === newSlide.templateType,
        ) || newSlide;
      const prepared = reconcileAgenda({
        ...newSlide,
        content: { ...newSlide.content, image: source.content.image },
        customFields: clone(source.customFields || {}),
        scene: adaptScene(
          await captureLegacyScene(source),
          project.format || "portrait",
        ),
      } as Slide);
      setProject((old) => ({ ...old, slides: [...old.slides, prepared] }));
      setActiveSlideIndex(project.slides.length);
    } catch (cause) {
      setActionError((cause as Error).message);
    }
  };

  const handleDuplicateSlide = (index: number) => {
    const target = project.slides[index];
    const clone: Slide = {
      ...JSON.parse(JSON.stringify(target)),
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const next = [...project.slides];
    next.splice(index + 1, 0, clone);
    setProject({ ...project, slides: next });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (project.slides.length <= 1) return;
    const next = project.slides.filter((_, i) => i !== index);
    setProject({ ...project, slides: next });
    if (activeSlideIndex >= next.length) {
      setActiveSlideIndex(next.length - 1);
    }
  };

  const handleReorderSlide = (index: number, direction: "prev" | "next") => {
    const targetIdx = direction === "prev" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.slides.length) return;

    const next = [...project.slides];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    setProject({ ...project, slides: next });
    setActiveSlideIndex(targetIdx);
  };

  const handleApplyAiGenerated = (
    title: string,
    slides: Slide[],
    caption: string,
  ) => setPendingAi({ title, slides, caption });

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

  return (
    <div
      className="canva-editor"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#0b0e2b",
        overflow: "hidden",
      }}
    >
      {/* Header Bar */}
      <header
        className="editor-header"
        style={{
          height: 60,
          backgroundColor: "#10143d",
          borderBottom: "1px solid #232a68",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div
          className="editor-header-main"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            aria-label="Torna alla dashboard"
            style={{
              background: "none",
              border: "none",
              color: "#8c95c8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />{" "}
            <span className="dashboard-label">Dashboard</span>
          </button>

          <div style={{ height: 24, width: 1, backgroundColor: "#232a68" }} />

          <input
            className="editor-project-title"
            type="text"
            aria-label="Titolo progetto"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: 4,
              outline: "none",
              width: 260,
            }}
            onFocus={(e) => (e.target.style.backgroundColor = "#141842")}
            onBlur={(e) => (e.target.style.backgroundColor = "transparent")}
          />

          <div
            className="save-indicator"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color:
                saveStatus === "saved"
                  ? "#20bf6b"
                  : saveStatus === "saving"
                    ? "#f5cd79"
                    : "#ff8e8e",
            }}
          >
            {saveStatus === "saved" ? (
              <CheckCircle2 size={14} />
            ) : (
              <RefreshCw
                size={14}
                className={saveStatus === "saving" ? "animate-spin" : ""}
              />
            )}
            <span>
              {saveStatus === "saved"
                ? "Salvato"
                : saveStatus === "saving"
                  ? "Salvataggio..."
                  : "Non salvato"}
            </span>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={handleSignOut}
              className="editor-signout"
              aria-label="Esci dall’account"
            >
              Esci
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className="editor-header-actions"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              backgroundColor: "#141842",
              color: "#dfff2f",
              border: "1px solid #dfff2f",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Sparkles size={15} /> Assistente AI
          </button>

          <button
            type="button"
            onClick={() => setShowCaptionModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              backgroundColor: "#141842",
              color: "#ffffff",
              border: "1px solid #304bff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <MessageSquare size={15} /> Caption
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              backgroundColor: "#1728e8",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(23, 40, 232, 0.4)",
            }}
          >
            <Download size={15} /> Esporta
          </button>
        </div>
      </header>

      {(saveStatus === "error" || saveStatus === "conflict") && (
        <div role="alert" className="save-banner">
          <span>{saveError}</span>
          {saveStatus === "conflict" ? (
            <>
              <button type="button" onClick={reloadProject}>
                Ricarica
              </button>
              <button type="button" onClick={saveAsCopy}>
                Salva copia
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRetrySaveTick((count) => count + 1)}
            >
              Riprova
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div role="alert" className="save-banner">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError("")}>
            Chiudi
          </button>
        </div>
      )}
      <div className="graphic-project-toolbar">
        <button
          type="button"
          onClick={() => {
            setReviewTheme(undefined);
            setShowThemes(true);
          }}
        >
          Cambia tema
        </button>
        <button type="button" onClick={() => setShowSaveTheme(true)}>
          Salva come tema
        </button>
        <label>
          Formato
          <select
            aria-label="Formato progetto"
            value={project.format || "portrait"}
            disabled={formatBusy}
            onChange={(event) =>
              void changeFormat(event.target.value as ProjectFormat)
            }
          >
            {Object.entries(FORMATS).map(([key, size]) => (
              <option value={key} key={key}>
                {size.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Annulla ultima modifica"
        >
          ↶ Annulla
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Ripristina ultima modifica"
        >
          ↷ Ripristina
        </button>
        <span>{project.themeRef?.name || "Gentileschi originale"}</span>
      </div>
      <StudioWorkspace
        slide={graphicSlide || null}
        selected={selected}
        onSelect={selectNode}
        onChange={commitSlide}
        format={project.format || "portrait"}
        themeId={project.themeRef?.id}
        onTheme={(theme) => {
          setReviewTheme(theme);
          setShowThemes(true);
        }}
        fitScale={previewScale}
        stageRef={previewStageRef}
        aspectLocked={aspectLocked}
        onAspectLocked={setAspectLocked}
        guides={guides}
        onGuides={setGuides}
        data={
          <>
            {currentSlide.templateType === "cover" && (
              <FormCover
                content={currentSlide.content as any}
                onChange={handleUpdateCurrentSlideContent}
              />
            )}

            {currentSlide.templateType === "agenda" && (
              <FormAgenda
                content={currentSlide.content as any}
                onChange={handleUpdateCurrentSlideContent}
              />
            )}

            {currentSlide.templateType === "notice" && (
              <FormNotice
                content={currentSlide.content as any}
                onChange={handleUpdateCurrentSlideContent}
              />
            )}
            {Object.entries(currentSlide.customFields || {}).map(
              ([key, value]) => (
                <label className="graphic-custom-field" key={key}>
                  {(currentSlide.scene &&
                    findNode(currentSlide.scene, key)?.name) ||
                    "Campo personalizzato"}
                  <textarea
                    value={value}
                    onChange={(event) =>
                      commitSlide({
                        ...currentSlide,
                        customFields: {
                          ...currentSlide.customFields,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </label>
              ),
            )}
          </>
        }
      />

      {/* Bottom Bar: Slide Carousel Navigator */}
      <SlideNavigator
        format={project.format || "portrait"}
        slides={project.slides}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={setActiveSlideIndex}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={handleDuplicateSlide}
        onDeleteSlide={handleDeleteSlide}
        onReorderSlide={handleReorderSlide}
      />

      {/* Offscreen Container for Batch High-Res ZIP Export */}
      <div
        ref={offscreenContainerRef}
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: dimensions.width,
          height: dimensions.height,
          pointerEvents: "none",
        }}
      >
        {offscreenSlide && (
          <TemplateWrapper
            scale={1}
            width={dimensions.width}
            height={dimensions.height}
          >
            {renderSlideTemplate(offscreenSlide, project.format)}
          </TemplateWrapper>
        )}
      </div>

      {showThemes && (
        <ProjectReviewDialog
          title="Cambia tema"
          initialTheme={reviewTheme}
          choices={[
            "Nuova composizione, stessi testi e foto",
            "Trasferisci anche le personalizzazioni compatibili",
          ]}
          withThemes
          build={buildThemeReview}
          onClose={() => setShowThemes(false)}
          onApply={(next) => {
            setProject(next);
            setShowThemes(false);
            setSelected([]);
          }}
        />
      )}
      {showSaveTheme && (
        <SaveThemeDialog
          project={project}
          onClose={() => setShowSaveTheme(false)}
          onSaved={(theme) => {
            setShowSaveTheme(false);
            setProject({
              ...project,
              themeRef: {
                id: theme.id,
                name: theme.name,
                revision: theme.revision,
              },
              themeSnapshot: clone(theme),
            });
          }}
        />
      )}
      {pendingAi && (
        <ProjectReviewDialog
          title="Applica contenuti AI"
          choices={[
            "Ricrea le slide con il tema corrente",
            "Aggiorna i contenuti e mantieni la grafica",
          ]}
          build={buildAiReview}
          onClose={() => setPendingAi(null)}
          onApply={(next) => {
            setProject(next);
            setActiveSlideIndex(0);
            setPendingAi(null);
            setSelected([]);
          }}
        />
      )}
      {/* Modals */}
      {showExportModal && (
        <ExportModal
          project={project}
          activeSlideIndex={activeSlideIndex}
          renderCurrentSlideToBlob={renderCurrentSlideToBlob}
          renderAllSlidesToBlobs={renderAllSlidesToBlobs}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showCaptionModal && (
        <CaptionModal
          project={project}
          onUpdateCaption={(cap) => setProject({ ...project, caption: cap })}
          onClose={() => setShowCaptionModal(false)}
        />
      )}

      {showAiModal && (
        <AiGeneratorModal
          onApplyGenerated={handleApplyAiGenerated}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
};
