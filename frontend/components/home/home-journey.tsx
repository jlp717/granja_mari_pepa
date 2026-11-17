import Image from "next/image";
import NextLink from "next/link";
import type { AnchorHTMLAttributes } from "react";
import type { Locale } from "@/i18n";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import { getGMPHomeCopy } from "@/lib/gmp-home-copy";
import { gmailCompose } from "@/components/editorial/facts";
import styles from "./journey.module.css";
import { BrandFallback, HomeForeground, ScenePlate } from "./scene-plate";

export const FAMILY_IDS = [
  "mar",
  "carne",
  "precocinados",
  "reposteria",
  "panaderia",
  "refrigerados",
  "salsas",
] as const;
export const FAMILY_PHOTOS = [
  "/catalogs/familias/real-mar-2.jpg",
  "/catalogs/familias/real-carne-2.jpg",
  "/catalogs/familias/real-precocinados-2.jpg",
  "/catalogs/familias/real-reposteria-2.jpg",
  "/catalogs/familias/real-panaderia-2.jpg",
  "/catalogs/familias/real-refrigerados-2.jpg",
  "/catalogs/familias/real-salsas-2.jpg",
] as const;
export const BRAND_DESTINATIONS = [
  { name: "Grupo Topgel", href: "https://www.grupotopgel.es/" },
  { name: "Nestlé Helados", href: "/productos" },
  { name: "Panamar", href: "https://www.panamar.es/" },
] as const;
const IDS = ["hero", "frio", "catalogo", "ruta", "mesa", "manifiesto"] as const;

function RouteLink({
  href,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }) {
  return href.startsWith("/") ? (
    <NextLink href={href} {...props} />
  ) : (
    <a href={href} {...props} />
  );
}

export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <RouteLink className="arrowlink" href={href} data-rv="fade" data-cursor>
      <span>{children}</span>
      <span className="ar" aria-hidden="true">
        <svg viewBox="0 0 14 14" fill="none">
          <path
            d="M3 11 11 3M5 3h6v6"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      </span>
    </RouteLink>
  );
}

function SectionHead({ label, end }: { label: string; end: string }) {
  return (
    <div className="sec-head" data-rv="fade">
      <span className="k">{label}</span>
      <span className="rule" />
      <span className="k">{end}</span>
    </div>
  );
}

