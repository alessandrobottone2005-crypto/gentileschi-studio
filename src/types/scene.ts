import type { CSSProperties } from "react";
import type { Slide, SlideImage } from "./template";

export type ProjectFormat = "portrait" | "square" | "story";
export const FORMATS: Record<
  ProjectFormat,
  { width: number; height: number; label: string }
> = {
  portrait: { width: 1080, height: 1350, label: "Post 4:5" },
  square: { width: 1080, height: 1080, label: "Quadrato" },
  story: { width: 1080, height: 1920, label: "Story 9:16" },
};
export type NodeStyle = Pick<
  CSSProperties,
  | "backgroundColor"
  | "backgroundImage"
  | "backgroundSize"
  | "boxShadow"
  | "filter"
  | "borderRadius"
  | "border"
  | "overflow"
  | "color"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing"
  | "textAlign"
  | "textTransform"
  | "whiteSpace"
  | "objectFit"
  | "objectPosition"
  | "transformOrigin"
>;
export interface SceneNode {
  id: string;
  name: string;
  kind: "text" | "image" | "vector" | "shape" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  orderIndex?: number;
  scale?: number;
  baseTransform?: string;
  imageTransformOrigin?: string;
  opacity: number;
  visible: boolean;
  locked: boolean;
  style: NodeStyle;
  text?: string;
  binding?: string;
  media?: SlideImage & { assetId?: string };
  children?: SceneNode[];
  agendaItemId?: string;
  agendaRole?: string;
  agendaContext?: string;
  autoStyle?: "legacy" | "theme";
  editedStyle?: boolean;
  overrides?: string[];
  added?: boolean;
}
export interface SlideScene {
  version: 1;
  width: number;
  height: number;
  background: string;
  backgroundModified?: boolean;
  nodes: SceneNode[];
  agendaPrototype?: SceneNode;
  agendaContainerId?: string;
  agendaGap?: number;
  agendaStyles?: { normal: Partial<Record<string, NodeStyle>>; highlight: Partial<Record<string, NodeStyle>> };
  deletedItemIds?: string[];
  removedKeys?: string[];
}
export interface ThemeReference {
  id: string;
  name: string;
  revision?: number;
}
export interface GraphicTheme {
  id: string;
  name: string;
  official: boolean;
  revision?: number;
  creatorId?: string;
  format: ProjectFormat;
  slides: Slide[];
  updatedAt?: string;
}
