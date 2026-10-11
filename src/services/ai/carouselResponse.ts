import { formatDateToItalian } from '../../engine/dateUtils.js';
import { AiGeneratedCarouselResponseSchema, INVALID_CAROUSEL_MESSAGE } from './schemas.js';

type JsonSchema = Record<string, unknown>;
type ValidationIssue = { code: string; path: (string | number)[] };
const text = { type: 'string' };

function object(properties: Record<string, JsonSchema>, required = Object.keys(properties)): JsonSchema {
  return { type: 'object', properties, required, additionalProperties: false };
}

/** Schema supported by Gemini; application validation still checks text lengths. */
export function carouselResponseSchema(eventDate: string): JsonSchema {
  const { day, month } = formatDateToItalian(eventDate);
  const cover = object({
    templateType: { type: 'string', enum: ['cover'] },
    content: object({ title: text, day: { type: 'string', enum: [day] }, month: { type: 'string', enum: [month] }, timeSlot: text }),
  });
  const agenda = object({
    templateType: { type: 'string', enum: ['agenda'] },
    content: object({
      title: text, subtitle: text,
      items: { type: 'array', minItems: 1, maxItems: 8, items: object({ id: text, number: text, text, isHighlight: { type: 'boolean' } }) },
    }),
  });
  const notice = object({
    templateType: { type: 'string', enum: ['notice'] },
    content: object({ title: text, highlightQuantity: text, highlightLabel: text, badgeText: text, paragraph1: text, paragraph2: text, ctaText: text }),
  });
  return object({
    projectTitle: text,
    slides: { type: 'array', minItems: 1, items: { anyOf: [cover, agenda, notice] } },
    missingInformation: { type: 'array', items: text },
    caption: text,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The selected date, not model output, is authoritative on every cover. */
export function applyEventDate(value: unknown, eventDate: string): unknown {
  if (!isRecord(value) || !Array.isArray(value.slides)) return value;
  const date = formatDateToItalian(eventDate);
  return {
    ...value,
    slides: value.slides.map((slide) => isRecord(slide) && slide.templateType === 'cover' && isRecord(slide.content)
      ? { ...slide, content: { ...slide.content, ...date } }
      : slide),
  };
}

export class InvalidCarouselResponseError extends Error {
  constructor() { super(INVALID_CAROUSEL_MESSAGE); }
}

export async function generateValidCarousel(
  prompt: string,
  eventDate: string,
  generate: (prompt: string, schema: JsonSchema) => Promise<string>,
) {
  const schema = carouselResponseSchema(eventDate);
  let currentPrompt = prompt;
  for (let attempt = 1; attempt <= 2; attempt++) {
    // Provider failures are handled separately; only malformed output is repaired.
    const rawText = await generate(currentPrompt, schema);
    let issues: ValidationIssue[] = [];
    let json: unknown;
    try {
      const trimmed = rawText.trim();
      const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      json = JSON.parse(match ? match[1] : trimmed);
    } catch {
      issues = [{ code: 'invalid_json', path: [] }];
    }
    if (issues.length === 0) {
      const parsed = AiGeneratedCarouselResponseSchema.safeParse(applyEventDate(json, eventDate));
      if (parsed.success) return parsed.data;
      issues = parsed.error.issues.map(({ code, path }) => ({ code, path }));
    }
    // Log structural diagnostics only, never the generated text, prompt or credentials.
    console.warn('AI carousel validation failed', { attempt, issues });
    currentPrompt = `${prompt}\n\nIl tentativo precedente non era valido. Rigenera la bozza completa rispettando lo schema. Correggi questi vincoli: ${JSON.stringify(issues)}. Tutti i testi richiesti devono essere non vuoti.`;
  }
  throw new InvalidCarouselResponseError();
}
