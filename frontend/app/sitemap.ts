import type { MetadataRoute } from "next";
import {
  KAGE_CONTENT_UPDATED,
  KAGE_INDEXED_LOCALES,
  KAGE_SITE_URL,
} from "@/lib/kage-seo";
import { fetchPublicJobs } from "@/lib/public-content";

const staticPaths = [
  "",
  "/productos",
  "/acerca",
  "/contacto",
  "/lorca",
  "/calidad",
  "/reparto",
  "/preguntas-frecuentes",
  "/trabaja-con-nosotros",
  "/legal/privacidad",
  "/legal/terminos",
];

// Solo se publican ofertas que existen en el backend. Si el fetch falla o
// devuelve una lista vacia, el sitemap no incluye slugs de empleo para no
// generar URLs que respondan 404.
async function liveJobPaths(): Promise<string[]> {
  const jobs = await fetchPublicJobs();
  if (!jobs) return [];
  const slugs = jobs
    .map((job) => (job.slug ?? "").trim())
    .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug));
  return Array.from(new Set(slugs)).map(
    (slug) => `/trabaja-con-nosotros/${slug}`,
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const livePaths = await liveJobPaths();
  const paths = [...staticPaths, ...livePaths];

  return paths.flatMap((path) =>
    KAGE_INDEXED_LOCALES.map((locale) => ({
      url: KAGE_SITE_URL + "/" + locale + path,
      lastModified: KAGE_CONTENT_UPDATED,
      changeFrequency: path.startsWith("/legal/")
        ? ("yearly" as const)
        : path.startsWith("/trabaja-con-nosotros/")
          ? ("weekly" as const)
          : ("monthly" as const),
      priority:
        path === ""
          ? 1
          : path === "/productos"
            ? 0.9
            : path.startsWith("/legal/")
              ? 0.3
              : path === "/contacto" || path === "/lorca"
                ? 0.8
                : 0.7,
      alternates: {
        languages: Object.fromEntries([
          ...KAGE_INDEXED_LOCALES.map((language) => [
            language,
            KAGE_SITE_URL + "/" + language + path,
          ]),
          ["x-default", KAGE_SITE_URL + "/es" + path],
        ]),
      },
    })),
  );
}
