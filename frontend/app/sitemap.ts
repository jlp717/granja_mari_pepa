import type { MetadataRoute } from "next";
import {
  KAGE_INDEXED_LOCALES,
  KAGE_SITE_URL,
} from "@/lib/kage-seo";
import { JOBS } from "@/components/editorial/careers-data";

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

const jobPaths = JOBS.map((job) => `/trabaja-con-nosotros/${job.slug}`);
const paths = [...staticPaths, ...jobPaths];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return paths.flatMap((path) =>
    KAGE_INDEXED_LOCALES.map((locale) => ({
      url: KAGE_SITE_URL + "/" + locale + path,
      lastModified: now,
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
