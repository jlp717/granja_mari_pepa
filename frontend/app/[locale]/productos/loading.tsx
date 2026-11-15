"use client";
import { useLocale } from "next-intl";
import styles from "@/components/kage/catalogue/catalogue.module.css";
import { getCatalogueStateCopy } from "@/components/kage/catalogue/state-copy";
export default function CatalogueLoading() {
  const copy = getCatalogueStateCopy(useLocale());
  return (
    <section
      className="sec"
      aria-busy="true"
      role="status"
      data-fx="route-loader"
    >
      <p className="body-lg">{copy.loading}</p>
      <div className={styles.loader} aria-hidden="true">
        <i />
      </div>
    </section>
  );
}
