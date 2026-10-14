import React from 'react';
import { AgendaSlideContent, AgendaItem } from '../../../shared/types/template';
import { validateAgendaContent, LayoutWarning } from '../../../shared/composition/adaptiveLayout';
import { ImageControl } from '../../media/ImageControl';
import DefaultAirplane from '../../../assets/figma/airplane-trip.png';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, AlertCircle } from 'lucide-react';

interface FormAgendaProps {
  content: AgendaSlideContent;
  onChange: (updated: AgendaSlideContent) => void;
}

export const FormAgenda: React.FC<FormAgendaProps> = ({ content, onChange }) => {
  const warnings = validateAgendaContent(content.items);

  const handleAddItem = () => {
    const nextNum = String(content.items.length + 1).padStart(2, '0');
    const newItem: AgendaItem = {
      id: `item-${Date.now()}`,
      number: nextNum,
      text: 'Nuovo punto di discussione',
      isHighlight: false,
    };
    onChange({
      ...content,
      items: [...content.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const next = content.items
      .filter((_, i) => i !== index)
      .map((it, i) => ({ ...it, number: String(i + 1).padStart(2, '0') }));
    onChange({ ...content, items: next });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= content.items.length) return;

    const copy = [...content.items];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-index numbers
    const updated = copy.map((it, i) => ({ ...it, number: String(i + 1).padStart(2, '0') }));
    onChange({ ...content, items: updated });
  };

  const handleUpdateItem = (index: number, patch: Partial<AgendaItem>) => {
    const copy = [...content.items];
    copy[index] = { ...copy[index], ...patch };
    onChange({ ...content, items: copy });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title & Subtitle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
            Sigla Titolo
          </label>
          <input
            aria-label="Sigla titolo ordine del giorno"
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

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)', marginBottom: 6 }}>
            Etichetta Espansa
          </label>
          <input
            aria-label="Etichetta ordine del giorno"
            type="text"
            value={content.subtitle}
            onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'var(--ui-surface)',
              border: '1px solid var(--ui-control-border)',
              borderRadius: 6,
              color: 'var(--ui-ink)',
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Agenda Items List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ui-ink)' }}>
            Punti all'Ordine del Giorno ({content.items.length})
          </label>
          <button
            type="button"
            onClick={handleAddItem}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              backgroundColor: 'var(--ui-primary)',
              color: 'var(--ui-on-primary)',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Aggiungi Punto
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {content.items.map((item, index) => (
            <div
              key={item.id}
              style={{
                padding: 12,
                backgroundColor: item.isHighlight ? 'var(--ui-ink)' : 'var(--ui-ink)',
                border: item.isHighlight ? '1px solid var(--ui-control-border)' : '1px solid var(--ui-control-border)',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Roboto Mono', monospace", fontWeight: 700, color: item.isHighlight ? 'var(--ui-ink)' : 'var(--ui-ink)', fontSize: 14 }}>
                  Punto #{item.number}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Highlight toggle */}
                  <button
                    type="button"
                    aria-label={`${item.isHighlight ? 'Rimuovi evidenza da' : 'Evidenzia'} punto ${index + 1}`}
                    onClick={() => handleUpdateItem(index, { isHighlight: !item.isHighlight })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      backgroundColor: item.isHighlight ? 'var(--ui-ink)' : 'var(--ui-ink)',
                      color: item.isHighlight ? 'var(--ui-ink)' : 'var(--ui-muted)',
                      border: '1px solid var(--ui-control-border)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={12} /> {item.isHighlight ? 'Evidenziato' : 'Normale'}
                  </button>

                  {/* Reorder */}
                  <button
                    type="button"
                    aria-label={`Sposta punto ${index + 1} su`}
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    style={{ background: 'none', border: 'none', color: 'var(--ui-muted)', cursor: index === 0 ? 'default' : 'pointer' }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Sposta punto ${index + 1} giù`}
                    disabled={index === content.items.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    style={{ background: 'none', border: 'none', color: 'var(--ui-muted)', cursor: index === content.items.length - 1 ? 'default' : 'pointer' }}
                  >
                    <ArrowDown size={14} />
                  </button>

                  {/* Delete */}
                  {content.items.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Elimina punto ${index + 1}`}
                      onClick={() => handleRemoveItem(index)}
                      style={{ background: 'none', border: 'none', color: 'var(--ui-ink)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                aria-label={`Testo punto ${index + 1}`}
                rows={2}
                value={item.text}
                onChange={(e) => handleUpdateItem(index, { text: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--ui-canvas)',
                  border: '1px solid var(--ui-control-border)',
                  borderRadius: 4,
                  color: 'var(--ui-ink)',
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
            </div>
          ))}
        </div>
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
        defaultImageUrl={DefaultAirplane}
        onChange={(img) => onChange({ ...content, image: img })}
        onReset={() => onChange({ ...content, image: undefined })}
      />
    </div>
  );
};
