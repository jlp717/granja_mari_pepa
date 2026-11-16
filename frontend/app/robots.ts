import type { MetadataRoute } from "next";
import { GMP_SITE_URL } from "@/lib/gmp-seo";
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
const allow = [
  "/",
  "/_next/static/",
  "/images/",
  "/og-maripepa.jpg",
  "/manifest.json",
  "/catalogs/",
];
const disallow = [
  "/api/",
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
];
/** Crawler metadata only. Authentication and route access remain unchanged.
 * Existing directives are archived in docs/redesign/fuentes/seo-before.json. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow, disallow },
      // Explicitly allow response/citation crawlers; CCBot only trains models and returns no traffic.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow,
        disallow,
      },
    ],
    sitemap: GMP_SITE_URL + "/sitemap.xml",
  };
}
