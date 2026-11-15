import type { Metadata } from "next";
import type { Locale } from "@/i18n";

export const KAGE_SITE_URL = "https://www.mari-pepa.com";
export const KAGE_LOCALES = ["es", "en", "de", "it", "zh"] as const;
/** Only locales with a complete translation are indexable. The rest remain
 * reachable for users but are excluded from hreflang and sitemap until their
 * editorial copy is translated. */
export const KAGE_INDEXED_LOCALES = ["es", "en"] as const;
export function createKageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  const canonical = KAGE_SITE_URL + "/" + locale + path;
  return {
    metadataBase: new URL(KAGE_SITE_URL),
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...KAGE_INDEXED_LOCALES.map((language) => [
          language,
          KAGE_SITE_URL + "/" + language + path,
        ]),
        ["x-default", KAGE_SITE_URL + "/es" + path],
      ]),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Granja Maripepa",
      type: "website",
      locale: {
        es: "es_ES",
        en: "en_GB",
        de: "de_DE",
        it: "it_IT",
        zh: "zh_CN",
      }[locale],
      images: [
        {
          url: "/og-maripepa.jpg",
          width: 1200,
          height: 630,
          alt: "Granja Maripepa · " + title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-maripepa.jpg"],
    },
    robots:
      locale === "es" || locale === "en"
        ? {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-image-preview": "large",
              "max-snippet": -1,
              "max-video-preview": -1,
            },
          }
        : { index: false, follow: true },
  };
}
