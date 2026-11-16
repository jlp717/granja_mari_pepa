import { Link } from "@/lib/navigation";
import { KageRoute } from "@/components/kage/KageRoute";
import { Chapter } from "@/components/kage/Chapter";
import { WordReveal } from "@/components/kage/WordReveal";
import { getFaqCopy, getUICopy } from "./copy";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import styles from "./editorial.module.css";
export function EditorialFaq({ locale }: { locale: string }) {
  const copy = getFaqCopy(locale);
  const ui = getUICopy(locale);
  return (
    <KageRoute routeId="preguntas-frecuentes" mode="ambient" world="gmp">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: "Preguntas frecuentes", path: "/preguntas-frecuentes" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: copy.groups
              .flatMap((group) => group.questions)
              .map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      {copy.groups.map((group, index) => (
        <Chapter
          key={group.id}
          id={`faq-${group.id}`}
          scene={group.scene}
          title={group.title}
          className={styles.faqSection}
        >
          <div className="sec-head">
            <span className="k">
              {String(index + 1).padStart(2, "0")} — {group.title}
            </span>
            <span className="rule" />
            <Link className="k" href="/contacto" data-cursor>
              {ui.contact}
            </Link>
          </div>
          {index === 0 ? (
            <>
              <WordReveal as="h1" className="display h-sec">
                {copy.title}
              </WordReveal>
              <p className="body-lg" data-rv="up">
                {copy.intro}
              </p>
              <nav
                className={styles.readingNav}
                aria-label={ui.groupNavigation}
              >
                {copy.groups.map((g) => (
                  <a
                    className="arrowlink"
                    href={`#faq-${g.id}`}
                    key={g.id}
                    data-cursor
                  >
                    {g.title}
                  </a>
                ))}
              </nav>
            </>
          ) : (
            <WordReveal as="h2" className="display h-sec">
              {group.title}
            </WordReveal>
          )}
          <p className="body-lg" data-rv="up">
            {group.intro}
          </p>
          <div className={styles.faqGroup}>
            {group.questions.map((q, qi) => (
              <details key={q.question} open={index === 0 && qi === 0}>
                <summary data-cursor>{q.question}</summary>
                <p className="body-lg">{q.answer}</p>
              </details>
            ))}
          </div>
          <div className={styles.actions}>
            <a
              className="arrowlink"
              href={
                copy.groups[index + 1]
                  ? `#faq-${copy.groups[index + 1].id}`
                  : "#faq-gama"
              }
              data-cursor
            >
              {copy.groups[index + 1] ? ui.nextTopic : ui.backToStart}
            </a>
            <Link className="arrowlink" href="/contacto" data-cursor>
              {ui.askTeam}
            </Link>
          </div>
        </Chapter>
      ))}
    </KageRoute>
  );
}
