import { AtlasQuickLinks } from "./AtlasQuickLinks";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import type { EditorialStoryId } from "./content.es";
import { getStoryCopy, getUICopy, getContactCopy } from "./copy";
import { EDITORIAL_FACTS, gmailCompose } from "./facts";
import { FactSheet } from "./sections/FactSheet";
import { Timeline } from "./sections/Timeline";
import { BrandsRow } from "./sections/BrandsRow";
import styles from "./editorial.module.css";

const STORY_PATHS: Record<EditorialStoryId, string> = {
  acerca: "/acerca",
  lorca: "/lorca",
  calidad: "/calidad",
  reparto: "/reparto",
};
const STORY_NAMES: Record<EditorialStoryId, string> = {
  acerca: "Quiénes somos",
  lorca: "Lorca",
  calidad: "Calidad",
  reparto: "Reparto",
};

function Arrow() {
  return (
    <span className="ar" aria-hidden="true">
      <svg viewBox="0 0 14 14" fill="none">
        <path d="M3 11 11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </span>
  );
}

export function EditorialStory({
  storyId,
  locale,
}: {
  storyId: EditorialStoryId;
  locale: string;
}) {
  const page = getStoryCopy(storyId, locale);
  const ui = getUICopy(locale);
  const contactCopy = getContactCopy(locale);
  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[{ name: STORY_NAMES[storyId], path: STORY_PATHS[storyId] }]}
      />
      <GMPRoute routeId={storyId} mode="journey" world="gmp">
        {page.chapters.map((chapter, index) => {
          const kind = chapter.layout;
          const id = `${storyId}-${chapter.id}`;
          const nextId = page.chapters[index + 1]
            ? `${storyId}-${page.chapters[index + 1].id}`
            : `${storyId}-manifiesto`;
          const heading = index === 0 ? page.title : chapter.title;
          const title = (
            <WordReveal
              as={index === 0 ? "h1" : "h2"}
              className={`display ${kind === "hero" ? "h-hero" : "h-sec"} ${index === 0 && kind === "spread" ? styles.storyH1 : ""}`}
            >
              {heading}
            </WordReveal>
          );
          const controls = (
            <div className={styles.actions}>
              <a className="arrowlink" href={`#${nextId}`} data-cursor>
                <span>{ui.nextChapter}</span>
                <Arrow />
              </a>
              <Link className="arrowlink" href="/contacto" data-cursor>
                <span>{ui.askTeam}</span>
                <Arrow />
              </Link>
            </div>
          );
          return (
            <Chapter
              key={id}
              id={id}
              scene={chapter.scene}
              title={chapter.label}
              className={
                kind === "hero" ? "hero" : kind === "closing" ? "fin" : ""
              }
            >
              {kind === "hero" ? (
                <>
                  <div className="hero-top">
                    <div className="eyebrow" data-rv="fade">
                      <span className="dot" />
                      {page.eyebrow}
                    </div>
                    {title}
                    <p className="hero-sub body" data-rv="up">
                      {page.description}
                    </p>
                  </div>
                  <div className="hero-spacer" />
                  <div className="hero-foot">
                    <div className={styles.heroCopy}>
                      {chapter.paragraphs.map((p) => (
                        <p className="body-lg" data-rv="up" key={p}>
                          {p}
                        </p>
                      ))}
                      {controls}
                    </div>
                    <nav className="chapters" aria-label={ui.chapterNavigation}>
                      {page.chapters.slice(1, 5).map((c, i) => (
                        <a
                          key={c.id}
                          className="chip"
                          href={`#${storyId}-${c.id}`}
                          data-cursor
                        >
                          <span className="num">
                            {String(i + 2).padStart(2, "0")}
                          </span>
                          <span className="tx">
                            <b>{c.label}</b>
                            <span>{c.title}</span>
                          </span>
                        </a>
                      ))}
                    </nav>
                  </div>
                </>
              ) : (
                <>
                  <div className="sec-head" data-rv="fade">
                    <span className="k">
                      <b>{String(index + 1).padStart(2, "0")}</b> —{" "}
                      {chapter.label}
                    </span>
                    <span className="rule" />
                    <a
                      className="k"
                      href={`#${storyId}-${page.chapters[0].id}`}
                      data-cursor
                    >
                      {ui.start}
                    </a>
                  </div>
                  {kind === "spread" && (
                    <div className="gate-grid">
                      {title}
                      <div className="gate-copy">
                        {chapter.paragraphs.map((p, i) => (
                          <p
                            className={i === 0 ? "lead" : "body"}
                            data-rv="up"
                            key={p}
                          >
                            {p}
                          </p>
                        ))}
                        {controls}
                      </div>
                    </div>
                  )}
                  {kind === "atlas" && (
                    <>
                      <div className="cur-head">
                        {title}
                        <p className="body-lg" data-rv="up">
                          {chapter.paragraphs[0]}
                        </p>
                      </div>
                      <div className={styles.atlasText}>
                        <p className="body-lg" data-rv="up">
                          {chapter.paragraphs[1]}
                        </p>
                      </div>
                      <AtlasQuickLinks ui={ui} label={chapter.label} />
                      {controls}
                    </>
                  )}
                  {kind === "gallery" && (
                    <>
                      <div className="cur-head">
                        {title}
                        <p className="body-lg" data-rv="up">
                          {chapter.paragraphs[0]}
                        </p>
                      </div>
                      <div className="cards">
                        {(chapter.shots ?? []).map((shot, i) => (
                          <Link
                            className="card"
                            data-view={i}
                            data-rv="up"
                            data-cursor
                            href={shot.href}
                            key={shot.title}
                          >
                            <div className="card-fr" data-frame>
                              <Image
                                src={shot.image}
                                alt={shot.title}
                                fill
                                sizes="(max-width: 820px) 100vw, 33vw"
                                className={styles.sceneFallback}
                                data-gmp-view-fallback
                                loading="lazy"
                              />
                              <span className="card-ar">
                                <Arrow />
                              </span>
                              <div className="card-lab">
                                <b>{shot.title}</b>
                              </div>
                            </div>
                            <div className="card-meta">
                              <span>{shot.caption}</span>
                              <span>
                                {String(i + 1).padStart(2, "0")} /0
                                {(chapter.shots ?? []).length}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <p
                        className={`body-lg ${styles.galleryBody}`}
                        data-rv="up"
                      >
                        {chapter.paragraphs[1]}
                      </p>
                      {controls}
                    </>
                  )}
                  {kind === "facts" &&
                    chapter.facts &&
                    chapter.facts.length > 0 && (
                      <>
                        <div className="cur-head">
                          {title}
                          {chapter.paragraphs[0] ? (
                            <p className="body-lg" data-rv="up">
                              {chapter.paragraphs[0]}
                            </p>
                          ) : null}
                        </div>
                        <FactSheet
                          items={chapter.facts}
                          ariaLabel={chapter.label}
                        />
                        {controls}
                      </>
                    )}
                  {kind === "timeline" &&
                    chapter.timeline &&
                    chapter.timeline.length > 0 && (
                      <>
                        <div className="cur-head">
                          {title}
                          {chapter.paragraphs[0] ? (
                            <p className="body-lg" data-rv="up">
                              {chapter.paragraphs[0]}
                            </p>
                          ) : null}
                        </div>
                        <Timeline
                          items={chapter.timeline}
                          ariaLabel={chapter.label}
                        />
                        {controls}
                      </>
                    )}
                  {kind === "brands" &&
                    chapter.brands &&
                    chapter.brands.length > 0 && (
                      <>
                        <div className="cur-head">
                          {title}
                          {chapter.paragraphs[0] ? (
                            <p className="body-lg" data-rv="up">
                              {chapter.paragraphs[0]}
                            </p>
                          ) : null}
                        </div>
                        <BrandsRow
                          items={chapter.brands}
                          ariaLabel={chapter.label}
                        />
                        {controls}
                      </>
                    )}
                  {kind === "closing" && (
                    <>
                      <div className="eyebrow" data-rv="fade">
                        {chapter.label}
                      </div>
                      {title}
                      <div className={`${styles.closingCopy} closing-body`}>
                        {chapter.paragraphs.map((p) => (
                          <p className="body-lg" data-rv="up" key={p}>
                            {p}
                          </p>
                        ))}
                      </div>
                      <a className="cta" href={`#${nextId}`} data-cursor>
                        <i />
                        <span>{ui.continue}</span>
                        <Arrow />
                      </a>
                    </>
                  )}
                </>
              )}
              {storyId === "lorca" && chapter.id === "llegar" && (
                <a
                  className="arrowlink"
                  href={EDITORIAL_FACTS.mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                >
                  {contactCopy.maps}
                </a>
              )}
              {storyId === "lorca" && chapter.id === "cierre" && (
                <div className={styles.actions}>
                  <a
                    className="arrowlink"
                    href={EDITORIAL_FACTS.phoneHref}
                    data-cursor
                  >
                    {EDITORIAL_FACTS.phone}
                  </a>
                  <a
                    className="arrowlink"
                    href={gmailCompose(
                      EDITORIAL_FACTS.lorcaEmail,
                      "Contacto — Lorca · Granja Maripepa",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor
                  >
                    {EDITORIAL_FACTS.lorcaEmail}
                  </a>
                </div>
              )}
            </Chapter>
          );
        })}
        <Chapter
          id={`${storyId}-manifiesto`}
          scene={5}
          title={page.manifesto.title}
          className={styles.manifesto}
        >
          <div className="sec-head" data-rv="fade">
            <span className="k">Granja Maripepa</span>
            <span className="rule" />
            <a
              className="k"
              href={`#${storyId}-${page.chapters[0].id}`}
              data-cursor
            >
              {ui.backToStart}
            </a>
          </div>
          <WordReveal as="h2" className="display h-sec">
            {page.manifesto.title}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {page.manifesto.text}
          </p>
          <Link href={page.manifesto.href} className="cta" data-cursor>
            <i />
            <span>{page.manifesto.link}</span>
            <Arrow />
          </Link>
        </Chapter>
      </GMPRoute>
    </>
  );
}
