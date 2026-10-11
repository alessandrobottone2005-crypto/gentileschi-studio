import React, { useState } from 'react';
import { Slide } from '../types/template';
import { generateCarouselWithAi } from '../services/ai/geminiService';
import { AiGeneratedCarouselResponse } from '../services/ai/schemas';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AiGeneratorModalProps {
  onApplyGenerated: (title: string, slides: Slide[], caption: string) => void;
  onClose: () => void;
}

const EXAMPLE_PROMPT = `Devo fare un carosello per l'assemblea d'istituto del 20 novembre.
L'assemblea inizierà alle 10:00 e terminerà alle 13:00.
Parleremo delle attività natalizie, delle proposte degli studenti e dei problemi delle aule.
Ricorda anche la regola dei due rappresentanti per classe.`;

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  onApplyGenerated,
  onClose,
}) => {
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AiGeneratedCarouselResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg('');
    setResult(null);

    try {
      const data = await generateCarouselWithAi(prompt);
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Errore durante la generazione dell'AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    const slides: Slide[] = result.slides.map((s, idx) => ({
      id: `ai-slide-${Date.now()}-${idx}`,
      templateType: s.templateType,
      content: s.content as any,
    }));

    onApplyGenerated(result.projectTitle, slides, result.caption);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
          backgroundColor: '#10143d',
          border: '1px solid #304bff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={22} color="#dfff2f" />
            <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#ffffff', margin: 0 }}>
              Generazione Carosello con AI
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8c95c8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#a0a8d4', margin: 0, lineHeight: 1.4 }}>
          Descrivi in linguaggio naturale i temi dell'assemblea o della comunicazione. L'AI estrarrà date, orari, punti dell'O.D.G. e regole, inserendoli nei template Figma originali.
        </p>

        <textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Inserisci la descrizione dell'assemblea..."
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#141842',
            border: '1px solid #232a68',
            borderRadius: 8,
            color: '#ffffff',
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        {errorMsg && (
          <div style={{ padding: 12, backgroundColor: 'rgba(255, 70, 70, 0.15)', border: '1px solid #ff4646', borderRadius: 8, color: '#ff8888', fontSize: 13 }}>
            {errorMsg}
          </div>
        )}

        {/* Generated Result Preview */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, backgroundColor: '#141842', borderRadius: 8, border: '1px solid #dfff2f' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dfff2f', fontWeight: 700, fontSize: 14 }}>
              <CheckCircle size={18} /> Struttura Carosello Generata: {result.slides.length} Slide
            </div>

            <div style={{ fontSize: 13, color: '#ffffff' }}>
              <strong>Titolo:</strong> {result.projectTitle}
            </div>

            {result.missingInformation && result.missingInformation.length > 0 && (
              <div style={{ padding: 10, backgroundColor: 'rgba(255, 170, 0, 0.15)', border: '1px solid #ffa500', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ffcc66', fontWeight: 600, fontSize: 12 }}>
                  <AlertCircle size={14} /> Informazioni da verificare:
                </div>
                {result.missingInformation.map((info, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: '#ffe099' }}>
                    • {info}
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, color: '#8c95c8' }}>
              Slide generate: {result.slides.map((s, i) => `#${i + 1} (${s.templateType})`).join(', ')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', background: 'none', border: '1px solid #232a68', color: '#8c95c8', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            Annulla
          </button>

          {!result ? (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                backgroundColor: '#1728e8',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: isGenerating ? 'not-allowed' : 'pointer',
              }}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'Generazione in corso...' : 'Genera con AI'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                backgroundColor: '#dfff2f',
                color: '#10143d',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Applica al Progetto
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
