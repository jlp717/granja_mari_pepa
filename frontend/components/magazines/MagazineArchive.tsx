"use client";

import { ArrowUpRight } from "lucide-react";
import { useMagazines } from "./magazine-context";
import styles from "./magazines.module.css";

export function MagazineArchive({ limit = 6 }: { limit?: number }) {
  const { magazines, openMagazine, openLibrary } = useMagazines();

  return (
    <div className={styles.archiveWrap}>
      <div className={styles.archiveList}>
        {magazines.slice(0, limit).map((magazine) => (
          <button
            key={magazine.id}
            type="button"
            className={styles.archiveRow}
            onClick={() => openMagazine(magazine)}
            data-cursor
          >
            <span className={styles.archiveTag}>PDF</span>
            <span className={styles.archiveMeta}>
              <b>{magazine.title}</b>
              <em>{magazine.edition}</em>
            </span>
            <span className={styles.archiveAction}>
              Abrir
              <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.archiveAll} onClick={openLibrary} data-cursor>
        Ver todas las revistas
        <ArrowUpRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
