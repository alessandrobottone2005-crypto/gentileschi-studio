import type {
  GraphicTheme,
  ProjectFormat,
  SlideScene,
  ThemeReference,
} from "./scene";
export type TemplateType = "cover" | "agenda" | "notice";

export interface SlideImage {
  assetId?: string;
  originalAssetId?: string;
  cutoutStoragePath?: string;
  cutoutUrl?: string;
  source?: { provider: 'pixabay'; id: number; author: string; pageUrl: string };
  effects?: PhotoEffects;
  crop?: { scale: number; x: number; y: number };
  // Runtime URLs are never written to project storage.
  url?: string;
  originalUrl?: string;
  storagePath?: string;
  originalStoragePath?: string;
  assetKey?: TemplateType;
  originalAssetKey?: TemplateType;
  missing?: boolean;
  isTransparent?: boolean;
  scale?: number; // default 1
  posX?: number; // px offset
  posY?: number; // px offset
}

export interface PhotoEffects {
  version: 1;
  enabled: boolean;
  grayscale: boolean;
  contrast: number;
  halftone: number;
  outline: number;
  outlineColor: string;
  shadow: number;
  shadowColor: string;
}

export interface CoverSlideContent {
  title: string;
  day: string;
  month: string;
  timeSlot: string;
  image?: SlideImage;
}

export interface AgendaItem {
  id: string;
  number: string;
  text: string;
  isHighlight?: boolean;
}

export interface AgendaSlideContent {
  title: string;
  subtitle: string;
  items: AgendaItem[];
  image?: SlideImage;
}

export interface NoticeSlideContent {
  title: string;
  highlightQuantity: string;
  highlightLabel: string;
  badgeText: string;
  paragraph1: string;
  paragraph2: string;
  ctaText: string;
  image?: SlideImage;
}

export type SlideContentMap = {
  cover: CoverSlideContent;
  agenda: AgendaSlideContent;
  notice: NoticeSlideContent;
};

export interface Slide<T extends TemplateType = TemplateType> {
  id: string;
  templateType: T;
  content: SlideContentMap[T];
  scene?: SlideScene;
  customFields?: Record<string, string>;
  projectSettings?: {
    format?: ProjectFormat;
    themeRef?: ThemeReference;
    themeSnapshot?: GraphicTheme;
  };
}

export interface Project {
  id: string;
  title: string;
  type: "single" | "carousel";
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  caption?: string;
  userId?: string;
  revision?: number;
  format?: ProjectFormat;
  themeRef?: ThemeReference;
  themeSnapshot?: GraphicTheme;
}
