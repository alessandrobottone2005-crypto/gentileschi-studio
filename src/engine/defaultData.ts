import { Slide, CoverSlideContent, AgendaSlideContent, NoticeSlideContent, Project } from '../types/template';
import { DEFAULT_IMAGES } from './defaultAssets';

export const DEFAULT_COVER_CONTENT: CoverSlideContent = {
  title: "ASSEMBLEA\nD’ISTITUTO",
  day: "02",
  month: "OTTOBRE",
  timeSlot: "DALLE ORE 10:00\nALLE ORE 13:00",
  image: {
    assetKey: 'cover',
    url: DEFAULT_IMAGES.cover,
    scale: 1,
    posX: 0,
    posY: 0,
  },
};

export const DEFAULT_AGENDA_CONTENT: AgendaSlideContent = {
  title: "O.D.G.",
  subtitle: "ORDINE DEL GIORNO",
  items: [
    { id: '1', number: '01', text: 'Presentazioni Liste e Candidati alle Elezioni.' },
    { id: '2', number: '02', text: 'Benvenuto alle classi prime.' },
    { id: '3', number: '03', text: 'Lettura box proposte nuovo anno' },
    { id: '4', number: '04', text: 'VIAGGIO CLASSI QUINTE', isHighlight: true },
    { id: '5', number: '05', text: 'Varie ed eventuali' },
  ],
  image: {
    assetKey: 'agenda',
    url: DEFAULT_IMAGES.agenda,
    scale: 1,
    posX: 0,
    posY: 0,
  },
};

export const DEFAULT_NOTICE_CONTENT: NoticeSlideContent = {
  title: "IMPORTANTE!",
  highlightQuantity: "2",
  highlightLabel: "STUDENTI\nPER CLASSE",
  badgeText: "NUOVA REGOLA",
  paragraph1: "Quest’anno abbiamo introdotto una NUOVA REGOLA: affinché la prossima assemblea possa svolgersi, è necessario che partecipino ALMENO 2 studenti per classe.",
  paragraph2: "Non è un’imposizione, ma una condizione fondamentale per garantire la partecipazione e portare avanti in modo serio e democratico l’assemblea d’istituto.",
  ctaText: "PARTECIPARE FA LA DIFFERENZA",
  image: {
    assetKey: 'notice',
    url: DEFAULT_IMAGES.notice,
    scale: 1,
    posX: 0,
    posY: 0,
  },
};

export function createDefaultSlide(templateType: 'cover' | 'agenda' | 'notice'): Slide {
  const id = `slide-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  switch (templateType) {
    case 'cover':
      return { id, templateType: 'cover', content: { ...DEFAULT_COVER_CONTENT } };
    case 'agenda':
      return { id, templateType: 'agenda', content: JSON.parse(JSON.stringify(DEFAULT_AGENDA_CONTENT)) };
    case 'notice':
      return { id, templateType: 'notice', content: { ...DEFAULT_NOTICE_CONTENT } };
  }
}

export function createInitialProject(type: 'single' | 'carousel' = 'carousel'): Project {
  return {
    id: `proj-${Date.now()}`,
    title: "Assemblea d'Istituto - Ottobre",
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slides: type === 'carousel'
      ? [
          createDefaultSlide('cover'),
          createDefaultSlide('agenda'),
          createDefaultSlide('notice')
        ]
      : [createDefaultSlide('cover')],
    caption: "📢 Assemblea d'Istituto — Liceo Gentileschi!\n\n📅 Martedì 2 Ottobre | Dalle 10:00 alle 13:00\n\nDiscuteremo dei punti all'ordine del giorno e delle novità per l'anno scolastico. Ricordiamo l'importanza della partecipazione di almeno 2 rappresentanti per classe!\n\nNon mancate! 🔥\n\n#LiceoGentileschi #AssembleaDiIstituto #StudentiNapoli",
  };
}
