import type { MetadataRoute } from "next";
import { KAGE_SITE_URL } from "@/lib/kage-seo";
const locales = ["es", "en", "de", "it", "zh"];
const privatePaths = [
  "/private",
  "/admin",
  "/dashboard",
  "/area-clientes",
  "/checkout",
  "/login-secure-example",
  "/offline",
];
/** Crawler metadata only. Authentication and route access remain unchanged.
 * Existing directives are archived in docs/redesign/fuentes/seo-before.json. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/_next/static/",
        "/images/",
        "/og-maripepa.jpg",
        "/manifest.json",
        "/catalogs/",
      ],
      disallow: [
        "/_next/",
        "/api/",
        "/.well-known/",
        "/package-lock.json",
        "/yarn.lock",
        "/sw.js",
        "/*?*utm_*",
        "/*?*fbclid*",
        "/*?*gclid*",
        "/checkout/success/",
        "/checkout/cancelled/",
        ...privatePaths,
        ...locales.flatMap((locale) =>
          privatePaths.map((path) => "/" + locale + path),
        ),
      ],
    },
    sitemap: KAGE_SITE_URL + "/sitemap.xml",
  };
}
