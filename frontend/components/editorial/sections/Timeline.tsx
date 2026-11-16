import styles from "./Timeline.module.css";

export interface TimelineItem {
  year: string;
  title: string;
  text: string;
}

/** Vertical editorial timeline: large year on the left, thin rule, h3 + body. */
export function Timeline({
  items,
  ariaLabel,
}: {
  items: readonly TimelineItem[];
  ariaLabel?: string;
}) {
  return (
    <ol className={styles.list} aria-label={ariaLabel}>
      {items.map((item) => (
        <li
          className={styles.entry}
          data-rv="up"
          key={`${item.year}-${item.title}`}
        >
          <div className={styles.year}>{item.year}</div>
          <div className={styles.body}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.text}>{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
