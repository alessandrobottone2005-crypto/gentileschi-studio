import React, { useRef, useState } from 'react';
import { Download, Image, Search, Upload, X } from 'lucide-react';
import type { Author, MediaAsset } from '../../shared/types/studio';
import type { SlideImage } from '../../shared/types/template';
import { getAuthors } from '../accounts/services/accountService';
import { saveMedia, loadMedia } from './services/mediaStore';
import { downloadMedia } from './services/libraryService';
import {
  getMediaLibrary,
  releaseLocalPreviews,
} from './services/libraryService';
import { useResource } from '../../shared/hooks/useResource';
import { useDialogFocus } from '../../shared/hooks/useDialogFocus';
import { formatBytes, formatDate, ResourceError } from '../../shared/ui/StudioUi';

export function MediaLibrary({
  assets,
  authors,
  loading,
  error,
  onReload,
  onSelect,
}: {
  assets: MediaAsset[] | null;
  authors: Author[];
  loading: boolean;
  error: string;
  onReload: () => void;
  onSelect?: (asset: MediaAsset) => void;
}) {
  const [search, setSearch] = useState('');
  const [owner, setOwner] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const previewRef = useDialogFocus(() => setPreview(null), preview !== null);
  const ownerLabel = (id: string | null) =>
    authors.find((author) => author.id === id)?.displayName ||
    'Autore non disponibile';
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setActionError('');
    try {
      const saved = await saveMedia(file);
      URL.revokeObjectURL(saved.url);
      onReload();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Caricamento non riuscito.',
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const download = async (asset: MediaAsset) => {
    if (downloading) return;
    setDownloading(asset.id);
    setActionError('');
    try {
      await downloadMedia(asset);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Download non riuscito.',
      );
    } finally {
      setDownloading(null);
    }
  };
  const matching = (assets || []).filter(
    (asset) =>
      (owner === 'all' ||
        (owner === 'unknown'
          ? !authors.some((author) => author.id === asset.ownerId)
          : asset.ownerId === owner)) &&
      `${asset.originalName} ${ownerLabel(asset.ownerId)}`
        .toLocaleLowerCase('it')
        .includes(search.toLocaleLowerCase('it')),
  );
  const ownerIds = [...new Set((assets || []).map((asset) => asset.ownerId))];
  return (
    <div className="studio-library">
      <div className="studio-toolbar">
        <label className="studio-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Cerca fotografie"
            placeholder="Cerca una foto o un autore"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filtra foto per caricatore"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
        >
          <option value="all">Tutti gli autori</option>
          {authors
            .filter((author) => ownerIds.includes(author.id))
            .map((author) => (
              <option key={author.id} value={author.id}>
                {author.displayName}
              </option>
            ))}
          {ownerIds.some(
            (id) => !authors.some((author) => author.id === id),
          ) && <option value="unknown">Autore non disponibile</option>}
        </select>
        <button
          type="button"
          className="studio-button studio-button-primary"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          <Upload size={17} />
          {uploading ? 'Caricamento…' : 'Carica foto'}
        </button>
        <input
          hidden
          type="file"
          ref={input}
          accept="image/png,image/jpeg,image/webp"
          aria-label="Carica una fotografia"
          onChange={upload}
          disabled={uploading}
        />
      </div>
      <p className="studio-muted studio-library-note">
        PNG, JPG o WebP, fino a 10 MB. Le foto sono condivise con tutti gli
        utenti dello studio.
      </p>
      {error && <ResourceError message={error} retry={onReload} />}
      {actionError && (
        <p role="alert" className="app-error">
          {actionError}
        </p>
      )}
      {loading ? (
        <p role="status" className="studio-loading">
          Caricamento fotografie…
        </p>
      ) : !error && matching.length === 0 ? (
        <div className="studio-empty">
          <Image size={32} aria-hidden="true" />
          <h3>
            {assets?.length
              ? 'Nessuna foto corrisponde alla ricerca'
              : 'La libreria è pronta'}
          </h3>
          <p>
            {assets?.length
              ? 'Prova un altro nome o cambia il filtro.'
              : 'Carica una fotografia e riutilizzala nei tuoi progetti.'}
          </p>
        </div>
      ) : (
        <div className="studio-media-grid">
          {matching.map((asset) => (
            <article key={asset.id} className="studio-media-item">
              <button
                type="button"
                className="studio-media-preview"
                aria-label={`Anteprima ${asset.originalName}`}
                onClick={() => setPreview(asset)}
              >
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    loading="lazy"
                    alt={asset.originalName}
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden';
                      event.currentTarget.parentElement?.classList.add(
                        'studio-media-missing',
                      );
                    }}
                  />
                ) : (
                  <span>Anteprima non disponibile</span>
                )}
              </button>
              <div className="studio-media-description">
                <h3 title={asset.originalName}>{asset.originalName}</h3>
                <p>{ownerLabel(asset.ownerId)}</p>
                <p>
                  {formatBytes(asset.size)} · {formatDate(asset.createdAt)}
                </p>
              </div>
              <div className="studio-media-actions">
                {onSelect && (
                  <button
                    type="button"
                    className="studio-button studio-button-primary"
                    onClick={() => onSelect(asset)}
                  >
                    Usa questa foto
                  </button>
                )}
                <button
                  type="button"
                  className="studio-icon-button"
                  aria-label={`Scarica ${asset.originalName}`}
                  disabled={downloading !== null}
                  onClick={() => void download(asset)}
                >
                  <Download size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {preview && (
        <div className="studio-dialog-backdrop studio-preview-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-preview-title"
            tabIndex={-1}
            ref={previewRef}
            className="studio-dialog studio-photo-dialog"
          >
            <div className="studio-section-heading">
              <h2 id="photo-preview-title">{preview.originalName}</h2>
              <button
                type="button"
                className="studio-icon-button"
                aria-label="Chiudi anteprima"
                onClick={() => setPreview(null)}
              >
                <X size={21} />
              </button>
            </div>
            {preview.previewUrl ? (
              <img src={preview.previewUrl} alt={preview.originalName} />
            ) : (
              <p>Anteprima non disponibile. Prova ad aggiornare la libreria.</p>
            )}
            {onSelect && (
              <button
                type="button"
                className="studio-button studio-button-primary"
                onClick={() => onSelect(preview)}
              >
                Usa questa foto
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export function MediaPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (image: SlideImage) => void;
}) {
  const library = useResource(getMediaLibrary, releaseLocalPreviews);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const dialogRef = useDialogFocus(() => {
    if (!selecting) onClose();
  });
  // Picker only needs author names, loaded separately from the photograph bytes.
  const authors = useResource(getAuthors);
  const select = async (asset: MediaAsset) => {
    if (selecting) return;
    setSelecting(true);
    setError('');
    try {
      const url = await loadMedia(asset.storagePath);
      onSelect({
        storagePath: asset.storagePath,
        source: asset.source,
        url,
        originalStoragePath: asset.storagePath,
        originalUrl: url,
        scale: 1,
        posX: 0,
        posY: 0,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Impossibile usare la fotografia. Riprova.',
      );
      setSelecting(false);
    }
  };
  return (
    <div className="studio-dialog-backdrop">
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
        className="studio-dialog studio-library-dialog"
      >
        <div className="studio-section-heading">
          <h2 id="media-picker-title">Scegli dalla libreria</h2>
          <button
            type="button"
            className="studio-icon-button"
            aria-label="Chiudi libreria"
            onClick={onClose}
            disabled={selecting}
          >
            <X size={21} />
          </button>
        </div>
        {error && (
          <p role="alert" className="app-error">
            {error}
          </p>
        )}
        {authors.error && (
          <ResourceError message={authors.error} retry={authors.reload} />
        )}
        {selecting ? (
          <p role="status">Caricamento fotografia…</p>
        ) : (
          <MediaLibrary
            assets={library.data}
            authors={authors.data || []}
            loading={library.loading}
            error={library.error}
            onReload={library.reload}
            onSelect={(asset) => void select(asset)}
          />
        )}
      </section>
    </div>
  );
}
