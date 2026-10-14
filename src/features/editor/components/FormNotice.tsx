import React from 'react';
import { NoticeSlideContent } from '../../../shared/types/template';
import { validateNoticeContent, LayoutWarning } from '../../../shared/composition/adaptiveLayout';
import { ImageControl } from '../../media/ImageControl';
import DefaultStudents from '../../../assets/figma/students-group.png';
import { AlertCircle } from 'lucide-react';

interface FormNoticeProps {
  content: NoticeSlideContent;
  onChange: (updated: NoticeSlideContent) => void;
}

export const FormNotice: React.FC<FormNoticeProps> = ({ content, onChange }) => {
  const warnings = validateNoticeContent(content);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
          Titolo Avviso
        </label>
        <input
          aria-label="Titolo avviso"
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--ui-surface)',
            border: '1px solid var(--ui-control-border)',
            borderRadius: 6,
            color: 'var(--ui-ink)',
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 16,
          }}
        />
      </div>

      {/* Highlight Box Settings */}
      <div style={{ padding: 12, backgroundColor: 'var(--ui-surface)', borderRadius: 6, border: '1px solid var(--ui-control-border)' }}>
        <h4 style={{ fontSize: 12, color: 'var(--ui-ink)', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          Box Regola in Evidenza
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ui-muted)', marginBottom: 4 }}>
              Cifra Chiave
            </label>
            <input
              aria-label="Cifra in evidenza"
              type="text"
              value={content.highlightQuantity}
              onChange={(e) => onChange({ ...content, highlightQuantity: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--ui-canvas)',
                border: '1px solid var(--ui-control-border)',
                borderRadius: 4,
                color: 'var(--ui-ink)',
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 22,
                textAlign: 'center',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ui-muted)', marginBottom: 4 }}>
              Etichetta / Adesivo
            </label>
            <input
              aria-label="Testo badge"
              type="text"
              value={content.badgeText}
              onChange={(e) => onChange({ ...content, badgeText: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--ui-canvas)',
                border: '1px solid var(--ui-control-border)',
                borderRadius: 4,
                color: 'var(--ui-ink)',
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--ui-muted)', marginBottom: 4 }}>
            Descrizione Sintetica Cifra
          </label>
          <textarea
            aria-label="Descrizione cifra"
            rows={2}
            value={content.highlightLabel}
            onChange={(e) => onChange({ ...content, highlightLabel: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'var(--ui-canvas)',
              border: '1px solid var(--ui-control-border)',
              borderRadius: 4,
              color: 'var(--ui-ink)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Paragraph 1 */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
          Primo Paragrafo (Spiegazione)
        </label>
        <textarea
          aria-label="Primo paragrafo"
          rows={3}
          value={content.paragraph1}
          onChange={(e) => onChange({ ...content, paragraph1: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--ui-surface)',
            border: '1px solid var(--ui-control-border)',
            borderRadius: 6,
            color: 'var(--ui-ink)',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--ui-muted)', marginTop: 4 }}>
          {content.paragraph1.length} caratteri
        </div>
      </div>

      {/* Paragraph 2 */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
          Secondo Paragrafo (Motivazione)
        </label>
        <textarea
          aria-label="Secondo paragrafo"
          rows={3}
          value={content.paragraph2}
          onChange={(e) => onChange({ ...content, paragraph2: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--ui-surface)',
            border: '1px solid var(--ui-control-border)',
            borderRadius: 6,
            color: 'var(--ui-ink)',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--ui-muted)', marginTop: 4 }}>
          {content.paragraph2.length} caratteri
        </div>
      </div>

      {/* CTA Sticker */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
          Testo Sticker Call-To-Action
        </label>
        <input
          aria-label="Testo sticker call to action"
          type="text"
          value={content.ctaText}
          onChange={(e) => onChange({ ...content, ctaText: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'var(--ui-surface)',
            border: '1px solid var(--ui-control-border)',
            borderRadius: 6,
            color: 'var(--ui-ink)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 14,
          }}
        />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {warnings.map((w: LayoutWarning, idx: number) => (
            <div key={idx} style={{ padding: 10, backgroundColor: 'var(--ui-canvas)', border: '1px solid var(--ui-control-border)', borderRadius: 6, display: 'flex', gap: 8 }}>
              <AlertCircle size={16} color="var(--ui-ink)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: 'var(--ui-ink)' }}>
                <strong>{w.message}</strong> {w.suggestion}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Control */}
      <ImageControl
        image={content.image}
        defaultImageUrl={DefaultStudents}
        onChange={(img) => onChange({ ...content, image: img })}
        onReset={() => onChange({ ...content, image: undefined })}
      />
    </div>
  );
};
