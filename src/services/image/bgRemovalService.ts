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
    const blob = await removeBackground(imageSource, {
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
