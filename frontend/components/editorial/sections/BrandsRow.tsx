import Image from "next/image";
import styles from "./BrandsRow.module.css";

export interface BrandItem {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  href?: string;
}

/** Neutral logo row: transparent PNGs on thin-ruled cells, no shadow cards. */
export function BrandsRow({
  items,
  ariaLabel,
}: {
  items: readonly BrandItem[];
  ariaLabel?: string;
}) {
  return (
    <ul className={styles.row} aria-label={ariaLabel}>
      {items.map((item) => {
        const image = (
          <Image
            className={styles.logo}
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            loading="lazy"
            sizes="(max-width: 820px) 44vw, 20vw"
          />
        );
        return (
          <li className={styles.cell} data-rv="up" key={item.name}>
            {item.href ? (
              <a className={styles.anchor} href={item.href}>
                {image}
              </a>
            ) : (
              image
            )}
          </li>
        );
      })}
    </ul>
  );
}
