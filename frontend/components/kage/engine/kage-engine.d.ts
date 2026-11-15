export interface KageEngine {
  dispose(): void;
  pause(): void;
  resume(): void;
  resize(): void;
  refresh(): void;
  setReducedMotion(value: boolean): void;
  focus(value: number | null): void;
  diagnostics?(): Record<string, unknown>;
}
export interface KageEngineOptions {
  THREE: unknown;
  canvas: HTMLCanvasElement;
  world: "control" | "gmp" | "careers" | "photo";
  logoUrl?: string;
  wordmarkFamily?: string;
  signal: AbortSignal;
  getRoot(): HTMLElement | null;
  getSections(): HTMLElement[];
  getProgress(): number;
  getPointer(): readonly [number, number];
  onFrame?(state: { smooth: number; scale: number }): void;
  onLoad?(progress: number): void;
  onLost?(): void;
  onAssetError?(url: string): void;
}
export function createKageEngine(
  options: KageEngineOptions,
): Promise<KageEngine>;
