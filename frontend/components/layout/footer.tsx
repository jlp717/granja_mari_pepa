"use client";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { getKageNavigationCopy } from "@/lib/kage-navigation-copy";
import { CookiePreferencesButton } from "@/components/kage/navigation/CookieConsent";
import { useMagazines } from "@/components/magazines/magazine-context";
import { gmailCompose } from "@/components/editorial/facts";
import chrome from "./site-chrome.module.css";
export function Footer() {
  const locale = useLocale(),
    t = useTranslations("footer"),
    nav = useTranslations("nav"),
    copy = getKageNavigationCopy(locale);
  const isEs = locale === "es";
  const { magazines, openMagazine, openLibrary } = useMagazines();
  return (
    <footer
      className={`foot ${chrome.footer}`}
      data-kage-background
      data-fx="support-stagger link-color"
      aria-label={copy.resources}
    >
      <section className={chrome.prelude} aria-labelledby="foot-closing">
        <div data-rv="up">
          <span className={chrome.kicker}>
            {isEs
              ? "Granja Maripepa · Desde 1966"
              : "Granja Maripepa · Since 1966"}
          </span>
          <h2 id="foot-closing" className={chrome.title}>
            {isEs ? (
              <>
                De Lorca a tu cocina,
                <br />
                <em>sin perder el origen.</em>
              </>
            ) : (
              <>
                From Lorca to your kitchen,
                <br />
                <em>without losing the origin.</em>
              </>
            )}
          </h2>
          <p className={chrome.lead}>
            {isEs
              ? "Congelado, refrigerado y temperatura ambiente para la hostelería de Murcia y Almería. Trato directo y cadena de frío."
              : "Frozen, chilled and ambient products for hospitality in Murcia and Almería. Direct contact and cold chain."}
          </p>
          <Link href="/contacto" className={chrome.cta} data-cursor>
            {isEs ? "Hablemos de tu negocio" : "Talk to our team"}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className={chrome.aside} data-rv="up">
          <div className={chrome.asideRow}>
            <span>{isEs ? "Pedidos" : "Orders"}</span>
            <a href="tel:+34968467514" data-cursor>
              968 46 75 14
            </a>
          </div>
          <div className={chrome.asideRow}>
            <span>{isEs ? "Escríbenos" : "Email"}</span>
            <a
              href={gmailCompose("pedidos@granjamaripepa.com")}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor
            >
              pedidos@granjamaripepa.com
            </a>
          </div>
          <div className={chrome.asideRow}>
            <span>{isEs ? "Sedes" : "Sites"}</span>
            <b>Lorca · Murcia</b>
            <b>Viator · Almería</b>
          </div>
        </div>
      </section>
      <div className={chrome.wordmark} aria-hidden="true">
        Maripepa
      </div>
      <div className="foot-grid">
        <div className="foot-brand" data-rv="up">
          <Link
            href="/"
            aria-label={`Granja Maripepa · ${nav("home")}`}
            data-cursor
          >
            <Image
              src="/kage/brand/logo-alpha.png"
              alt=""
              width={70}
              height={21}
            />
          </Link>
          <p>{t("description_long")}</p>
        </div>
        <div data-rv="up">
          <p className="foot-label">{copy.company}</p>
          <ul>
            <li>
              <Link href="/acerca" data-cursor>
                {nav("about")}
              </Link>
            </li>
            <li>
              <Link href="/productos" data-cursor>
                {nav("products")}
              </Link>
            </li>
            <li>
              <Link href="/calidad" data-cursor>
                {copy.quality}
              </Link>
            </li>
            <li>
              <Link href="/reparto" data-cursor>
                {copy.delivery}
              </Link>
            </li>
            <li>
              <Link href="/lorca" data-cursor>
                {copy.location}
              </Link>
            </li>
            <li>
              <Link href="/trabaja-con-nosotros" data-cursor>
                {locale === "es" ? "Trabaja con nosotros" : "Work with us"}
              </Link>
            </li>
          </ul>
        </div>
        <div data-rv="up">
          <p className="foot-label">{copy.resources}</p>
          <ul>
            <li>
              <Link href="/area-clientes" data-cursor>
                {nav("customerArea")}
              </Link>
            </li>
            <li>
              <Link href="/preguntas-frecuentes" data-cursor>
                {copy.faq}
              </Link>
            </li>
            {magazines.slice(0, 4).map((magazine) => (
              <li key={magazine.id}>
                <button
                  type="button"
                  onClick={() => openMagazine(magazine)}
                  data-cursor
                >
                  {magazine.title} · {magazine.edition}
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={openLibrary} data-cursor>
                {isEs ? "Ver todas las revistas" : "See all magazines"}
              </button>
            </li>
            <li>
              <Link href="/legal/privacidad" data-cursor>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terminos" data-cursor>
                {t("terms")}
              </Link>
            </li>
            <li>
              <CookiePreferencesButton data-cursor />
            </li>
            <li>
              <button
                type="button"
                data-cursor
                onClick={() =>
                  window.dispatchEvent(new Event("kage:open-pepa"))
                }
              >
                Pepa IA
              </button>
            </li>
          </ul>
        </div>
        <div data-rv="up">
          <p className="foot-label">{copy.contact}</p>
          <ul>
            <li>
              <a href="tel:+34968467514" data-cursor>
                968 46 75 14
              </a>
            </li>
            <li>
              <a href="tel:+34639778655" data-cursor>
                639 77 86 55
              </a>
            </li>
            <li>
              <a
                href={gmailCompose("pedidos@granjamaripepa.com")}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor
              >
                pedidos@granjamaripepa.com
              </a>
            </li>
            <li>
              <Link href="/contacto" data-cursor>
                {nav("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="foot-base">
        <span>© {new Date().getFullYear()} Granja Maripepa, S.L.</span>
        <span>{t("rights_reserved")}</span>
        <a href="#main-content" data-cursor>
          {copy.top} ↑
        </a>
      </div>
    </footer>
  );
}
