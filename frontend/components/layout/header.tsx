"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/lib/navigation";
import { ShoppingCart, ArrowUpRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { isolateBackground } from "@/components/kage/navigation/inert";
import { getKageNavigationCopy } from "@/lib/kage-navigation-copy";
import { useMagazines } from "@/components/magazines/magazine-context";
import chrome from "./site-chrome.module.css";
const languages = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "zh", name: "中文" },
] as const;

type LocaleCode = (typeof languages)[number]["code"];

function Flag({ code }: { code: LocaleCode }) {
  const common = {
    viewBox: "0 0 20 14",
    width: 20,
    height: 14,
    role: "presentation" as const,
    focusable: "false" as const,
  };
  if (code === "es")
    return (
      <svg {...common}>
        <rect width="20" height="14" fill="#C60B1E" />
        <rect y="3.5" width="20" height="7" fill="#FFC400" />
      </svg>
    );
  if (code === "de")
    return (
      <svg {...common}>
        <rect width="20" height="4.67" fill="#111" />
        <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
        <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
      </svg>
    );
  if (code === "it")
    return (
      <svg {...common}>
        <rect width="6.67" height="14" fill="#008C45" />
        <rect x="6.67" width="6.67" height="14" fill="#F4F5F0" />
        <rect x="13.33" width="6.67" height="14" fill="#CD212A" />
      </svg>
    );
  if (code === "zh")
    return (
      <svg {...common}>
        <rect width="20" height="14" fill="#DE2910" />
        <path
          d="M4 3.2l0.9 2.7H7.7L5.4 7.6l0.9 2.7L4 8.7 1.7 10.3l0.9-2.7L0.3 5.9h2.8z"
          fill="#FFDE00"
        />
      </svg>
    );
  return (
    <svg {...common}>
      <rect width="20" height="14" fill="#012169" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#fff" strokeWidth="2.6" />
      <path d="M0 0l20 14M20 0L0 14" stroke="#C8102E" strokeWidth="1.1" />
      <path d="M10 0v14M0 7h20" stroke="#fff" strokeWidth="4.2" />
      <path d="M10 0v14M0 7h20" stroke="#C8102E" strokeWidth="2.4" />
    </svg>
  );
}

