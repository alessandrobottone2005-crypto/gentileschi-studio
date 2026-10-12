import React, { useRef, useState } from 'react';
import { SlideImage } from '../types/template';
import { saveMedia } from '../services/image/mediaStore';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { MediaPicker } from '../studio/MediaLibrary';
import '../design-system/studio.css';
import { legacyDefaultImageKey } from '../engine/defaultAssets';
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
  const [showLibrary, setShowLibrary] = useState(false);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = image?.url || defaultImageUrl;
  const scale = image?.scale ?? 1;
  const posX = image?.posX ?? 0;
  const posY = image?.posY ?? 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      const saved = await saveMedia(file);
      onChange({
        ...saved,
        originalUrl: saved.url,
        originalStoragePath: saved.storagePath,
        scale: 1,
        posX: 0,
        posY: 0,
      });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Impossibile salvare la fotografia. Riprova.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveBackground = async () => {
    setIsProcessingBg(true);
    setProgressMsg('Inizializzazione rimozione sfondo in locale...');
    setErrorMsg('');
    let transparentUrl: string | undefined;

    try {
      const { removeImageBackground } = await import('../services/image/bgRemovalService');
      transparentUrl = await removeImageBackground(currentUrl, (p) => {
        setProgressMsg(`Elaborazione AI locale: ${p.progress}%`);
      });
      const response = await fetch(transparentUrl);
      const processed = await response.blob();
      const saved = await saveMedia(processed);
      onChange({
        ...saved,
        originalUrl: image?.originalUrl || currentUrl,
        originalStoragePath: image?.originalStoragePath || image?.storagePath,
        originalAssetKey: image?.originalAssetKey || image?.assetKey || legacyDefaultImageKey(currentUrl),
        isTransparent: true,
        scale,
        posX,
        posY,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nella rimozione dello sfondo.');
    } finally {
      if (transparentUrl) URL.revokeObjectURL(transparentUrl);
      setIsProcessingBg(false);
      setProgressMsg('');
    }
  };

  const handleReset = () => {
    if (image?.isTransparent && (image.originalStoragePath || image.originalAssetKey)) {
      onChange({
        url: image.originalUrl || defaultImageUrl,
        storagePath: image.originalStoragePath,
        assetKey: image.originalAssetKey,
        originalUrl: image.originalUrl,
        originalStoragePath: image.originalStoragePath,
        originalAssetKey: image.originalAssetKey,
        scale: 1,
        posX: 0,
        posY: 0,
      });
      return;
    }
    onReset();
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
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
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
              border: 0,
            }}
          >
            <Upload size={15} /> {isUploading ? 'Caricamento...' : 'Carica Nuova Foto'}
          </button>
          <button type="button" className="studio-button" disabled={isUploading || isProcessingBg} onClick={() => setShowLibrary(true)}>Scegli dalla libreria</button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} disabled={isUploading} hidden aria-label="Seleziona fotografia" />

          <button
            type="button"
            disabled={isProcessingBg || isUploading || image?.missing}
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

      {(errorMsg || image?.missing) && (
        <div style={{ fontSize: 12, color: '#ff6b6b', marginBottom: 10 }}>
          {errorMsg || 'La fotografia salvata in precedenza non è più disponibile. Caricala di nuovo.'}
        </div>
      )}

      {/* Adjustments: Scale & Position */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#8c95c8', display: 'block', marginBottom: 4 }}>
            Zoom ({Math.round(scale * 100)}%)
          </label>
          <input
            aria-label="Zoom fotografia"
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
            aria-label="Sposta fotografia orizzontalmente"
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
          aria-label="Sposta fotografia verticalmente"
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
          onClick={handleReset}
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

      {showLibrary && <MediaPicker onClose={() => setShowLibrary(false)} onSelect={selected => { onChange(selected); setShowLibrary(false); }} />}

      {/* Privacy Notice for School Photos */}
      <div style={{ marginTop: 14, padding: 8, backgroundColor: '#0b0e2b', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} color="#dfff2f" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: '#a0a8d4', lineHeight: 1.4, margin: 0 }}>
          <strong>Tutela della Privacy:</strong> Assicurati di disporre della liberatoria prima di pubblicare fotografie di studenti minorenni. La rimozione dello sfondo avviene nel browser. {isSupabaseConfigured ? 'Le foto vengono archiviate online e sono visibili a tutti gli utenti registrati.' : 'Le foto restano su questo dispositivo.'}
        </p>
      </div>
    </div>
  );
};
