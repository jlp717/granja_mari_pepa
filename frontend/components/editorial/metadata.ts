import type { Metadata } from "next";
import type { Locale } from "@/i18n";
import { createKageMetadata } from "@/lib/kage-seo";
const languages = ["es", "en", "de", "it", "zh"] as const;
export function editorialMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
): Metadata {
  const valid = languages.includes(locale as Locale)
    ? (locale as Locale)
    : "es";
  return createKageMetadata(valid, path, title, description);
}