function LocaleSelect() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const copy = getKageNavigationCopy(locale);
  const current = (languages.find((item) => item.code === locale) ?? languages[0]) as {
    code: LocaleCode;
    name: string;
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: LocaleCode) => {
    setOpen(false);
    if (next === locale) return;
    start(() =>
      router.replace(
        `${pathname}${window.location.search}${window.location.hash}`,
        { locale: next, scroll: false },
      ),
    );
  };

  return (
    <div className={chrome.locale} ref={box}>
      <button
        type="button"
        className={chrome.localeButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${copy.language}: ${current.code.toUpperCase()} · ${current.name}`}
        aria-busy={pending}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={chrome.flag}>
          <Flag code={current.code} />
        </span>
        <span className={chrome.localeCode}>{current.code.toUpperCase()}</span>
        <svg
          className={chrome.localeChevron}
          viewBox="0 0 10 6"
          width="10"
          height="6"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {open ? (
        <ul className={chrome.localeMenu} role="listbox" aria-label={copy.language}>
          {languages.map((language) => {
            const active = language.code === locale;
            return (
              <li key={language.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${chrome.localeOption} ${active ? chrome.localeOptionActive : ""}`}
                  onClick={() => choose(language.code)}
                >
                  <span className={chrome.flag}>
                    <Flag code={language.code} />
                  </span>
                  <span className={chrome.localeName}>{language.name}</span>
                  {active ? (
                    <span className={chrome.localeCheck} aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
export function Header() {
  const locale = useLocale(),
    t = useTranslations("nav"),
    pathname = usePathname();
  const copy = getKageNavigationCopy(locale);
  const { magazines, openMagazine, openLibrary } = useMagazines();
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [stuck, setStuck] = useState(false),
    [hidden, setHidden] = useState(false),
    [mounted, setMounted] = useState(false);
  const root = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    openRef = useRef(false),
    reason = useRef<"dismiss" | "navigation" | "handoff">("dismiss");
  openRef.current = open;
  const total = useCartStore((state) => state.getTotalItems()),
    toggleCart = useCartStore((state) => state.toggleCart);
  const close = (why: "dismiss" | "navigation" | "handoff" = "dismiss") => {
    reason.current = why;
    setOpen(false);
  };
  useEffect(() => {
    setMounted(true);
    const media = matchMedia("(max-width:820px)");
    const change = () => {
      setMobile(media.matches);
      close();
    };
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    let last = scrollY;
    const apply = () => {
      const y = scrollY;
      setStuck(y > 40);
      setHidden(
        !openRef.current &&
          y > last + 4 &&
          y > document.documentElement.clientHeight * 0.8,
      );
      last = y;
    };
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, []);
  useEffect(() => {
    if (!open) return;
    const button = trigger.current;
    const html = document.documentElement;
    window.dispatchEvent(
      new CustomEvent("kage:overlay-open", { detail: { id: "menu" } }),
    );
    html.classList.add("nav-open");
    document.body.classList.add("kage-menu-open");
    setHidden(false);
    const backgrounds = mobile
      ? Array.from(
          document.querySelectorAll<HTMLElement>("[data-kage-background]"),
        )
      : [];
    const releaseBackground = isolateBackground(backgrounds);
    const frame = requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(
          mobile ? ".nav-link" : ".kage-menu-resources a",
        )
        ?.focus({ preventScroll: true }),
    );
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !mobile || !root.current) return;
      const items = Array.from(
        root.current.querySelectorAll<HTMLElement>(
          "a[href],button:not(:disabled),select:not(:disabled)",
        ),
      ).filter((el) => el.getClientRects().length && !el.closest("[hidden]"));
      const first = items[0],
        last = items[items.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !root.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !root.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
      window.dispatchEvent(
        new CustomEvent("kage:overlay-close", { detail: { id: "menu" } }),
      );
      html.classList.remove("nav-open");
      document.body.classList.remove("kage-menu-open");
      releaseBackground();
      if (reason.current === "dismiss" && button?.isConnected)
        button.focus({ preventScroll: true });
    };
  }, [open, mobile]);
  useEffect(() => {
    const handoff = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id && id !== "menu" && openRef.current) {
        reason.current = "handoff";
        setOpen(false);
      }
    };
    window.addEventListener("kage:overlay-open", handoff);
    return () => window.removeEventListener("kage:overlay-open", handoff);
  }, []);
  const links = [
    { href: "/productos", label: t("products") },
    { href: "/acerca", label: t("about") },
    { href: "/contacto", label: t("contact") },
    { href: "/area-clientes", label: t("customerArea") },
    { href: "/trabaja-con-nosotros", label: locale === "es" ? "Trabaja con nosotros" : "Work with us" },
  ];
  const routeClick = (href: string) =>
    close(href === pathname ? "dismiss" : "navigation");
  const openCart = () => {
    close("handoff");
    requestAnimationFrame(() => toggleCart());
  };
  const showMagazine = (
    event: React.MouseEvent<HTMLAnchorElement>,
    magazine: (typeof magazines)[number],
  ) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    close("handoff");
    requestAnimationFrame(() => openMagazine(magazine));
  };
  return (
    <>
      <header
        ref={root}
        className={`nav ${chrome.header} ${stuck ? "stuck" : ""} ${hidden ? "hide" : ""} ${open ? "menu-open" : ""}`}
        id="nav"
        role={mobile && open ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label={mobile && open ? copy.primary : undefined}
        data-fx="header-surface link-roll"
      >
        <Link
          className="brand"
          href="/"
          data-cursor
          aria-label={`Granja Maripepa · ${t("home")}`}
          onClick={() => routeClick("/")}
        >
          <Image
            src="/kage/brand/logo-alpha.png"
            alt="Granja Maripepa"
            width={135}
            height={41}
            priority
            className="kage-brand-image"
          />
        </Link>
        <nav className="nav-links" id="navlinks" aria-label={copy.primary}>
          {links.map((link, index) => (
            <Link
              className={`nav-link ${pathname === link.href || pathname.startsWith(`${link.href}/`) ? "on" : ""}`}
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              data-cursor
              onClick={() => routeClick(link.href)}
            >
              <span>{link.label}</span>
              <span className="alt" aria-hidden="true">
                {String(index + 1).padStart(2, "0")} / {link.label}
              </span>
            </Link>
          ))}
          <div className="kage-menu-resources" hidden={!open}>
            <p className="eyebrow">{copy.resources}</p>
            <Link
              href="/lorca"
              onClick={() => routeClick("/lorca")}
              data-cursor
            >
              {copy.location}
            </Link>
            <Link
              href="/calidad"
              onClick={() => routeClick("/calidad")}
              data-cursor
            >
              {copy.quality}
            </Link>
            <Link
              href="/reparto"
              onClick={() => routeClick("/reparto")}
              data-cursor
            >
              {copy.delivery}
            </Link>
            <Link
              href="/preguntas-frecuentes"
              onClick={() => routeClick("/preguntas-frecuentes")}
              data-cursor
            >
              {copy.faq}
            </Link>
            <div className="kage-menu-magazines">
              <p className="eyebrow">
                {copy.magazines} · {copy.archive}
              </p>
              {magazines.slice(0, 4).map((magazine) => (
                <a
                  key={magazine.id}
                  href={magazine.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => showMagazine(event, magazine)}
                  data-cursor
                >
                  {magazine.edition}
                </a>
              ))}
              <button
                type="button"
                className="kage-menu-all-magazines"
                onClick={() => {
                  close("handoff");
                  requestAnimationFrame(() => openLibrary());
                }}
                data-cursor
              >
                {locale === "es" ? "Ver todas las revistas" : "See all magazines"}
              </button>
            </div>
            <div className="kage-menu-language">
              <LocaleSelect />
            </div>
          </div>
        </nav>
        <Link href="/contacto" className={chrome.navCta} data-cursor onClick={() => routeClick("/contacto")}>
          {locale === "es" ? "Hablemos" : "Talk to us"}
          <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
        <div className="kage-nav-utilities">
          <div className="kage-desktop-language">
            <LocaleSelect />
          </div>
          <button
            type="button"
            className="kage-cart"
            aria-label={`${copy.cart}${mounted ? ` (${total})` : ""}`}
            onClick={openCart}
            data-cursor
          >
            <ShoppingCart size={18} aria-hidden="true" />
            {mounted && total > 0 ? <span>{total}</span> : null}
          </button>
        </div>
        <button
          ref={trigger}
          type="button"
          className={`nav-burger ${open ? "active" : ""}`}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          aria-controls="navlinks"
          onClick={() => {
            reason.current = "dismiss";
            setOpen((value) => !value);
          }}
          data-cursor
        >
          <i />
          <i />
        </button>
      </header>
      <CartDrawer />
    </>
  );
}
