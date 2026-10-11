import React, { useState, useEffect, useRef } from 'react';
import { Project, Slide, TemplateType } from '../types/template';
import { saveProject } from '../services/supabase/projectService';
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
}

export const EditorPage: React.FC<EditorPageProps> = ({
  initialProject,
  onBackToDashboard,
}) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  const previewFrameRef = useRef<HTMLDivElement>(null);
  const offscreenContainerRef = useRef<HTMLDivElement>(null);
  const [offscreenSlide, setOffscreenSlide] = useState<Slide | null>(null);

  // Auto-save debounce
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      await saveProject(project);
      setSaveStatus('saved');
    }, 700);

    return () => clearTimeout(timer);
  }, [project]);

  // Dynamic preview scale calculation
  useEffect(() => {
    const handleResize = () => {
      const containerH = window.innerHeight - 200;
      const targetScale = Math.min(Math.max(containerH / 1350, 0.28), 0.72);
      setPreviewScale(targetScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Render all slides to blobs for ZIP export
  const renderAllSlidesToBlobs = async (): Promise<Array<{ index: number; blob: Blob }>> => {
    const blobs: Array<{ index: number; blob: Blob }> = [];

    for (let i = 0; i < project.slides.length; i++) {
      setOffscreenSlide(project.slides[i]);
      // Small delay for DOM paint and images
      await new Promise((resolve) => setTimeout(resolve, 250));

      if (offscreenContainerRef.current) {
        const frame = offscreenContainerRef.current.querySelector('[data-template-frame="true"]') as HTMLElement;
        if (frame) {
          const blob = await captureSlideNodeToBlob(frame);
          blobs.push({ index: i, blob });
        }
      }
    }

    setOffscreenSlide(null);
    return blobs;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0b0e2b', overflow: 'hidden' }}>
      {/* Header Bar */}
      <header
        style={{
          height: 60,
          backgroundColor: '#10143d',
          borderBottom: '1px solid #232a68',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={onBackToDashboard}
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
            <ArrowLeft size={16} /> Dashboard
          </button>

          <div style={{ height: 24, width: 1, backgroundColor: '#232a68' }} />

          <input
            type="text"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: saveStatus === 'saved' ? '#20bf6b' : '#f5cd79' }}>
            {saveStatus === 'saved' ? <CheckCircle2 size={14} /> : <RefreshCw size={14} className="animate-spin" />}
            <span>{saveStatus === 'saved' ? 'Salvato' : 'Salvataggio...'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Form Content Editor */}
        <div
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
          style={{
            flex: 1,
            backgroundColor: '#070a20',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 20,
            position: 'relative',
          }}
        >
          {/* Live Preview Container with exact scaling */}
          <div
            style={{
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              borderRadius: 4,
              overflow: 'hidden',
              border: '2px solid #232a68',
            }}
          >
            <TemplateWrapper scale={previewScale} ref={previewFrameRef}>
              {renderSlideTemplate(currentSlide)}
            </TemplateWrapper>
          </div>

          {/* Scale info badge */}
          <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: 11, color: '#8c95c8', backgroundColor: 'rgba(16, 20, 61, 0.8)', padding: '4px 8px', borderRadius: 4 }}>
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
          slideRef={previewFrameRef}
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
