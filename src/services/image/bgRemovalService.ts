import { removeBackground } from '@imgly/background-removal';

export interface BgRemovalProgress {
  phase: string;
  progress: number;
}

/**
 * Executes client-side background removal using WASM/ONNX
 */
export async function removeImageBackground(
  imageSource: string | File | Blob,
  onProgress?: (p: BgRemovalProgress) => void
): Promise<string> {
  try {
    // The model library resolves relative strings against its own module URL.
    // Decode a Blob first so local assets and private-bucket URLs behave alike.
    let input: File | Blob = imageSource as File | Blob;
    if (typeof imageSource === 'string') {
      const response = await fetch(new URL(imageSource, window.location.href));
      if (!response.ok) throw new Error('La fotografia non è disponibile.');
      input = await response.blob();
    }
    const blob = await removeBackground(input, {
      model: 'isnet_quint8',
      progress: (key: string, current: number, total: number) => {
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        onProgress?.({
          phase: key,
          progress: percent,
        });
      },
      debug: false,
    });

    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error('Errore durante la rimozione dello sfondo:', error);
    throw new Error(
      `Rimozione sfondo fallita: ${error.message || 'Errore elaborazione locale'}. Puoi caricare direttamente un PNG con sfondo trasparente.`
    );
  }
}
