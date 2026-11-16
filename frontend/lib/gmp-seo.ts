import type { Metadata } from "next";
import type { Locale } from "@/i18n";

export const GMP_SITE_URL = "https://www.mari-pepa.com";
// Update manually whenever public content changes.
export const GMP_CONTENT_UPDATED = new Date("2026-11-16");
export const GMP_LOCALES = ["es", "en", "de", "it", "zh"] as const;
/** Only locales with a complete translation are indexable. The rest remain
 * reachable for users but are excluded from hreflang and sitemap until their
 * editorial copy is translated. */
export const GMP_INDEXED_LOCALES = ["es", "en"] as const;
export function createGMPMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  ogImage?: string,
): Metadata {
  const canonical = GMP_SITE_URL + "/" + locale + path;
  /** Site-wide OG image by default. A per-page override is only valid when the
   * asset is ≥1200×630 and is not upscaled; otherwise keep the global. */
  const ogImageUrl = ogImage ?? "/og-maripepa.jpg";
  return {
    metadataBase: new URL(GMP_SITE_URL),
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...GMP_INDEXED_LOCALES.map((language) => [
          language,
          GMP_SITE_URL + "/" + language + path,
        ]),
        ["x-default", GMP_SITE_URL + "/es" + path],
      ]),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Maripepa",
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
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Maripepa · " + title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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
