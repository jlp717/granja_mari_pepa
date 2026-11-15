import Image from "next/image";
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
  if (scene === 3 || scene === 5)
    return (
      <Foreground
        chapterId={chapterId}
        name={scene === 3 ? "eternity" : "foot"}
      >
        {scene === 3 && (
          <span className="fg-el fg-hill" data-fg-in="up" />
        )}
        <span className="fg-el fg-grass" data-fg-in="up" />
      </Foreground>
    );
  const source = {
    0: "01-umbral",
    1: "02-frio",
    2: "03-catalogo",
    4: "05-mesa",
  }[scene];
  const right = scene === 2 || scene === 4;
  return (
    <Foreground
      chapterId={chapterId}
      name={right ? "gmp-low-right" : "gmp-low-left"}
    >
      <span className="fg-el fg-gmp-low" data-fg-in="up">
        <Image
          src={`/kage/mp/fg/${source}.webp`}
          alt=""
          width={1536}
          height={1024}
          loading="lazy"
          unoptimized
        />
      </span>
    </Foreground>
  );
}