export function HomeJourney({ locale }: { locale: Locale }) {
  const copy = getGMPHomeCopy(locale);
  const [hero, cold, range, route, table, manifesto] = copy.chapters;
  const catalogue = "/" + locale + "/productos";
  const contact = "/" + locale + "/contacto";
  return (
    <>
      <Chapter id="hero" scene={0} className="hero" title={hero.label}>
        <ScenePlate scene={0} priority />
        <HomeForeground chapter="hero" scene={0} />
        <div className="hero-top">
          <div className="eyebrow" data-rv="fade">
            <span className="dot" />
            {hero.label}
          </div>
          <WordReveal as="h1" className="display h-hero">
            {hero.title}
          </WordReveal>
          <p className="hero-sub body" data-rv="up">
            {hero.lead}
          </p>
          {hero.supports.map((item) => (
            <p
              className={"hero-sub body " + styles.heroSupport}
              data-rv="up"
              key={item.title}
            >
              <strong>{item.title}. </strong>
              {item.text}
            </p>
          ))}
          <ArrowLink href={catalogue}>{copy.products}</ArrowLink>
        </div>
        <div className="hero-spacer" />
        <div className="hero-foot">
          <div className="hero-cue" data-rv="fade">
            <span>{copy.scroll}</span>
            <span className="track" aria-hidden="true">
              <i />
            </span>
          </div>
          <div className="chapters">
            {copy.chapters.slice(1, 5).map((chapter, index) => (
              <RouteLink
                className="chip"
                href={"#" + IDS[index + 1]}
                data-rv="up"
                data-cursor
                key={chapter.label}
              >
                <span className="num">
                  {String(index + 2).padStart(2, "0")}
                </span>
                <span className="tx">
                  <b>{chapter.label.split(" · ")[1]}</b>
                  <p>{chapter.title}</p>
                </span>
              </RouteLink>
            ))}
          </div>
        </div>
        <a
          className="peek"
          href="#catalogo"
          data-view="3"
          data-rv="fade"
          data-cursor
          aria-label={copy.scroll}
        >
          <span className={"peek-fr " + styles.peekFrame} data-frame>
            <Image
              src="/gmp/secret-pathways-assets/generated/gmp-peek-umbral.webp"
              alt=""
              fill
              sizes="38vw"
              data-gmp-view-fallback=""
              priority
            />
          </span>
          <span className="peek-play" aria-hidden="true">
            <svg viewBox="0 0 22 22" fill="none">
              <path d="M8 5.6 16.4 11 8 16.4z" fill="currentColor" />
            </svg>
          </span>
          <span className="peek-cap">
            <b>{hero.label}</b>
            <i>{copy.read}</i>
          </span>
        </a>
        <BrandFallback />
        <div className="hero-side" aria-hidden="true">
          <span className="v">LORCA · 1966</span>
        </div>
      </Chapter>

      <Chapter id="frio" scene={1} title={cold.label}>
        <ScenePlate scene={1} />
        <HomeForeground chapter="frio" scene={1} />
        <SectionHead label={cold.label} end="HORECA" />
        <div className="gate-grid">
          <WordReveal as="h2" className="display h-sec">
            {cold.title}
          </WordReveal>
          <div className="gate-copy">
            <p className="lead" data-rv="up">
              {cold.lead}
            </p>
            <ArrowLink href={catalogue}>{cold.action}</ArrowLink>
          </div>
        </div>
        <div className={"gate-stats " + styles.temperatures}>
          {cold.supports.map((item) => (
            <div key={item.title} data-rv="up">
              <h3>{item.title}</h3>
              <p className="body">{item.text}</p>
            </div>
          ))}
        </div>
      </Chapter>

      <Chapter
        id="catalogo"
        scene={2}
        className={styles.range}
        title={range.label}
      >
        <ScenePlate scene={2} />
        <HomeForeground chapter="catalogo" scene={2} />
        <SectionHead label={range.label} end="GRUPO TOPGEL" />
        <div className="cur-head">
          <WordReveal as="h2" className="display h-sec">
            {range.title}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {range.lead}
          </p>
        </div>
        <div className="cards">
          {FAMILY_IDS.slice(0, 3).map((id, index) => (
            <RouteLink
              className={"card " + styles.family}
              href={catalogue + "?brand=grupo-topgel&category=" + id}
              key={id}
              data-rv="up"
              data-view={index}
              data-cursor
            >
              <div
                className={"card-fr " + styles.familyFrame}
                data-frame
                data-cloth-src={FAMILY_PHOTOS[index]}
              >
                <Image
                  src={FAMILY_PHOTOS[index]}
                  alt={copy.familyNames[index]}
                  fill
                  sizes="(max-width: 820px) 100vw, (max-width: 1080px) 52vw, 58vw"
                  className={styles.foodPhoto}
                  data-cloth-fallback=""
                />
                <span className="card-ar" aria-hidden="true">
                  ↗
                </span>
                <div className="card-lab">
                  <b>{copy.familyNames[index]}</b>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="card-meta">
                <span>{copy.read}</span>
                <span>0{index + 1} / 04</span>
              </div>
            </RouteLink>
          ))}
        </div>
        <RouteLink
          className={"les " + styles.fourth}
          href={catalogue + "?brand=grupo-topgel&category=reposteria"}
          data-rv="up"
          data-cursor
        >
          <span className="k">04</span>
          <div className={styles.fourthPhoto}>
            <Image
              src={FAMILY_PHOTOS[3]}
              alt={copy.familyNames[3]}
              fill
              sizes="(max-width: 820px) 100vw, 240px"
              className={styles.foodPhoto}
            />
          </div>
          <h3>{copy.familyNames[3]}</h3>
          <span className="t">{copy.read} ↗</span>
          <i className="bar" />
        </RouteLink>
        <p className={"body " + styles.caption}>{copy.illustration}</p>
        <div className={styles.supports}>
          {range.supports.map((item) => (
            <div key={item.title}>
              <h3 data-rv="up">{item.title}</h3>
              <p className="body" data-rv="up">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <ArrowLink href={catalogue}>{range.action}</ArrowLink>
      </Chapter>

      <Chapter id="ruta" scene={3} title={route.label}>
        <ScenePlate scene={3} />
        <HomeForeground chapter="ruta" scene={3} />
        <SectionHead label={route.label} end="LORCA" />
        <div className="cur-head">
          <WordReveal as="h2" className="display h-sec">
            {route.title}
          </WordReveal>
          <p className="body-lg" data-rv="up">
            {route.lead}
          </p>
        </div>
        <div className="cur">
          {route.supports.map((item, index) => (
            <RouteLink
              className="les"
              href={
                index === 0
                  ? "tel:+34968467514"
                  : index === 1
                    ? gmailCompose("pedidos@granjamaripepa.com")
                    : contact
              }
              key={item.title}
              data-rv="up"
              data-cursor
              {...(index === 1
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="k">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="t">↗</span>
              <i className="bar" />
            </RouteLink>
          ))}
        </div>
        <ArrowLink href={contact}>{route.action}</ArrowLink>
      </Chapter>

      <Chapter id="mesa" scene={4} className="fin" title={table.label}>
        <ScenePlate scene={4} />
        <HomeForeground chapter="mesa" scene={4} />
        <div className="eyebrow" data-rv="fade">
          {table.label}
        </div>
        <WordReveal as="h2" className="display">
          {table.title}
        </WordReveal>
        <div className={styles.tableCopy}>
          <p className="body-lg" data-rv="up">
            {table.lead}
          </p>
          {table.supports.map((item) => (
            <p className="body" data-rv="up" key={item.title}>
              <strong>{item.title}. </strong>
              {item.text}
            </p>
          ))}
        </div>
        <RouteLink className="cta" href={contact} data-rv="fade" data-cursor>
          <i aria-hidden="true" />
          <span>{table.action}</span>
          <span aria-hidden="true">↗</span>
        </RouteLink>
      </Chapter>

      <Chapter
        id="manifiesto"
        scene={5}
        className={styles.manifesto}
        title={manifesto.label}
      >
        <div className="sec-head" data-rv="fade">
          <span className="k">{manifesto.label}</span>
          <span className="rule" />
          <span className="k">MURCIA · ALMERÍA</span>
        </div>
        <div className="foot-grid">
          <div className="foot-brand">
            <Image
              src="/gmp/brand/logo-alpha.png"
              alt=""
              width={600}
              height={182}
              className={styles.manifestoMark}
              unoptimized
            />
            <div>
              <WordReveal as="h2" className="display h-sec">
                {manifesto.title}
              </WordReveal>
              <p>{manifesto.lead}</p>
            </div>
          </div>
          {manifesto.supports.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p className="body" data-rv="up">
                {item.text}
              </p>
            </div>
          ))}
          <div>
            <h3>{copy.brandsTitle}</h3>
            <p className="body">{copy.brandsIntro}</p>
            {BRAND_DESTINATIONS.map((brand) => (
              <RouteLink
                className={styles.brandLink}
                href={brand.href}
                key={brand.name}
                data-cursor
              >
                {brand.name}
                <span aria-hidden="true">↗</span>
              </RouteLink>
            ))}
          </div>
        </div>
        <p className="body">{copy.catalogueNotice}</p>
        <ArrowLink href={contact}>{manifesto.action}</ArrowLink>
      </Chapter>
    </>
  );
}
