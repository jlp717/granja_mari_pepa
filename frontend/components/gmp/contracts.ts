/** V3 contracts. Source camera chapters: GMP index.html 4034–4103. */
export type GMPSceneMode = "journey" | "ambient" | "internal" | "static";
export type GMPScene = 0 | 1 | 2 | 3 | 4 | 5;
export type GMPWorld = "gmp" | "control" | "careers" | "photo";
export const GMP_SCENES = {
  threshold: 0,
  cold: 1,
  catalog: 2,
  route: 3,
  table: 4,
  manifesto: 5,
} as const;

export interface GMPRouteConfig {
  routeId: string;
  mode: GMPSceneMode;
  world?: GMPWorld;
}
export interface GMPChapterConfig {
  id: string;
  scene: GMPScene;
  title?: string;
}
export interface GMPSnapshot {
  routeId: string;
  mode: GMPSceneMode;
  nativeY: number;
  anchors: readonly number[];
  chapters: readonly GMPChapterConfig[];
  sceneProgress: number;
  smoothedProgress: number;
  railIndex: number;
  foregroundOwner: string | null;
  pointerNDC: readonly [number, number];
  reducedMotion: boolean;
  qualityScale: number;
  bootProgress: number;
  ready: boolean;
  visible: boolean;
  fallback: boolean;
}
export interface GMPRuntimeAPI {
  registerRoute(config: GMPRouteConfig, root: HTMLElement): () => void;
  registerChapter(config: GMPChapterConfig, root: HTMLElement): () => void;
  subscribe(listener: (snapshot: GMPSnapshot) => void): () => void;
  getSnapshot(): GMPSnapshot;
  focusChapter(scene: GMPScene | null): void;
  navigateToChapter(id: string): void;
  measure(): void;
}
