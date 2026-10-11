import { z } from 'zod';

export const CoverContentSchema = z.object({
  title: z.string().min(1),
  day: z.string().min(1).max(4),
  month: z.string().min(1),
  timeSlot: z.string().min(1),
});

export const AgendaItemSchema = z.object({
  id: z.string(),
  number: z.string(),
  text: z.string().min(1),
  isHighlight: z.boolean().optional(),
});

export const AgendaContentSchema = z.object({
  title: z.string().default('O.D.G.'),
  subtitle: z.string().default('ORDINE DEL GIORNO'),
  items: z.array(AgendaItemSchema).min(1).max(8),
});

export const NoticeContentSchema = z.object({
  title: z.string().default('IMPORTANTE!'),
  highlightQuantity: z.string().min(1),
  highlightLabel: z.string().min(1),
  badgeText: z.string().default('NUOVA REGOLA'),
  paragraph1: z.string().min(1),
  paragraph2: z.string().min(1),
  ctaText: z.string().default('PARTECIPARE FA LA DIFFERENZA'),
});

export const GeneratedSlideSchema = z.discriminatedUnion('templateType', [
  z.object({
    templateType: z.literal('cover'),
    content: CoverContentSchema,
  }),
  z.object({
    templateType: z.literal('agenda'),
    content: AgendaContentSchema,
  }),
  z.object({
    templateType: z.literal('notice'),
    content: NoticeContentSchema,
  }),
]);

export const AiGeneratedCarouselResponseSchema = z.object({
  projectTitle: z.string(),
  slides: z.array(GeneratedSlideSchema).min(1),
  missingInformation: z.array(z.string()).default([]),
  caption: z.string(),
});

export type AiGeneratedCarouselResponse = z.infer<typeof AiGeneratedCarouselResponseSchema>;
