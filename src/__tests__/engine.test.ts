import { describe, it, expect } from 'vitest';
import {
  calculateAdaptiveFontSize,
  validateCoverContent,
  validateAgendaContent,
  validateNoticeContent,
} from '../engine/adaptiveLayout';
import { formatDateToItalian } from '../engine/dateUtils';
import { formatProjectSlug } from '../services/export/exportEngine';
import { TEMPLATE_REGISTRY } from '../templates/registry';
import { createDefaultSlide, createInitialProject } from '../engine/defaultData';
import { AiGeneratedCarouselResponseSchema } from '../services/ai/schemas';

describe('Adaptive Layout Engine', () => {
  it('calcola correttamente la dimensione adattiva del font per testi brevi e lunghi', () => {
    const base = 128;
    const min = 80;
    const threshold = 20;

    // Testo breve -> mantiene dimensione base
    const shortText = 'ASSEMBLEA';
    expect(calculateAdaptiveFontSize(shortText, base, min, threshold)).toBe(base);

    // Testo lungo -> riduce dimensione
    const longText = 'ASSEMBLEA D’ISTITUTO STRAORDINARIA DEL LICEO';
    const scaled = calculateAdaptiveFontSize(longText, base, min, threshold);
    expect(scaled).toBeLessThan(base);
    expect(scaled).toBeGreaterThanOrEqual(min);
  });

  it('valida i vincoli del template Cover e genera avvisi appropriati', () => {
    const valid = validateCoverContent({
      title: 'ASSEMBLEA',
      day: '02',
      month: 'OTTOBRE',
      timeSlot: '10:00 - 13:00',
    });
    expect(valid).toHaveLength(0);

    const longTitle = validateCoverContent({
      title: 'ASSEMBLEA GENERALE STRAORDINARIA DI TUTTE LE CLASSI DEL LICEO',
      day: '02',
      month: 'OTTOBRE',
      timeSlot: '10:00 - 13:00',
    });
    expect(longTitle.length).toBeGreaterThan(0);
    expect(longTitle[0].field).toBe('title');
  });

  it('valida i vincoli del template Agenda per numero di punti e lunghezza', () => {
    const sixItems = [
      { text: 'Punto 1' },
      { text: 'Punto 2' },
      { text: 'Punto 3' },
      { text: 'Punto 4' },
      { text: 'Punto 5' },
      { text: 'Punto 6' },
      { text: 'Punto 7' },
    ];
    const warnings = validateAgendaContent(sixItems);
    expect(warnings.some((w) => w.field === 'items')).toBe(true);
  });

  it('valida i vincoli del template Notice per la lunghezza dei paragrafi', () => {
    const shortNotice = validateNoticeContent({
      paragraph1: 'Regola semplice',
      paragraph2: 'Partecipate numerosi',
    });
    expect(shortNotice).toHaveLength(0);

    const longNotice = validateNoticeContent({
      paragraph1: 'A'.repeat(250),
      paragraph2: 'B'.repeat(200),
    });
    expect(longNotice.length).toBeGreaterThan(0);
  });
});

describe('Date Utilities (Italian Localization)', () => {
  it('converte date YYYY-MM-DD in formato italiano maiuscolo e giorno a 2 cifre', () => {
    expect(formatDateToItalian('2026-10-02')).toEqual({ day: '02', month: 'OTTOBRE' });
    expect(formatDateToItalian('2026-11-20')).toEqual({ day: '20', month: 'NOVEMBRE' });
    expect(formatDateToItalian('2026-05-09')).toEqual({ day: '09', month: 'MAGGIO' });
  });
});

describe('Template Registry & Project Factory', () => {
  it('include tutti e 3 i template ufficiali Figma', () => {
    expect(TEMPLATE_REGISTRY.cover).toBeDefined();
    expect(TEMPLATE_REGISTRY.agenda).toBeDefined();
    expect(TEMPLATE_REGISTRY.notice).toBeDefined();
  });

  it('crea slide con dati predefiniti validi', () => {
    const slideCover = createDefaultSlide('cover');
    expect(slideCover.templateType).toBe('cover');
    expect(slideCover.content.title).toContain('ASSEMBLEA');

    const slideAgenda = createDefaultSlide('agenda');
    expect(slideAgenda.templateType).toBe('agenda');
    expect(slideAgenda.content.items).toHaveLength(5);

    const slideNotice = createDefaultSlide('notice');
    expect(slideNotice.templateType).toBe('notice');
    expect(slideNotice.content.highlightQuantity).toBe('2');
  });

  it('crea un progetto carosello completo con slide ordinate', () => {
    const proj = createInitialProject('carousel');
    expect(proj.slides).toHaveLength(3);
    expect(proj.slides[0].templateType).toBe('cover');
    expect(proj.slides[1].templateType).toBe('agenda');
    expect(proj.slides[2].templateType).toBe('notice');
  });
});

describe('Export Pipeline Naming', () => {
  it('genera slug puliti per i file esportati', () => {
    expect(formatProjectSlug('Assemblea 20 Novembre 2026')).toBe('assemblea-20-novembre-2026');
    expect(formatProjectSlug("Assemblea d'Istituto!")).toBe('assemblea-distituto');
  });
});

describe('AI Zod Schemas Validation', () => {
  it('valida correttamente la risposta strutturata del carosello AI', () => {
    const sampleAiOutput = {
      projectTitle: "Assemblea d'Istituto 20 Novembre",
      slides: [
        {
          templateType: 'cover',
          content: {
            title: 'ASSEMBLEA GENERALE',
            day: '20',
            month: 'NOVEMBRE',
            timeSlot: '10:00 - 13:00',
          },
        },
        {
          templateType: 'agenda',
          content: {
            title: 'O.D.G.',
            subtitle: 'ORDINE DEL GIORNO',
            items: [
              { id: '1', number: '01', text: 'Attività natalizie' },
              { id: '2', number: '02', text: 'Proposte studenti' },
            ],
          },
        },
      ],
      missingInformation: ['Orario di fine confermato provvisoriamente alle 13:00'],
      caption: 'Vi aspettiamo al Gentileschi! #LiceoGentileschi',
    };

    const parsed = AiGeneratedCarouselResponseSchema.safeParse(sampleAiOutput);
    expect(parsed.success).toBe(true);
  });
});
