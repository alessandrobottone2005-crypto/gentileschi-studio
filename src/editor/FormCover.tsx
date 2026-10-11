import React from 'react';
import { CoverSlideContent } from '../types/template';
import { formatDateToItalian } from '../engine/dateUtils';
import { validateCoverContent, LayoutWarning } from '../engine/adaptiveLayout';
import { ImageControl } from './ImageControl';
import DefaultImage from '../assets/figma/gentileschi-statue.png';
import { Calendar, AlertCircle } from 'lucide-react';

interface FormCoverProps {
  content: CoverSlideContent;
  onChange: (updated: CoverSlideContent) => void;
}

export const FormCover: React.FC<FormCoverProps> = ({ content, onChange }) => {
  const warnings = validateCoverContent(content);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      const { day, month } = formatDateToItalian(dateVal);
      onChange({ ...content, day, month });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
          Titolo Assemblea (vai a capo per dividere le righe)
        </label>
        <textarea
          aria-label="Titolo assemblea"
          rows={2}
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
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: 11, color: '#8c95c8', marginTop: 4 }}>
          {content.title.length} caratteri — La dimensione si adatta automaticamente.
        </div>
      </div>

      {/* Date Picker Auto-Convert */}
      <div style={{ padding: 12, backgroundColor: '#10143d', borderRadius: 6, border: '1px solid #304bff' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#dfff2f', marginBottom: 6 }}>
          <Calendar size={16} /> Selettore Data Rapido (Italiano)
        </label>
        <input
          aria-label="Data assemblea"
          type="date"
          onChange={handleDateChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 14,
          }}
        />
        <span style={{ fontSize: 11, color: '#8c95c8', marginTop: 4, display: 'block' }}>
          Calcola automaticamente il giorno numerico e il mese in lettere maiuscole.
        </span>
      </div>

      {/* Manual Day & Month Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
            Giorno (es. 02)
          </label>
          <input
            aria-label="Giorno assemblea"
            type="text"
            maxLength={3}
            value={content.day}
            onChange={(e) => onChange({ ...content, day: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#141842',
              border: '1px solid #232a68',
              borderRadius: 6,
              color: '#dfff2f',
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: 20,
              textAlign: 'center',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
            Mese (es. OTTOBRE)
          </label>
          <input
            aria-label="Mese assemblea"
            type="text"
            value={content.month}
            onChange={(e) => onChange({ ...content, month: e.target.value.toUpperCase() })}
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
      </div>

      {/* Time Slot */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f0e6', marginBottom: 6 }}>
          Orario Assemblea
        </label>
        <textarea
          aria-label="Orario assemblea"
          rows={2}
          value={content.timeSlot}
          onChange={(e) => onChange({ ...content, timeSlot: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 6,
            color: '#ffffff',
            fontFamily: "'Roboto Mono', monospace",
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
        defaultImageUrl={DefaultImage}
        onChange={(img) => onChange({ ...content, image: img })}
        onReset={() => onChange({ ...content, image: undefined })}
      />
    </div>
  );
};
