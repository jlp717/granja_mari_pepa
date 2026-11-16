import { notFound } from "next/navigation";
import type { Locale } from "@/i18n";
import es from "@/components/home/content/es.json";
import en from "@/components/home/content/en.json";
import de from "@/components/home/content/de.json";
import it from "@/components/home/content/it.json";
import zh from "@/components/home/content/zh.json";

export interface GMPSupport {
  title: string;
  text: string;
}
export interface GMPHomeChapter {
  label: string;
  title: string;
  lead: string;
  supports: readonly GMPSupport[];
  action: string;
}
export interface GMPHomeCopy {
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
  chapters: readonly GMPHomeChapter[];
}
const copies: Record<Locale, GMPHomeCopy> = { es, en, de, it, zh };

export function getGMPHomeCopy(locale: string): GMPHomeCopy {
  if (!Object.prototype.hasOwnProperty.call(copies, locale)) notFound();
  return copies[locale as Locale];
}
