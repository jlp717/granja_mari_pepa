import { notFound } from "next/navigation";
import type { Locale } from "@/i18n";
import es from "@/components/home/content/es.json";
import en from "@/components/home/content/en.json";
import de from "@/components/home/content/de.json";
import it from "@/components/home/content/it.json";
import zh from "@/components/home/content/zh.json";

export interface KageSupport {
  title: string;
  text: string;
}
export interface KageHomeChapter {
  label: string;
  title: string;
  lead: string;
  supports: readonly KageSupport[];
  action: string;
}
export interface KageHomeCopy {
  seoTitle: string;
  seoDescription: string;
  scroll: string;
  illustration: string;
  products: string;
  contact: string;
  read: string;
  familyNames: readonly string[];
  brandsTitle: string;
  brandsIntro: string;
  phone: string;
  email: string;
  hours: string;
  schedule: string;
  catalogueNotice: string;
  chapters: readonly KageHomeChapter[];
}
const copies: Record<Locale, KageHomeCopy> = { es, en, de, it, zh };

export function getKageHomeCopy(locale: string): KageHomeCopy {
  if (!Object.prototype.hasOwnProperty.call(copies, locale)) notFound();
  return copies[locale as Locale];
}
