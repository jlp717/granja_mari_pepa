import "server-only";
import type { Locale } from "@/i18n";
import { STORIES_ES, type EditorialStoryId } from "./content.es";
import { STORY_TRANSLATIONS_EN } from "./content.en";
import { FAQ_ES, CONTACT_ES, UI_ES } from "./support.es";
import { SUPPORT_EN } from "./support.en";
import type {
  ContactCopy,
  EditorialTranslation,
  FaqCopy,
  StoryCopy,
  UICopy,
} from "./types";

const english: EditorialTranslation = {
  stories: {
    acerca: STORY_TRANSLATIONS_EN.acerca,
    lorca: STORY_TRANSLATIONS_EN.lorca,
    calidad: STORY_TRANSLATIONS_EN.calidad,
    reparto: STORY_TRANSLATIONS_EN.reparto,
  },
  faq: SUPPORT_EN.faq,
  contact: SUPPORT_EN.contact,
  ui: SUPPORT_EN.ui,
};
const translations: Partial<Record<Locale, EditorialTranslation>> = {
  en: english,
  de: english,
  it: english,
  zh: english,
};
function translation(locale: string) {
  return translations[locale as Locale];
}

export function getStoryCopy(id: EditorialStoryId, locale: string): StoryCopy {
  const base = STORIES_ES[id];
  const text = translation(locale)?.stories[id];
  return {
    ...base,
    ...(text || {}),
    chapters: base.chapters.map((chapter, index) => ({
      ...chapter,
      ...(text?.chapters[index] || {}),
      id: chapter.id,
      scene: chapter.scene,
      layout: chapter.layout,
    })),
    manifesto: { ...base.manifesto, ...text?.manifesto },
  };
}
export function getFaqCopy(locale: string): FaqCopy {
  const text = translation(locale)?.faq;
  return {
    ...FAQ_ES,
    ...(text || {}),
    groups: FAQ_ES.groups.map((group, index) => ({
      ...group,
      ...text?.groups[index],
      id: group.id,
      scene: group.scene,
    })),
  };
}
export function getContactCopy(locale: string): ContactCopy {
  return translation(locale)?.contact || CONTACT_ES;
}
export function getUICopy(locale: string): UICopy {
  return translation(locale)?.ui || UI_ES;
}
