import type { TemplateType } from '../types/template';
import coverImage from '../../assets/figma/gentileschi-statue.png';
import agendaImage from '../../assets/figma/airplane-trip.png';
import noticeImage from '../../assets/figma/students-group.png';
import coverThumbnail from '../../assets/figma/reference-4_2758.png';
import agendaThumbnail from '../../assets/figma/reference-4_2791.png';
import noticeThumbnail from '../../assets/figma/reference-4_2838.png';

export const DEFAULT_IMAGES: Record<TemplateType, string> = {
  cover: coverImage,
  agenda: agendaImage,
  notice: noticeImage,
};

export const TEMPLATE_THUMBNAILS: Record<TemplateType, string> = {
  cover: coverThumbnail,
  agenda: agendaThumbnail,
  notice: noticeThumbnail,
};

export function legacyDefaultImageKey(url?: string): TemplateType | undefined {
  if (!url) return undefined;
  if (url.includes('gentileschi-statue')) return 'cover';
  if (url.includes('airplane-trip')) return 'agenda';
  if (url.includes('students-group')) return 'notice';
  return undefined;
}
