import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Project, Slide, TemplateType } from '../types/template';
import { getProjects, ProjectConflictError, saveProject } from '../services/supabase/projectService';
import { FormCover } from '../editor/FormCover';
import { FormAgenda } from '../editor/FormAgenda';
import { FormNotice } from '../editor/FormNotice';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { renderSlideTemplate } from '../templates/registry';
import { SlideNavigator } from '../editor/SlideNavigator';
import { ExportModal } from '../editor/ExportModal';
import { CaptionModal } from '../editor/CaptionModal';
import { AiGeneratorModal } from '../editor/AiGeneratorModal';
import { captureSlideNodeToBlob } from '../services/export/exportEngine';
import {
  ArrowLeft,
  Download,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';

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
  const [project, setProject] = useState<Project>(initialProject);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'conflict'>('saved');
  const [saveError, setSaveError] = useState('');
  const [retrySaveTick, setRetrySaveTick] = useState(0);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
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
    if (lastObservedRef.current.project === project && lastObservedRef.current.retrySaveTick === retrySaveTick) return;
    lastObservedRef.current = { project, retrySaveTick };
    const sequence = ++editSequenceRef.current;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const saved = await saveProject({ ...project, revision: revisionRef.current });
          revisionRef.current = saved.revision;
          if (sequence === editSequenceRef.current) {
            setSaveError('');
            setSaveStatus('saved');
          }
        } catch (error) {
          if (sequence === editSequenceRef.current) {
            setSaveError(error instanceof Error ? error.message : 'Salvataggio non riuscito.');
            setSaveStatus(error instanceof ProjectConflictError ? 'conflict' : 'error');
          }
        }
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [project, retrySaveTick]);

  const leaveEditor = async (onLeave: () => void) => {
    if (saveStatus === 'error' || saveStatus === 'conflict') return;
    if (saveStatus === 'saving') {
      await saveQueueRef.current;
      try {
        const saved = await saveProject({ ...project, revision: revisionRef.current });
        revisionRef.current = saved.revision;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Salvataggio non riuscito.');
        setSaveStatus(error instanceof ProjectConflictError ? 'conflict' : 'error');
        return;
      }
    }
    onLeave();
  };

  const handleBack = () => leaveEditor(onBackToDashboard);
  const handleSignOut = () => {
    if (onSignOut) void leaveEditor(() => {
      void onSignOut().catch(() => { setSaveError('Uscita non riuscita. Riprova.'); });
    });
  };

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [saveStatus]);

  const reloadProject = async () => {
    try {
      const latest = (await getProjects()).find((item) => item.id === project.id);
      if (!latest) throw new Error('Progetto non trovato.');
      revisionRef.current = latest.revision;
      setActiveSlideIndex((index) => Math.min(index, latest.slides.length - 1));
      lastObservedRef.current = { project: latest, retrySaveTick };
      setProject(latest);
      setSaveError('');
      setSaveStatus('saved');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Ricarica non riuscita.');
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
      setSaveError(error instanceof Error ? error.message : 'Copia non salvata.');
    }
  };

  // Dynamic preview scale calculation
  // Adatta la slide allo spazio realmente disponibile sopra il badge.
  useLayoutEffect(() => {
    const stage = previewStageRef.current;
    if (!stage) return;

    const computeScale = () => {
      const availableWidth = stage.clientWidth - PREVIEW_BORDER;
      const availableHeight = stage.clientHeight - PREVIEW_BORDER;

      if (availableWidth <= 0 || availableHeight <= 0) return;

      const fitted = Math.min(availableWidth / 1080, availableHeight / 1350, 1);
      const next = Math.max(fitted, MIN_PREVIEW_SCALE);

      // Evita loop di rendering inutili: aggiorna solo se la scala è cambiata davvero
      setPreviewScale((prev) => (Math.abs(prev - next) > 0.002 ? next : prev));
    };

    computeScale();

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(computeScale) : null;
    observer?.observe(stage);
    window.addEventListener('resize', computeScale);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', computeScale);
    };
  }, [mobileTab]);

  const currentSlide = project.slides[activeSlideIndex] || project.slides[0];

  const handleUpdateCurrentSlideContent = (newContent: any) => {
    const copy = [...project.slides];
    copy[activeSlideIndex] = {
      ...copy[activeSlideIndex],
      content: newContent,
    };
    setProject({ ...project, slides: copy });
  };

  const handleAddSlide = (newSlide: Slide) => {
    const next = [...project.slides, newSlide];
    setProject({ ...project, slides: next });
    setActiveSlideIndex(next.length - 1);
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

  const handleReorderSlide = (index: number, direction: 'prev' | 'next') => {
    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.slides.length) return;

    const next = [...project.slides];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;

    setProject({ ...project, slides: next });
    setActiveSlideIndex(targetIdx);
  };

  const handleApplyAiGenerated = (title: string, slides: Slide[], caption: string) => {
    setProject({
      ...project,
      title,
      slides,
      caption,
    });
    setActiveSlideIndex(0);
  };

  const renderSlideToBlob = async (index: number): Promise<Blob> => {
    setOffscreenSlide(project.slides[index]);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const frame = offscreenContainerRef.current?.querySelector('[data-template-frame="true"]') as HTMLElement | null;
    if (!frame) throw new Error('La slide non è pronta per l’esportazione.');
    await Promise.all(Array.from(frame.querySelectorAll('img')).map((img) => img.decode().catch(() => undefined)));
    return captureSlideNodeToBlob(frame);
  };

  const renderCurrentSlideToBlob = async (): Promise<Blob> => {
    try { return await renderSlideToBlob(activeSlideIndex); }
    finally { setOffscreenSlide(null); }
  };

  const renderAllSlidesToBlobs = async (): Promise<Array<{ index: number; blob: Blob }>> => {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0b0e2b', overflow: 'hidden' }}>
      {/* Header Bar */}
      <header
        className="editor-header"
        style={{
          height: 60,
          backgroundColor: '#10143d',
          borderBottom: '1px solid #232a68',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div className="editor-header-main" style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Torna alla dashboard"
            style={{
              background: 'none',
              border: 'none',
              color: '#8c95c8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> <span className="dashboard-label">Dashboard</span>
          </button>

          <div style={{ height: 24, width: 1, backgroundColor: '#232a68' }} />

          <input
            className="editor-project-title"
            type="text"
            aria-label="Titolo progetto"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 4,
              outline: 'none',
              width: 260,
            }}
            onFocus={(e) => (e.target.style.backgroundColor = '#141842')}
            onBlur={(e) => (e.target.style.backgroundColor = 'transparent')}
          />

          <div className="save-indicator" role="status" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: saveStatus === 'saved' ? '#20bf6b' : saveStatus === 'saving' ? '#f5cd79' : '#ff8e8e' }}>
            {saveStatus === 'saved' ? <CheckCircle2 size={14} /> : <RefreshCw size={14} className={saveStatus === 'saving' ? 'animate-spin' : ''} />}
            <span>{saveStatus === 'saved' ? 'Salvato' : saveStatus === 'saving' ? 'Salvataggio...' : 'Non salvato'}</span>
          </div>
          {onSignOut && <button type="button" onClick={handleSignOut} className="editor-signout" aria-label="Esci dall’account">Esci</button>}
        </div>

        {/* Action Buttons */}
        <div className="editor-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              backgroundColor: '#141842',
              color: '#dfff2f',
              border: '1px solid #dfff2f',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={15} /> Assistente AI
          </button>

          <button
            type="button"
            onClick={() => setShowCaptionModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              backgroundColor: '#141842',
              color: '#ffffff',
              border: '1px solid #304bff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={15} /> Caption
          </button>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              backgroundColor: '#1728e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(23, 40, 232, 0.4)',
            }}
          >
            <Download size={15} /> Esporta
          </button>
        </div>
      </header>

      {(saveStatus === 'error' || saveStatus === 'conflict') && (
        <div role="alert" className="save-banner">
          <span>{saveError}</span>
          {saveStatus === 'conflict' ? (
            <><button type="button" onClick={reloadProject}>Ricarica</button><button type="button" onClick={saveAsCopy}>Salva copia</button></>
          ) : <button type="button" onClick={() => setRetrySaveTick((count) => count + 1)}>Riprova</button>}
        </div>
      )}

      {/* Mobile Tab Toggle */}
      <div
        className="mobile-tab-bar"
        style={{
          display: 'none', // Overridden by media query in tokens.css or inline flex on small screens
          backgroundColor: '#10143d',
          borderBottom: '1px solid #232a68',
        }}
      >
        <button
          type="button"
          aria-pressed={mobileTab === 'editor'}
          onClick={() => setMobileTab('editor')}
          style={{
            flex: 1,
            padding: 10,
            border: 'none',
            backgroundColor: mobileTab === 'editor' ? '#1728e8' : 'transparent',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Sliders size={16} /> Modifica Contenuti
        </button>
        <button
          type="button"
          aria-pressed={mobileTab === 'preview'}
          onClick={() => setMobileTab('preview')}
          style={{
            flex: 1,
            padding: 10,
            border: 'none',
            backgroundColor: mobileTab === 'preview' ? '#1728e8' : 'transparent',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Eye size={16} /> Anteprima Grafica
        </button>
      </div>

      {/* Main Workspace: Left Editor + Right Live Preview */}
      <div
        className={`workspace ${mobileTab === 'editor' ? 'mobile-editor' : 'mobile-preview'}`}
        style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        {/* Left Panel: Form Content Editor */}
        <div
          className="editor-left-panel"
          style={{
            width: 440,
            backgroundColor: '#0e1236',
            borderRight: '1px solid #232a68',
            overflowY: 'auto',
            padding: 24,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dfff2f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Slide #{activeSlideIndex + 1} di {project.slides.length}
            </span>
            <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 18, color: '#ffffff', marginTop: 4 }}>
              Modifica Slide
            </h2>
          </div>

          {currentSlide.templateType === 'cover' && (
            <FormCover
              content={currentSlide.content as any}
              onChange={handleUpdateCurrentSlideContent}
            />
          )}

          {currentSlide.templateType === 'agenda' && (
            <FormAgenda
              content={currentSlide.content as any}
              onChange={handleUpdateCurrentSlideContent}
            />
          )}

          {currentSlide.templateType === 'notice' && (
            <FormNotice
              content={currentSlide.content as any}
              onChange={handleUpdateCurrentSlideContent}
            />
          )}
        </div>

        {/* Right Panel: Live 4:5 Preview */}
        <div
          className="editor-preview-panel"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            backgroundColor: '#070a20',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            padding: 20,
          }}
        >
          <div
            ref={previewStageRef}
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Live Preview Container with exact scaling */}
            <div
              style={{
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                borderRadius: 4,
                overflow: 'hidden',
                border: '2px solid #232a68',
                flexShrink: 0,
              }}
            >
          <TemplateWrapper scale={previewScale}>
                {renderSlideTemplate(currentSlide)}
              </TemplateWrapper>
            </div>
          </div>

          {/* Scale info badge */}
          <div style={{ alignSelf: 'flex-end', flexShrink: 0, marginTop: 8, fontSize: 11, color: '#8c95c8', backgroundColor: 'rgba(16, 20, 61, 0.8)', padding: '4px 8px', borderRadius: 4 }}>
            Anteprima 4:5 (1080×1350 px) @ {Math.round(previewScale * 100)}%
          </div>
        </div>
      </div>

      {/* Bottom Bar: Slide Carousel Navigator */}
      <SlideNavigator
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
          position: 'fixed',
          left: -9999,
          top: -9999,
          width: 1080,
          height: 1350,
          pointerEvents: 'none',
        }}
      >
        {offscreenSlide && (
          <TemplateWrapper scale={1}>
            {renderSlideTemplate(offscreenSlide)}
          </TemplateWrapper>
        )}
      </div>

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
