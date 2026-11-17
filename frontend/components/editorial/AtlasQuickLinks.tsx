import { Link } from "@/lib/navigation";
import type { UICopy } from "./types";
import styles from "./editorial.module.css";

function Arrow() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** GMP curriculum B: compact index of real destinations. */
export function AtlasQuickLinks({
  ui,
  label,
  variant = "default",
}: {
  ui: UICopy;
  label?: string;
  variant?: "default" | "quality";
}) {
  const links = [
    {
      href: "/productos",
      title: ui.browseRange,
      text: ui.rangeDetail,
    },
    {
      href: "/preguntas-frecuentes",
      title: ui.findAnswer,
      text: ui.questionsDetail,
    },
    {
      href: "/contacto",
      title: ui.prepareInquiry,
      text: ui.contactDetail,
    },
    {
      href: "/calidad",
      title: ui.understandInformation,
      text: ui.qualityDetail,
    },
    variant === "quality"
      ? {
          href: "/reparto",
          title: ui.qualityContext,
          text: ui.qualityContextDetail,
        }
      : {
          href: "/reparto",
          title: ui.askService,
          text: ui.serviceDetail,
        },
  ];
  return (
    <nav className={styles.atlasLinks} aria-label={label ?? ui.atmosphereLabel}>
      {links.map((link, index) => (
        <Link className={styles.atlasLink} href={link.href} data-cursor key={link.href}>
          <span className={styles.atlasIndex}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.atlasTitle}>{link.title}</span>
          <span className={styles.atlasText}>{link.text}</span>
          <span className={styles.atlasArrow}>
            <Arrow />
          </span>
        </Link>
      ))}
    </nav>
  );
}
