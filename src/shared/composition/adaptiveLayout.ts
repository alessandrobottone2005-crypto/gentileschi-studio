export interface LayoutWarning {
  field: string;
  level: 'warning' | 'error';
  message: string;
  suggestion?: string;
}

/**
 * Calculates adaptive font size based on text length and bounds
 */
export function calculateAdaptiveFontSize(
  text: string,
  baseSize: number,
  minSize: number,
  thresholdChars: number
): number {
  if (!text) return baseSize;
  const len = text.length;
  if (len <= thresholdChars) return baseSize;

  const excess = len - thresholdChars;
  // Reduce smoothly
  const reduction = Math.min(excess * 0.8, baseSize - minSize);
  return Math.max(minSize, Math.round(baseSize - reduction));
}

/**
 * Checks Cover slide text constraints
 */
export function validateCoverContent(content: { title: string; day: string; month: string; timeSlot: string }): LayoutWarning[] {
  const warnings: LayoutWarning[] = [];
  
  if (content.title.length > 30) {
    warnings.push({
      field: 'title',
      level: 'warning',
      message: 'Il titolo è molto lungo per il cartiglio.',
      suggestion: 'Consigliamo di mantenere il titolo sotto i 25 caratteri o usare un a capo manuale.'
    });
  }

  if (content.month.length > 12) {
    warnings.push({
      field: 'month',
      level: 'warning',
      message: 'Il nome del mese supera la larghezza ottimale.',
      suggestion: 'Abbrevia il mese se necessario (es. "SETTEMBRE" o "NOVEMBRE").'
    });
  }

  return warnings;
}

/**
 * Checks Agenda slide text constraints
 */
export function validateAgendaContent(items: Array<{ text: string }>): LayoutWarning[] {
  const warnings: LayoutWarning[] = [];

  if (items.length > 6) {
    warnings.push({
      field: 'items',
      level: 'warning',
      message: `Hai inserito ${items.length} punti all'O.D.G. La leggibilità potrebbe risentirne.`,
      suggestion: 'Consigliamo di suddividere i punti su una seconda slide carosello.'
    });
  }

  items.forEach((it, idx) => {
    if (it.text.length > 70) {
      warnings.push({
        field: `item-${idx + 1}`,
        level: 'warning',
        message: `Il punto ${idx + 1} è molto lungo (${it.text.length} caratteri).`,
        suggestion: 'Sintetizza la voce per evitare sovrapposizioni visive.'
      });
    }
  });

  return warnings;
}

/**
 * Checks Notice slide text constraints
 */
export function validateNoticeContent(content: { paragraph1: string; paragraph2: string }): LayoutWarning[] {
  const warnings: LayoutWarning[] = [];

  const totalLen = content.paragraph1.length + content.paragraph2.length;
  if (totalLen > 360) {
    warnings.push({
      field: 'paragraphs',
      level: 'warning',
      message: `I paragrafi contengono ${totalLen} caratteri in totale.`,
      suggestion: 'Riduci la lunghezza del testo per garantire la massima leggibilità su Instagram.'
    });
  }

  return warnings;
}
