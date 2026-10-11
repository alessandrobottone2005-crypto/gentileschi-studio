import React, { useState } from 'react';
import { SlideImage } from '../types/template';
import { removeImageBackground } from '../services/image/bgRemovalService';
import { Upload, Scissors, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

interface ImageControlProps {
  image?: SlideImage;
  defaultImageUrl: string;
  onChange: (image: SlideImage) => void;
  onReset: () => void;
}

export const ImageControl: React.FC<ImageControlProps> = ({
  image,
  defaultImageUrl,
  onChange,
  onReset,
}) => {
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentUrl = image?.url || defaultImageUrl;
  const scale = image?.scale ?? 1;
  const posX = image?.posX ?? 0;
  const posY = image?.posY ?? 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Carica un file immagine valido (PNG, JPG, WEBP).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    onChange({
      url: objectUrl,
      originalUrl: objectUrl,
      scale: 1,
      posX: 0,
      posY: 0,
    });
    setErrorMsg('');
  };

  const handleRemoveBackground = async () => {
    setIsProcessingBg(true);
    setProgressMsg('Inizializzazione rimozione sfondo in locale...');
    setErrorMsg('');

    try {
      const transparentUrl = await removeImageBackground(currentUrl, (p) => {
        setProgressMsg(`Elaborazione AI locale: ${p.progress}%`);
      });

      onChange({
        url: transparentUrl,
        originalUrl: image?.originalUrl || currentUrl,
        isTransparent: true,
        scale,
        posX,
        posY,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nella rimozione dello sfondo.');
    } finally {
      setIsProcessingBg(false);
      setProgressMsg('');
    }
  };

  return (
    <div style={{ marginTop: 20, padding: 16, backgroundColor: '#141842', borderRadius: 8, border: '1px solid #232a68' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#dfff2f', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        Gestione Fotografia
      </h3>

      {/* Image Preview & Upload buttons */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
        <div
          style={{
            width: 80,
            height: 100,
            borderRadius: 6,
            border: '2px dashed #304bff',
            overflow: 'hidden',
            backgroundColor: '#0b0e2b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <img
            src={currentUrl}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: '#1728e8',
              color: '#ffffff',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={15} /> Carica Nuova Foto
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            type="button"
            disabled={isProcessingBg}
            onClick={handleRemoveBackground}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 14px',
              backgroundColor: isProcessingBg ? '#333b70' : '#10143d',
              color: '#dfff2f',
              border: '1px solid #dfff2f',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: isProcessingBg ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessingBg ? <Loader2 size={15} className="animate-spin" /> : <Scissors size={15} />}
            {isProcessingBg ? 'Elaborazione WASM...' : 'Rimuovi Sfondo (Locale)'}
          </button>
        </div>
      </div>

      {progressMsg && (
        <div style={{ fontSize: 12, color: '#dfff2f', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Loader2 size={13} /> {progressMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 10 }}>
          {errorMsg}
        </div>
      )}

      {/* Adjustments: Scale & Position */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#8c95c8', display: 'block', marginBottom: 4 }}>
            Zoom ({Math.round(scale * 100)}%)
          </label>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={scale}
            onChange={(e) => onChange({ ...image, url: currentUrl, scale: parseFloat(e.target.value), posX, posY })}
            style={{ width: '100%', accentColor: '#dfff2f' }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#8c95c8', display: 'block', marginBottom: 4 }}>
            Sposta Orizzontale ({posX}px)
          </label>
          <input
            type="range"
            min="-300"
            max="300"
            step="10"
            value={posX}
            onChange={(e) => onChange({ ...image, url: currentUrl, scale, posX: parseInt(e.target.value, 10), posY })}
            style={{ width: '100%', accentColor: '#dfff2f' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#8c95c8', display: 'block', marginBottom: 4 }}>
          Sposta Verticale ({posY}px)
        </label>
        <input
          type="range"
          min="-300"
          max="300"
          step="10"
          value={posY}
          onChange={(e) => onChange({ ...image, url: currentUrl, scale, posX, posY: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: '#dfff2f' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#8c95c8',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <RotateCcw size={12} /> Ripristina immagine originale
        </button>
      </div>

      {/* Privacy Notice for School Photos */}
      <div style={{ marginTop: 14, padding: 8, backgroundColor: '#0b0e2b', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} color="#dfff2f" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: '#a0a8d4', lineHeight: 1.4, margin: 0 }}>
          <strong>Tutela della Privacy:</strong> Assicurati di disporre della liberatoria firmata prima di pubblicare fotografie che ritraggono studenti minorenni del Gentileschi. L'elaborazione avviene localmente sul tuo browser.
        </p>
      </div>
    </div>
  );
};
