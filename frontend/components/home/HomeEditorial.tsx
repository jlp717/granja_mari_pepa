"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import type { Locale } from "@/i18n";
import { Link } from "@/lib/navigation";
import { Chapter } from "@/components/kage/Chapter";
import { HomeForeground } from "./scene-plate";
import { WordReveal } from "@/components/kage/WordReveal";
import { useMagazines } from "@/components/magazines/magazine-context";
import { getHomeEditorialCopy } from "./home-copy";
import styles from "./home-editorial.module.css";

const RANGE_IMAGES = [
  "/catalogs/familias/mar.webp",
  "/catalogs/familias/carne.webp",
  "/catalogs/familias/precocinados.webp",
  "/catalogs/familias/reposteria.webp",
  "/catalogs/familias/panaderia.webp",
  "/catalogs/familias/refrigerados.webp",
  "/catalogs/familias/salsas.webp",
] as const;

export function HomeEditorial({ locale }: { locale: Locale }) {
  const copy = getHomeEditorialCopy(locale);
  const { magazines, openMagazine, openLibrary } = useMagazines();
  const [activeFamily, setActiveFamily] = useState(0);
  const atmos = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = atmos.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 901px)");
    if (reduce.matches || !wide.matches) return;

    let frame = 0;
    let queued = false;
    let ready = false;

    const onReady = () => {
      ready = true;
      video.pause();
      paint();
    };
    const paint = () => {
      queued = false;
      if (!ready || !video.duration) return;
      const rect = video.getBoundingClientRect();
      const span = Math.max(1, rect.height);
      const progress = Math.min(1, Math.max(0, window.scrollY / span));
      const target = progress * Math.max(0, video.duration - 0.05);
      if (Math.abs(video.currentTime - target) > 0.015) {
        video.currentTime = target;
      }
    };
    const request = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(paint);
    };

    video.addEventListener("loadedmetadata", onReady);
    if (video.readyState >= 1) onReady();

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, []);
  const catalogue = "/productos";
  const contact = "/contacto";

  return (
    <>
      <Chapter id="hero" scene={0} className={`hero ${styles.hero}`} title={copy.hero.eyebrow}>
        <HomeForeground chapter="hero" scene={0} />
        <div
          className={styles.heroAtmos}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          aria-hidden="true"
        >
          <video
            ref={atmos}
            className={styles.heroAtmosVideo}
            src="/kage/mp/video/hero-scrub.mp4"
            poster="/kage/mp/plates/umbral-bluehour.webp"
            muted
            playsInline
            preload="metadata"
          />
          <div className={styles.heroAtmosVeil} />
        </div>
        <div className={styles.heroTop}>
          <span className="eyebrow">
            <span className={styles.dot} />
            {copy.hero.eyebrow}
          </span>
          <span className={styles.heroStamp}>37.67 N · 1.70 O</span>
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <WordReveal as="h1" className={`display ${styles.heroTitle}`}>
              {copy.hero.title}
            </WordReveal>
            <p className={styles.heroLead} data-rv="up">
              {copy.hero.lead}
            </p>
            <div className={styles.heroActions} data-rv="up">
              <Link href={catalogue} className={styles.primaryAction} data-cursor>
                {copy.hero.primary}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <a href="#cierre" className={styles.secondaryAction} data-cursor>
                {copy.hero.secondary}
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.heroFoot}>
          <div className={styles.heroStats}>
            {copy.stats.map((stat) => (
              <div key={stat.label}>
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <a href="#origen" className={styles.scrollCue} data-cursor>
            <span>{locale === "es" ? "Sigue el recorrido" : "Follow the journey"}</span>
            <i aria-hidden="true" />
          </a>
        </div>
      </Chapter>

      <Chapter
        id="origen"
        scene={1}
        className={styles.section}
        title={copy.origin.kicker}
      >
        <HomeForeground chapter="origen" scene={1} />
        <header className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.origin.kicker}</span>
          <WordReveal as="h2" className={`display ${styles.sectionTitle}`}>
            {copy.origin.title}
          </WordReveal>
          <p className={styles.sectionLead} data-rv="up">
            {copy.origin.lead}
          </p>
        </header>

        <div className={styles.originGrid}>
          <div className={styles.originPhotos} data-rv="up">
            <figure className={styles.originMain}>
              <Image
                src="/kage/mp/plates/muelle-alba.webp"
                alt="Muelle de carga de la nave de Granja Maripepa en Lorca"
                fill
                sizes="(max-width: 900px) 92vw, 42vw"
                className={styles.photo}
              />
              <figcaption>Lorca · Pol. Saprelorca</figcaption>
            </figure>
            <figure className={styles.originSmall}>
              <Image
                src="/kage/mp/plates/invernaderos.webp"
                alt="Invernaderos del valle del Guadalentín al amanecer"
                fill
                sizes="(max-width: 900px) 45vw, 18vw"
                className={styles.photo}
              />
              <figcaption>Valle del Guadalentín</figcaption>
            </figure>
          </div>

          <div className={styles.originPoints}>
            {copy.origin.points.map((point, index) => (
              <article key={point.title} data-rv="up">
                <span className={styles.pointIndex}>0{index + 1}</span>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </Chapter>

      <Chapter
        id="sistema"
        scene={2}
        className={`${styles.section} ${styles.system}`}
        title={copy.system.kicker}
      >
        <HomeForeground chapter="sistema" scene={2} />
        <div className={styles.systemBand} data-rv="fade">
          <video
            className={styles.systemVideo}
            src="/kage/mp/video/sistema-dawn.mp4"
            poster="/kage/mp/video/sistema-plano-poster.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className={styles.systemVeil} aria-hidden="true" />
          <div className={styles.systemHead}>
            <span className={styles.kicker}>{copy.system.kicker}</span>
            <WordReveal as="h2" className={`display ${styles.systemTitle}`}>
              {copy.system.title}
            </WordReveal>
            <p className={styles.systemLead} data-rv="up">
              {copy.system.lead}
            </p>
          </div>
        </div>

        <div className={styles.steps}>
          {copy.system.steps.map((step) => (
            <article key={step.index} data-rv="up">
              <span className={styles.stepIndex}>{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <Link href={contact} className={styles.inlineAction} data-cursor>
          {copy.system.action}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </Chapter>

      <Chapter id="gama" scene={3} className={styles.section} title={copy.range.kicker}>
        <HomeForeground chapter="gama" scene={3} />
        <header className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.range.kicker}</span>
          <WordReveal as="h2" className={`display ${styles.sectionTitle}`}>
            {copy.range.title}
          </WordReveal>
          <p className={styles.sectionLead} data-rv="up">
            {copy.range.lead}
          </p>
        </header>

        <div className={styles.rangeBody}>
          <div className={styles.familyList}>
            {copy.range.families.map((family, index) => (
              <Link
                key={family.name}
                href={`${catalogue}?category=${family.href.split("category=")[1] ?? ""}`}
                className={styles.familyRow}
                data-rv="up"
                data-cursor
                onMouseEnter={() => setActiveFamily(index)}
                onFocus={() => setActiveFamily(index)}
              >
                <span className={styles.familyNumber}>0{index + 1}</span>
                <h3>{family.name}</h3>
                <span className={styles.familyThumb} aria-hidden="true">
                  <Image
                    src={RANGE_IMAGES[index]}
                    alt=""
                    fill
                    sizes="56px"
                    className={styles.photo}
                  />
                </span>
                <span className={styles.familyMeta}>
                  {locale === "es" ? "Ver familia" : "View family"}
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <figure className={styles.rangePreview} aria-hidden="true">
            <div className={styles.rangeStack}>
              {RANGE_IMAGES.map((src, index) => (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 900px) 1px, 30vw"
                  className={`${styles.rangeImage} ${
                    index === activeFamily ? styles.rangeImageActive : ""
                  }`}
                />
              ))}
            </div>
            <figcaption>{copy.range.families[activeFamily].name}</figcaption>
          </figure>
        </div>
        <Link href={catalogue} className={styles.inlineAction} data-cursor>
          {copy.range.action}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        <div className={styles.brands}>
          <span>{locale === "es" ? "Marcas en la gama" : "Brands in the range"}</span>
          <ul className={styles.brandGrid}>
            <li>
              <a href="https://www.grupotopgel.es/" target="_blank" rel="noopener noreferrer" data-cursor>
                <Image src="/images/brands/topgel-white.png" alt="Grupo Topgel" width={266} height={107} />
              </a>
            </li>
            <li>
              <a href="https://www.froneri.com/es/" target="_blank" rel="noopener noreferrer" data-cursor>
                <Image src="/images/brands/nestle-white.png" alt="Nestlé Helados · Froneri" width={193} height={162} />
              </a>
            </li>
            <li>
              <a href="https://www.panamar.es/" target="_blank" rel="noopener noreferrer" data-cursor>
                <Image src="/images/brands/panamar-white.png" alt="Panamar" width={249} height={158} />
              </a>
            </li>
            <li>
              <Image src="/images/brands/okin-white.png" alt="Okin" width={223} height={192} />
            </li>
            <li>
              <Image src="/images/brands/amparin-white.png" alt="Pastelería Amparín" width={268} height={111} />
            </li>
          </ul>
        </div>
        <div className={styles.explore}>
          <span>{locale === "es" ? "Sigue leyendo" : "Keep reading"}</span>
          <Link href="/calidad" data-cursor>
            {locale === "es" ? "Calidad y documentación" : "Quality and documentation"}
          </Link>
          <Link href="/reparto" data-cursor>
            {locale === "es" ? "Reparto en Murcia y Almería" : "Delivery in Murcia and Almería"}
          </Link>
          <Link href="/lorca" data-cursor>
            {locale === "es" ? "Sede de Lorca" : "Lorca site"}
          </Link>
        </div>
      </Chapter>

      <Chapter
        id="revistas"
        scene={4}
        className={`${styles.section} ${styles.magazineSection}`}
        title={copy.magazines.kicker}
      >
        <HomeForeground chapter="revistas" scene={4} />
        <header className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.magazines.kicker}</span>
          <WordReveal as="h2" className={`display ${styles.sectionTitle}`}>
            {copy.magazines.title}
          </WordReveal>
          <p className={styles.sectionLead} data-rv="up">
            {copy.magazines.lead}
          </p>
        </header>

        <div className={styles.magazineRail}>
          {magazines.slice(0, 6).map((magazine) => (
            <button
              key={magazine.id}
              type="button"
              className={styles.magazineCard}
              onClick={() => openMagazine(magazine)}
              data-cursor
            >
              <span className={styles.magazineCover}>
                {magazine.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- portada real extraída del PDF
                  <img src={magazine.coverUrl} alt="" loading="lazy" />
                ) : null}
              </span>
              <span className={styles.magazineMeta}>
                <b>{magazine.edition}</b>
                <em>{magazine.title}</em>
              </span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.inlineAction} onClick={openLibrary} data-cursor>
          {copy.magazines.action}
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </Chapter>

      <Chapter id="sedes" scene={5} className={styles.section} title={copy.sites.kicker}>
        <header className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.sites.kicker}</span>
          <WordReveal as="h2" className={`display ${styles.sectionTitle}`}>
            {copy.sites.title}
          </WordReveal>
          <p className={styles.sectionLead} data-rv="up">
            {copy.sites.lead}
          </p>
        </header>

        <div className={styles.sites}>
          <figure className={styles.sitesPhoto} data-rv="up">
            <Image
              src="/kage/mp/plates/estanteria.webp"
              alt="Interior de la nave de Granja Maripepa en Lorca"
              fill
              sizes="(max-width: 900px) 100vw, 55vw"
              className={styles.photo}
            />
            <figcaption>Lorca · Murcia</figcaption>
          </figure>
          <div className={styles.siteCards}>
            <a
              className={styles.siteCard}
              href={copy.sites.lorca.maps}
              target="_blank"
              rel="noopener noreferrer"
              data-rv="up"
              data-cursor
            >
              <span className={styles.siteIcon}><MapPin size={16} aria-hidden="true" /></span>
              <b>{copy.sites.lorca.name}</b>
              <span>{copy.sites.lorca.address}</span>
            </a>
            <a
              className={styles.siteCard}
              href={copy.sites.viator.maps}
              target="_blank"
              rel="noopener noreferrer"
              data-rv="up"
              data-cursor
            >
              <span className={styles.siteIcon}><MapPin size={16} aria-hidden="true" /></span>
              <b>{copy.sites.viator.name}</b>
              <span>{copy.sites.viator.address}</span>
            </a>
          </div>
        </div>
      </Chapter>

      <Chapter
        id="cierre"
        scene={5}
        className={`${styles.section} ${styles.closing}`}
        title={copy.closing.kicker}
      >
        <span className={styles.kicker}>{copy.closing.kicker}</span>
        <WordReveal as="h2" className={`display ${styles.closingTitle}`}>
          {copy.closing.title}
        </WordReveal>
        <p className={styles.closingLead}>{copy.closing.lead}</p>
        <div className={styles.closingActions}>
          <Link href={contact} className={styles.primaryAction} data-cursor>
            {copy.closing.action}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <a href="tel:+34968467514" className={styles.secondaryAction} data-cursor>
            968 46 75 14
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
      </Chapter>
    </>
  );
}
