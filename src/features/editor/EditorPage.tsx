import { useProjectComposition } from "./hooks/useProjectComposition";
import { EditorHeader } from "./components/EditorHeader";
import { useProjectPersistence } from "./hooks/useProjectPersistence";
import { useSlideExport } from "./hooks/useSlideExport";
import { usePreviewScale } from "./hooks/usePreviewScale";
import React, {
  useState,
  useEffect,
} from "react";
import { Project, Slide } from "../../shared/types/template";
import { FormCover } from "./components/FormCover";
import { FormAgenda } from "./components/FormAgenda";
import { FormNotice } from "./components/FormNotice";
import { TemplateWrapper } from "../../shared/rendering/TemplateWrapper";
import { renderSlideTemplate } from "../../shared/rendering/registry";
import { SlideNavigator } from "./components/SlideNavigator";
import { ExportModal } from "./components/ExportModal";
import { CaptionModal } from "./components/CaptionModal";
import { AiGeneratorModal } from "./components/AiGeneratorModal";


import { FORMATS, GraphicTheme, ProjectFormat } from "../../shared/types/scene";
import { ProjectReviewDialog } from "./components/ProjectReviewDialog";
import { SaveThemeDialog } from "../themes/SaveThemeDialog";
import { useProjectHistory } from "./hooks/useProjectHistory";
import { captureLegacyScene } from "../../shared/composition/captureLegacy";
import {
  adaptScene,
  clone,
  findNode,
  parentNodes,
  reconcileAgenda,
  removeNodes,
  updateNode,
} from "../../shared/composition/scene";
import "../../shared/styles/graphics.css";
import "../../shared/styles/workspace.css";
import { StudioWorkspace } from "./components/StudioWorkspace";

interface EditorPageProps {
  initialProject: Project;
  onBackToDashboard: () => void;
  onSignOut?: () => Promise<void>;
}


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
  const [preparedSlide, setPreparedSlide] = useState<Slide | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [guides, setGuides] = useState(true);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [actionError, setActionError] = useState("");
  const { pendingAi, setPendingAi, formatBusy, changeFormat, buildThemeReview, buildAiReview } = useProjectComposition(project, setProject, setActionError);
  const dimensions = FORMATS[project.format || "portrait"];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const { saveStatus, saveError, retrySave, reloadProject, saveAsCopy, flush } =
    useProjectPersistence(project, reset);
  const { previewStageRef, previewScale } = usePreviewScale(dimensions);
  const { offscreenContainerRef, offscreenSlide, renderCurrentSlideToBlob, renderAllSlidesToBlobs } =
    useSlideExport(project, activeSlideIndex);
  const handleBack = async () => { if (await flush()) onBackToDashboard(); };
  const handleSignOut = async () => {
    if (!onSignOut || !(await flush())) return;
    try { await onSignOut(); }
    catch { setActionError("Uscita non riuscita. Riprova."); }
  };

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


  return (
    <div
      className="canva-editor"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--ui-canvas)",
        overflow: "hidden",
      }}
    >
      <EditorHeader title={project.title}
        onTitle={(title) => setProject({ ...project, title })}
        onBack={() => void handleBack()}
        onSignOut={onSignOut ? () => void handleSignOut() : undefined}
        saveStatus={saveStatus}
        onAi={() => setShowAiModal(true)}
        onCaption={() => setShowCaptionModal(true)}
        onExport={() => setShowExportModal(true)}
      />

      {(saveStatus === "error" || saveStatus === "conflict") && (
        <div role="alert" className="save-banner">
          <span>{saveError}</span>
          {saveStatus === "conflict" ? (
            <>
              <button type="button" onClick={reloadProject}>
                Ricarica
              </button>
              <button type="button" onClick={() => void saveAsCopy(onBackToDashboard)}>
                Salva copia
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={retrySave}
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
