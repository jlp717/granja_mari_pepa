import { getTranslations } from "next-intl/server";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import { Link } from "@/lib/navigation";
import { LegalIndex } from "./LegalIndex";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import styles from "./editorial.module.css";
const LABELS = {
  es: {
    index: "En esta página",
    top: "Volver al principio",
    next: "Siguiente cláusula",
    previous: "Cláusula anterior",
    navigation: "Navegación del documento",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
  },
  en: {
    index: "On this page",
    top: "Back to top",
    next: "Next clause",
    previous: "Previous clause",
    navigation: "Document navigation",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
  },
  de: {
    index: "Auf dieser Seite",
    top: "Nach oben",
    next: "Nächster Abschnitt",
    previous: "Vorheriger Abschnitt",
    navigation: "Dokumentnavigation",
    privacy: "Datenschutz",
    terms: "Bedingungen",
    contact: "Kontakt",
  },
  it: {
    index: "In questa pagina",
    top: "Torna all’inizio",
    next: "Clausola successiva",
    previous: "Clausola precedente",
    navigation: "Navigazione del documento",
    privacy: "Privacy",
    terms: "Condizioni",
    contact: "Contatto",
  },
  zh: {
    index: "本页内容",
    top: "返回顶部",
    next: "下一条款",
    previous: "上一条款",
    navigation: "文档导航",
    privacy: "隐私政策",
    terms: "条款",
    contact: "联系",
  },
} as const;
export async function EditorialLegal({
  locale,
  kind,
}: {
  locale: string;
  kind: "privacy" | "terms";
}) {
  const t = await getTranslations({ locale, namespace: `legal.${kind}` });
  const labels = LABELS[locale as keyof typeof LABELS] || LABELS.es;
  const length = kind === "privacy" ? 7 : 5;
  const entries = Array.from({ length }, (_, i) => ({
    id: `${kind}-s${i + 1}`,
    title: t(`sections.s${i + 1}.title`),
  }));
  return (
    <GMPRoute routeId={`legal-${kind}`} mode="ambient" world="gmp">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: "Legal", path: "/legal/privacidad" },
          {
            name: kind === "privacy" ? "Privacidad" : "Términos",
            path: kind === "privacy" ? "/legal/privacidad" : "/legal/terminos",
          },
        ]}
      />
      <Chapter
        id={`${kind}-intro`}
        scene={5}
        title={t("title")}
        className="sec"
      >
        <div className="eyebrow">Maripepa</div>
        <WordReveal as="h1" className={`display h-sec ${styles.readingTitle}`}>
          {t("title")}
        </WordReveal>
        <p className={`body-lg ${styles.legalLede}`}>{t("intro")}</p>
        <nav className={styles.readingNav} aria-label={labels.navigation}>
          <Link href="/legal/privacidad" className="arrowlink" data-cursor>
            {labels.privacy}
          </Link>
          <Link href="/legal/terminos" className="arrowlink" data-cursor>
            {labels.terms}
          </Link>
          <Link href="/contacto" className="arrowlink" data-cursor>
            {labels.contact}
          </Link>
        </nav>
      </Chapter>
      <div className={`sec ${styles.readingGrid}`}>
        <LegalIndex label={labels.index} entries={entries} />
        <div className={styles.document}>
          {entries.map((entry, i) => (
            <Chapter
              key={entry.id}
              id={entry.id}
              scene={5}
              title={entry.title}
              as="article"
              className={styles.clause}
            >
              <h2>{entry.title}</h2>
              <p
                className="body-lg"
                dangerouslySetInnerHTML={{
                  __html: t.raw(`sections.s${i + 1}.content`) as string,
                }}
              />
              <nav
                className={styles.readingNav}
                aria-label={`${labels.navigation}: ${entry.title}`}
              >
                <a
                  className="arrowlink"
                  href={i ? `#${entries[i - 1].id}` : `#${kind}-intro`}
                  data-cursor
                >
                  {i ? labels.previous : labels.top}
                </a>
                <a
                  className="arrowlink"
                  href={
                    entries[i + 1] ? `#${entries[i + 1].id}` : `#${kind}-intro`
                  }
                  data-cursor
                >
                  {entries[i + 1] ? labels.next : labels.top}
                </a>
              </nav>
            </Chapter>
          ))}
        </div>
      </div>
    </GMPRoute>
  );
}
