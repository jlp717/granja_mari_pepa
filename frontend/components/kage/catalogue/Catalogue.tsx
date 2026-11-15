import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n";
import { Chapter } from "@/components/kage/Chapter";
import { WordReveal } from "@/components/kage/WordReveal";
import {
  ArrowLink,
  BRAND_DESTINATIONS,
  FAMILY_IDS,
  FAMILY_PHOTOS,
} from "@/components/home/home-journey";
import {
  getKageCatalogueCopy,
  selectCatalogueFamilies,
} from "@/lib/kage-catalogue-copy";
import { MagazineArchive } from "@/components/magazines/MagazineArchive";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { KAGE_SITE_URL } from "@/lib/kage-seo";
import styles from "./catalogue.module.css";

export function Catalogue({
  locale,
  category,
  brand,
}: {
  locale: Locale;
  category: unknown;
  brand: unknown;
}) {
  const copy = getKageCatalogueCopy(locale);
  const result = selectCatalogueFamilies(copy, category, brand);
  const path = "/" + locale + "/productos";
  const contact = "/" + locale + "/contacto";
  return (
    <>
      <Breadcrumbs
        locale={locale}
        items={[{ name: "Productos", path: "/productos" }]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Familias de producto de Granja Maripepa",
            numberOfItems: copy.families.length,
            itemListElement: copy.families.map((family, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: family.title,
              url:
                KAGE_SITE_URL +
                "/" +
                locale +
                "/productos?category=" +
                family.id +
                "#familia-" +
                family.id,
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Chapter
        id="catalogo-intro"
        scene={2}
        className={styles.intro}
        title={copy.label}
      >
        <div className="sec-head" data-rv="fade">
          <span className="k">{copy.label}</span>
          <span className="rule" />
          <span className="k">Familias · {String(copy.families.length).padStart(2, "0")}</span>
        </div>
        <div className="gate-grid">
          <WordReveal as="h1" className={"display h-sec " + styles.introTitle}>
            {copy.title}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {copy.lead}
            </p>
            <div className={styles.notice} data-rv="up">
              <h2>{copy.noticeTitle}</h2>
              <p className="body">{copy.notice}</p>
            </div>
            <ArrowLink href={contact}>{copy.contact}</ArrowLink>
            <div className={styles.shortcuts}>
              <Link href={"/" + locale + "/area-clientes"}>{copy.clients}</Link>
              <Link href={"/" + locale}>{copy.home}</Link>
            </div>
          </div>
        </div>
      </Chapter>

      <Chapter id="gama" scene={2} title={copy.resultLabel}>
        <div className="sec-head" data-rv="fade">
          <span className="k">{copy.resultLabel}</span>
          <span className="rule" />
          <span className="k">GRUPO TOPGEL</span>
        </div>
        <nav className={styles.filters} aria-label={copy.filterLabel}>
          <Link
            href={path + "#gama"}
            scroll={false}
            aria-current={
              !result.invalid && !result.selected ? "true" : undefined
            }
          >
            {copy.all}
          </Link>
          {copy.families.map((family) => (
            <Link
              href={
                path + "?brand=grupo-topgel&category=" + family.id + "#gama"
              }
              scroll={false}
              aria-current={
                result.selected?.id === family.id ? "true" : undefined
              }
              key={family.id}
            >
              {family.title}
            </Link>
          ))}
        </nav>
        <p className={"eyebrow " + styles.resultCount} role="status">
          {result.families.length} / {copy.families.length} · {copy.resultLabel}
        </p>
        {result.invalid ? (
          <div className={styles.empty}>
            <h2 className="display h-sec">{copy.emptyTitle}</h2>
            <p className="body-lg">{copy.empty}</p>
            <ArrowLink href={path + "#gama"}>{copy.reset}</ArrowLink>
          </div>
        ) : (
          result.families.map((family) => {
            const photoIndex = FAMILY_IDS.indexOf(
              family.id as (typeof FAMILY_IDS)[number],
            );
            return (
              <article
                id={"familia-" + family.id}
                key={family.id}
                className={styles.family}
                data-fx="word-reveal"
              >
                <figure className={styles.figure} data-rv="up">
                  <div className={styles.photoFrame}>
                    <Image
                      src={FAMILY_PHOTOS[photoIndex]}
                      alt={family.title}
                      fill
                      sizes="(max-width: 820px) 100vw, 40vw"
                      className={styles.photo}
                    />
                  </div>
                  <figcaption className="body">{copy.illustration}</figcaption>
                </figure>
                <div className={styles.familyCopy}>
                  <div className="eyebrow" data-rv="fade">
                    0{photoIndex + 1} · {family.tag}
                  </div>
                  <WordReveal as="h2" className="display h-sec">
                    {family.title}
                  </WordReveal>
                  {family.paragraphs.map((paragraph) => (
                    <p className="body-lg" data-rv="up" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                  <ArrowLink href={contact + "?familia=" + family.id}>
                    {copy.consult}
                  </ArrowLink>
                </div>
              </article>
            );
          })
        )}
      </Chapter>

      <Chapter id="marcas" scene={2} title={copy.brandsTitle}>
        <div className="cur-head">
          <WordReveal as="h2" className="display h-sec">
            {copy.brandsTitle}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {copy.brandsText}
          </p>
        </div>
        <div className="cur">
          {BRAND_DESTINATIONS.map((item, index) => (
            <a
              className="les"
              href={item.href}
              key={item.name}
              data-rv="up"
              data-cursor
            >
              <span className="k">0{index + 1}</span>
              <h3>{item.name}</h3>
              <span className="t" aria-hidden="true">
                ↗
              </span>
              <i className="bar" />
            </a>
          ))}
        </div>
      </Chapter>

      <Chapter id="archivo" scene={3} title={copy.archiveTitle}>
        <div className="cur-head">
          <WordReveal as="h2" className="display h-sec">
            {copy.archiveTitle}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {copy.archiveText}
          </p>
        </div>
        <MagazineArchive limit={6} />
      </Chapter>

      <Chapter id="consulta" scene={4} title={copy.contactTitle}>
        <div className="gate-grid">
          <WordReveal as="h2" className="display h-sec">
            {copy.contactTitle}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {copy.contactText}
            </p>
            <p className="body" data-rv="up">
              {copy.schedule}
            </p>
            <ArrowLink href={contact}>{copy.contact}</ArrowLink>
            <div className={styles.shortcuts}>
              <a href="tel:+34968467514">{copy.phone} · 968 46 75 14</a>
              <a
                href="https://wa.me/34639778655"
                target="_blank"
                rel="noopener noreferrer"
              >
                {copy.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </Chapter>
    </>
  );
}
