import React from 'react';
import { Slide, TemplateType } from '../types/template';
import { TEMPLATE_REGISTRY, renderSlideTemplate } from '../templates/registry';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { FORMATS, ProjectFormat } from '../types/scene';
import { createDefaultSlide } from '../engine/defaultData';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavigatorProps {
  slides: Slide[];
  format?: ProjectFormat;
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: (newSlide: Slide) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onReorderSlide: (index: number, direction: 'prev' | 'next') => void;
}

export const SlideNavigator: React.FC<SlideNavigatorProps> = ({
  slides,
  format = 'portrait',
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlide,
}) => {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);

  const handleAddNew = (type: TemplateType) => {
    const s = createDefaultSlide(type);
    onAddSlide(s);
    setShowAddMenu(false);
  };

  return (
    <div className="slide-navigator" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 16px', backgroundColor: '#0f1338', borderTop: '1px solid #232a68', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#dfff2f', textTransform: 'uppercase' }}>
          Slide del Carosello ({slides.length})
        </span>

        {/* Add slide dropdown */}
        <div style={{ display: 'flex', gap: 8 }}>
        <div className="mobile-slide-menu" style={{ position: 'relative' }}>
          <button type="button" className="secondary-action" aria-expanded={showActionsMenu} onClick={() => setShowActionsMenu(!showActionsMenu)}>Azioni</button>
          {showActionsMenu && <div className="mobile-slide-actions">
            <button type="button" disabled={activeSlideIndex === 0} onClick={() => { onReorderSlide(activeSlideIndex, 'prev'); setShowActionsMenu(false); }}>Sposta prima</button>
            <button type="button" disabled={activeSlideIndex === slides.length - 1} onClick={() => { onReorderSlide(activeSlideIndex, 'next'); setShowActionsMenu(false); }}>Sposta dopo</button>
            <button type="button" onClick={() => { onDuplicateSlide(activeSlideIndex); setShowActionsMenu(false); }}>Duplica slide</button>
            <button type="button" disabled={slides.length <= 1} onClick={() => { onDeleteSlide(activeSlideIndex); setShowActionsMenu(false); }}>Elimina slide</button>
          </div>}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#1728e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Aggiungi Slide
          </button>

          {showAddMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: 6,
                backgroundColor: '#141842',
                border: '1px solid #304bff',
                borderRadius: 8,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 50,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                minWidth: 200,
              }}
            >
              <button
                type="button"
                onClick={() => handleAddNew('cover')}
                style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#ffffff', fontSize: 13, cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d235c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                + Copertina Assemblea
              </button>
              <button
                type="button"
                onClick={() => handleAddNew('agenda')}
                style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#ffffff', fontSize: 13, cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d235c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                + Ordine del Giorno (O.D.G.)
              </button>
              <button
                type="button"
                onClick={() => handleAddNew('notice')}
                style={{ textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: '#ffffff', fontSize: 13, cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d235c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                + Avviso Importante / Regola
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Slide Thumbnails List */}
      <div className="slide-list" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
        {slides.map((slide, index) => {
          const isActive = index === activeSlideIndex;
          const templateDef = TEMPLATE_REGISTRY[slide.templateType];

          return (
            <div
              key={slide.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                className="slide-thumb"
                aria-label={`Apri slide ${index + 1}: ${templateDef.name}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectSlide(index)}
                style={{
                  width: 72,
                  height: 90,
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isActive ? '3px solid #dfff2f' : '1px solid #232a68',
                  boxShadow: isActive ? '0 0 12px rgba(223, 255, 47, 0.4)' : 'none',
                  backgroundColor: '#141842',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                <span aria-hidden="true" style={{ pointerEvents: 'none' }}><TemplateWrapper scale={Math.min(66 / FORMATS[format].width, 84 / FORMATS[format].height)} width={FORMATS[format].width} height={FORMATS[format].height}>{renderSlideTemplate(slide, format)}</TemplateWrapper></span>
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    backgroundColor: 'rgba(16, 20, 61, 0.85)',
                    color: '#dfff2f',
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: 3,
                  }}
                >
                  #{index + 1}
                </span>
              </button>

              {/* Actions for active slide */}
              <div className="slide-actions" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button
                  type="button"
                  title="Sposta prima"
                  aria-label={`Sposta slide ${index + 1} prima`}
                  disabled={index === 0}
                  onClick={() => onReorderSlide(index, 'prev')}
                  style={{ background: 'none', border: 'none', color: index === 0 ? '#333b70' : '#8c95c8', cursor: index === 0 ? 'default' : 'pointer', padding: 2 }}
                >
                  <ChevronLeft size={13} />
                </button>

                <button
                  type="button"
                  title="Duplica slide"
                  aria-label={`Duplica slide ${index + 1}`}
                  onClick={() => onDuplicateSlide(index)}
                  style={{ background: 'none', border: 'none', color: '#8c95c8', cursor: 'pointer', padding: 2 }}
                >
                  <Copy size={13} />
                </button>

                {slides.length > 1 && (
                  <button
                    type="button"
                    title="Elimina slide"
                    aria-label={`Elimina slide ${index + 1}`}
                    onClick={() => onDeleteSlide(index)}
                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                <button
                  type="button"
                  title="Sposta dopo"
                  aria-label={`Sposta slide ${index + 1} dopo`}
                  disabled={index === slides.length - 1}
                  onClick={() => onReorderSlide(index, 'next')}
                  style={{ background: 'none', border: 'none', color: index === slides.length - 1 ? '#333b70' : '#8c95c8', cursor: index === slides.length - 1 ? 'default' : 'pointer', padding: 2 }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
