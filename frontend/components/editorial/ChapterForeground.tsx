import { Foreground } from "@/components/kage/Foreground";
import type { KageScene } from "@/components/kage/contracts";

// Decorative atmosphere, not a photograph of GMP premises or operations.
export function ChapterForeground({
  chapterId,
  scene,
}: {
  chapterId: string;
  scene: KageScene;
}) {
  if (scene !== 3 && scene !== 5) return null;
  return (
    <Foreground chapterId={chapterId} name={scene === 3 ? "eternity" : "foot"}>
      {scene === 3 && <span className="fg-el fg-hill" data-fg-in="up" />}
      <span className="fg-el fg-grass" data-fg-in="up" />
    </Foreground>
  );
}
