export type StudioRole = 'admin' | 'editor';
export interface Profile {
  id: string;
  displayName: string;
  googleName: string;
  email: string;
  avatarUrl: string | null;
  role: StudioRole;
  createdAt: string;
}
export interface Author {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}
export interface MediaAsset {
  source?: import('./template').SlideImage['source'];
  id: string;
  name: string;
  originalName: string;
  ownerId: string | null;
  size: number;
  mimeType: string;
  createdAt: string | null;
  storagePath: string;
  previewUrl: string | null;
}
export interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
  available: number;
  resetsAt: string;
}
export type StudioView =
  | 'overview'
  | 'projects'
  | 'library'
  | 'account'
  | 'users';
