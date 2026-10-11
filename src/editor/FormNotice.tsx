import React from 'react';
import { NoticeSlideContent } from '../types/template';
import { validateNoticeContent, LayoutWarning } from '../engine/adaptiveLayout';
import { ImageControl } from './ImageControl';
import DefaultStudents from '../assets/figma/students-group.png';
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
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
          Titolo Avviso
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: 16,
          }}
        />
      </div>

      {/* Highlight Box Settings */}
      <div style={{ padding: 12, backgroundColor: '#141842', borderRadius: 6, border: '1px solid #dfff2f' }}>
        <h4 style={{ fontSize: 12, color: '#dfff2f', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          Box Regola in Evidenza
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8c95c8', marginBottom: 4 }}>
              Cifra Chiave
            </label>
            <input
              type="text"
              value={content.highlightQuantity}
              onChange={(e) => onChange({ ...content, highlightQuantity: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0b0e2b',
                border: '1px solid #232a68',
                borderRadius: 4,
                color: '#dfff2f',
                fontFamily: "'Archivo Black', sans-serif",
                fontSize: 22,
                textAlign: 'center',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8c95c8', marginBottom: 4 }}>
              Etichetta / Adesivo
            </label>
            <input
              type="text"
              value={content.badgeText}
              onChange={(e) => onChange({ ...content, badgeText: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#0b0e2b',
                border: '1px solid #232a68',
                borderRadius: 4,
                color: '#ffffff',
                fontFamily: "'Comic Neue', cursive",
                fontWeight: 700,
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8c95c8', marginBottom: 4 }}>
            Descrizione Sintetica Cifra
          </label>
          <textarea
            rows={2}
            value={content.highlightLabel}
            onChange={(e) => onChange({ ...content, highlightLabel: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#0b0e2b',
              border: '1px solid #232a68',
              borderRadius: 4,
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Paragraph 1 */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
          Primo Paragrafo (Spiegazione)
        </label>
        <textarea
          rows={3}
          value={content.paragraph1}
          onChange={(e) => onChange({ ...content, paragraph1: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: '#8c95c8', marginTop: 4 }}>
          {content.paragraph1.length} caratteri
        </div>
      </div>

      {/* Paragraph 2 */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
          Secondo Paragrafo (Motivazione)
        </label>
        <textarea
          rows={3}
          value={content.paragraph2}
          onChange={(e) => onChange({ ...content, paragraph2: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: '#8c95c8', marginTop: 4 }}>
          {content.paragraph2.length} caratteri
        </div>
      </div>

      {/* CTA Sticker */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#dfff2f', marginBottom: 6 }}>
          Testo Sticker Call-To-Action
        </label>
        <input
          type="text"
          value={content.ctaText}
          onChange={(e) => onChange({ ...content, ctaText: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
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
            <div key={idx} style={{ padding: 10, backgroundColor: 'rgba(255, 170, 0, 0.15)', border: '1px solid #ffa500', borderRadius: 6, display: 'flex', gap: 8 }}>
              <AlertCircle size={16} color="#ffa500" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#ffcc66' }}>
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
