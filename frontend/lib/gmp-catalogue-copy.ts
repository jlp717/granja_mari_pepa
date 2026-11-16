import { notFound } from "next/navigation";
import type { Locale } from "@/i18n";
import es from "@/components/gmp/catalogue/content/es.json";
import en from "@/components/gmp/catalogue/content/en.json";

export type GMPCatalogueCopy = typeof es;
const copies: Record<Locale, GMPCatalogueCopy> = {
  es,
  en,
  de: en,
  it: en,
  zh: en,
};
export function getGMPCatalogueCopy(locale: string): GMPCatalogueCopy {
  if (!Object.prototype.hasOwnProperty.call(copies, locale)) notFound();
  return copies[locale as Locale];
}
export function selectCatalogueFamilies(
  copy: GMPCatalogueCopy,
  category: unknown,
  brand: unknown,
) {
  const unsupportedBrand = brand !== undefined && brand !== "grupo-topgel";
  const selected =
    typeof category === "string"
      ? copy.families.find((family) => family.id === category)
      : undefined;
  const invalid = unsupportedBrand || (category !== undefined && !selected);
  return {
    selected: invalid ? undefined : selected,
    invalid,
    families: invalid ? [] : selected ? [selected] : copy.families,
  };
}
