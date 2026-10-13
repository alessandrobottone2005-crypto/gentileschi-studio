import React, { useState } from 'react';
import { Project } from '../types/template';
import { downloadSingleSlideBlob, downloadCarouselZip, formatProjectSlug } from '../services/export/exportEngine';
import { X, Download, Archive, Loader2, CheckCircle2 } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';
import { FORMATS } from '../types/scene';

interface ExportModalProps {
  project: Project;
  activeSlideIndex: number;
  renderCurrentSlideToBlob: () => Promise<Blob>;
  renderAllSlidesToBlobs: () => Promise<Array<{ index: number; blob: Blob }>>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  activeSlideIndex,
  renderCurrentSlideToBlob,
  renderAllSlidesToBlobs,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [exportComplete, setExportComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const slug = formatProjectSlug(project.title);
  const dimensions = FORMATS[project.format || 'portrait'];
  const dialogRef = useDialogFocus(onClose);

  const handleExportCurrent = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setStatusMessage(`Rendering slide (${dimensions.width} × ${dimensions.height})…`);
    try {
      const blob = await renderCurrentSlideToBlob();
      downloadSingleSlideBlob(blob, project.title, activeSlideIndex);
      setExportComplete(true);
    } catch (err) {
      setErrorMessage(`Errore esportazione: ${err instanceof Error ? err.message : 'Impossibile caricare una risorsa della slide.'}`);
    } finally {
      setIsExporting(false);
      setStatusMessage('');
    }
  };

  const handleExportAllZip = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setStatusMessage('Elaborazione di tutte le slide del carosello in corso...');
    try {
      const blobs = await renderAllSlidesToBlobs();
      await downloadCarouselZip(blobs, project.title, (p) => {
        setStatusMessage(p.statusText);
      });
      setExportComplete(true);
    } catch (err) {
      setErrorMessage(`Errore esportazione ZIP: ${err instanceof Error ? err.message : 'Impossibile caricare una risorsa della slide.'}`);
    } finally {
      setIsExporting(false);
      setStatusMessage('');
    }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#10143d',
          border: '1px solid #304bff',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="export-title" style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: '#dfff2f', margin: 0 }}>
            Esporta Post Instagram
          </h2>
          <button
            type="button"
            aria-label="Chiudi esportazione"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8c95c8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 14, backgroundColor: '#141842', borderRadius: 8, border: '1px solid #232a68' }}>
          <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>Specifiche Instagram Ottimali:</div>
          <div style={{ fontSize: 12, color: '#8c95c8', marginTop: 4 }}>
            • Formato: <strong>{dimensions.label} ({dimensions.width} × {dimensions.height} px)</strong><br />
            • Nomenclatura ordinata: <code>{slug}-01.png</code>, <code>{slug}-02.png</code>...<br />
            • Compressione lossless con font e decorazioni vettoriali native.
          </div>
        </div>

        {statusMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#1728e8', borderRadius: 8, color: '#ffffff', fontSize: 13 }}>
            <Loader2 size={16} className="animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {exportComplete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(223, 255, 47, 0.15)', border: '1px solid #dfff2f', borderRadius: 8, color: '#dfff2f', fontSize: 13 }}>
            <CheckCircle2 size={16} />
            <span>File scaricato con successo! Pronto per la pubblicazione.</span>
          </div>
        )}

        {errorMessage && <div role="alert" className="app-error">{errorMessage}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Export Current */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCurrent}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 18px',
              backgroundColor: '#1728e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            <Download size={18} /> Scarica Solo Slide Attuale (#{activeSlideIndex + 1}) come PNG
          </button>

          {/* Export All as ZIP */}
          <button
            type="button"
            disabled={isExporting || project.slides.length === 0}
            onClick={handleExportAllZip}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 18px',
              backgroundColor: '#dfff2f',
              color: '#10143d',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            <Archive size={18} /> Scarica Carosello Completo ({project.slides.length} Slide) in ZIP
          </button>
        </div>
      </div>
    </div>
  );
};
