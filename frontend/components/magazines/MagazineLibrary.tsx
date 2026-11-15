"use client";

import { X } from "lucide-react";
import type { NavMagazine } from "@/lib/use-public-magazines";
import styles from "./magazines.module.css";

export function MagazineLibrary({
  magazines,
  onClose,
  onSelect,
}: {
  magazines: NavMagazine[];
  onClose: () => void;
  onSelect: (magazine: NavMagazine) => void;
}) {
  return (
    <div
      className={styles.libraryLayer}
      role="dialog"
      aria-modal="true"
      aria-label="Todas las revistas"
    >
      <header className={styles.libraryHead}>
        <div>
          <span className={styles.kicker}>Hemeroteca</span>
          <h2>Todas las revistas</h2>
          <p>
            {magazines.length} ediciones disponibles. Elige una para abrirla en el visor.
          </p>
        </div>
        <button
          type="button"
          autoFocus
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar revistas"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.libraryGrid}>
        {magazines.map((magazine) => (
          <button
            key={magazine.id}
            type="button"
            className={styles.libraryCard}
            onClick={() => onSelect(magazine)}
          >
            <span className={styles.libraryCover}>
              {magazine.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- portada generada desde el PDF
                <img src={magazine.coverUrl} alt="" loading="lazy" />
              ) : (
                <span className={styles.libraryPlaceholder}>{magazine.edition}</span>
              )}
            </span>
            <span className={styles.libraryMeta}>
              <b>{magazine.title}</b>
              <em>{magazine.edition}</em>
              {magazine.description ? <small>{magazine.description}</small> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
