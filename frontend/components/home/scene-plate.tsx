import Image from "next/image";
import { Foreground } from "@/components/kage/Foreground";
import styles from "./scene-plate.module.css";

export const SCENE_POSTERS = [
  "/kage/careers/careers-03.jpg",
  "/catalogs/familias/real-mar-1.jpg",
  "/catalogs/familias/real-carne-1.jpg",
  "/kage/careers/careers-04.jpg",
  "/catalogs/familias/real-reposteria-1.jpg",
] as const;

/** Decorative, complete SSR fallback. Only a live GL world may hide it. */
export function ScenePlate({
  scene,
  priority = false,
}: {
  scene: 0 | 1 | 2 | 3 | 4;
  priority?: boolean;
}) {
  return (
    <div className={styles.plate} data-scene-fallback aria-hidden="true">
      <Image
        src={SCENE_POSTERS[scene]}
        alt=""
        fill
        sizes="100vw"
        priority={priority}
      />
    </div>
  );
}
export function BrandFallback() {
  return (
    <div className={styles.brand} aria-hidden="true">
      <Image
        src="/kage/brand/logo-alpha.png"
        alt=""
        width={600}
        height={182}
        unoptimized
      />
    </div>
  );
}

/** Foreground stages follow Kage's slot grammar. No chapter keeps a near
 *  plane any more: the cutouts were photographic plates rather than isolated
 *  objects, so at stage size they laid a hard top edge across the frame and
 *  sat under the copy. The live hall carries the chapters, which is what Kage
 *  lets the temple do. */
const FG_SIZE: Record<string, readonly [number, number]> = {
  "02-frio": [2200, 980],
  "03-catalogo": [2200, 1180],
  "04-ruta-hill": [2200, 897],
  "04-ruta-scrub": [2200, 1478],
  "05-mesa": [2200, 673],
};

const SCENE_LAYER: Record<
  number,
  { name: string; slots: readonly { cls: string; file: string }[] }
> = {
  0: {
    name: "gate",
    slots: [],
  },
  1: {
    name: "pathways",
    slots: [],
  },
  2: {
    name: "lessons",
    slots: [],
  },
  3: {
    name: "eternity",
    slots: [],
  },
  4: {
    name: "foot",
    slots: [],
  },
};

export function HomeForeground({
  chapter,
  scene,
}: {
  chapter: string;
  scene: 0 | 1 | 2 | 3 | 4;
}) {
  const layer = SCENE_LAYER[scene];
  return (
    <Foreground chapterId={chapter} name={layer.name}>
      {layer.slots.map((slot) => {
        const [w, h] = FG_SIZE[slot.file];
        return (
          <span key={slot.cls} className={`fg-el ${slot.cls}`} data-fg-in="up">
            <Image
              src={"/kage/mp/fg/" + slot.file + ".webp"}
              alt=""
              width={w}
              height={h}
              loading="lazy"
              unoptimized
            />
          </span>
        );
      })}
    </Foreground>
  );
}
