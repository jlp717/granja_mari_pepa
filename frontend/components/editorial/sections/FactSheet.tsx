import styles from "./FactSheet.module.css";

export interface FactItem {
  label: string;
  value: string;
  note?: string;
  href?: string;
}

/** Editorial fact grid: semantic <dl>, thin rules, small uppercase label + big value. */
export function FactSheet({
  items,
  ariaLabel,
}: {
  items: readonly FactItem[];
  ariaLabel?: string;
}) {
  return (
    <dl className={styles.grid} aria-label={ariaLabel}>
      {items.map((item, index) => (
        <div
          className={styles.item}
          data-rv="up"
          key={`${item.label}-${index}`}
        >
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>
            {item.href ? (
              <a className={styles.link} href={item.href}>
                {item.value}
              </a>
            ) : (
              item.value
            )}
            {item.note ? (
              <span className={styles.note}>{item.note}</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
