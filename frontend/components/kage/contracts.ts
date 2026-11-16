/** V3 contracts. Source camera chapters: Kage index.html 4034–4103. */
export type KageSceneMode = "journey" | "ambient" | "internal" | "static";
export type KageScene = 0 | 1 | 2 | 3 | 4 | 5;
export type KageWorld = "gmp" | "control" | "careers" | "photo";
export const KAGE_SCENES = {
  threshold: 0,
  cold: 1,
  catalog: 2,
  route: 3,
  table: 4,
  manifesto: 5,
} as const;

export interface KageRouteConfig {
  routeId: string;
  mode: KageSceneMode;
  world?: KageWorld;
}
export interface KageChapterConfig {
  id: string;
  scene: KageScene;
  title?: string;
}
export interface KageSnapshot {
  routeId: string;
  mode: KageSceneMode;
  nativeY: number;
  anchors: readonly number[];
  chapters: readonly KageChapterConfig[];
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
export interface KageRuntimeAPI {
  registerRoute(config: KageRouteConfig, root: HTMLElement): () => void;
  registerChapter(config: KageChapterConfig, root: HTMLElement): () => void;
  subscribe(listener: (snapshot: KageSnapshot) => void): () => void;
  getSnapshot(): KageSnapshot;
  focusChapter(scene: KageScene | null): void;
  navigateToChapter(id: string): void;
  measure(): void;
}
