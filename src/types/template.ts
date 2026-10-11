export type TemplateType = 'cover' | 'agenda' | 'notice';

export interface SlideImage {
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
  posX?: number;  // px offset
  posY?: number;  // px offset
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
}

export interface Project {
  id: string;
  title: string;
  type: 'single' | 'carousel';
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  caption?: string;
  userId?: string;
  revision?: number;
}
