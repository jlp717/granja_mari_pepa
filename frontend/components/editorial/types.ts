import type { GMPScene } from "@/components/gmp/contracts";
import type { CONTACT_ES, UI_ES } from "./support.es";
import type { EditorialStoryId } from "./content.es";

export interface QuestionCopy {
  question: string;
  answer: string;
}
export interface SeoCopy {
  title: string;
  description: string;
}
export type UICopy = { [Key in keyof typeof UI_ES]: string };
export type ContactCopy = {
  [Key in Exclude<keyof typeof CONTACT_ES, "questions" | "seo">]: string;
} & { questions: readonly QuestionCopy[]; seo: SeoCopy };
export interface ChapterShot {
  image: string;
  title: string;
  caption: string;
  href: string;
}
export interface FactEntry {
  label: string;
  value: string;
  note?: string;
  href?: string;
}
export interface TimelineEntry {
  year: string;
  title: string;
  text: string;
}
export interface BrandEntry {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  href?: string;
}
export interface ChapterText {
  label: string;
  title: string;
  paragraphs: readonly string[];
  shots?: readonly ChapterShot[];
  facts?: readonly FactEntry[];
  timeline?: readonly TimelineEntry[];
  brands?: readonly BrandEntry[];
}
export interface StoryText {
  title: string;
  eyebrow: string;
  description: string;
  seo: SeoCopy;
  chapters: readonly ChapterText[];
  manifesto: { title: string; text: string; link: string };
}
export interface StoryCopy extends StoryText {
  chapters: readonly (ChapterText & {
    id: string;
    scene: GMPScene;
    layout:
      | "hero"
      | "spread"
      | "atlas"
      | "gallery"
      | "closing"
      | "facts"
      | "timeline"
      | "brands";
  })[];
  manifesto: StoryText["manifesto"] & { href: string };
}
export interface FaqGroupText {
  title: string;
  intro: string;
  questions: readonly QuestionCopy[];
}
export interface FaqText {
  title: string;
  intro: string;
  seo: SeoCopy;
  groups: readonly FaqGroupText[];
}
export interface FaqCopy extends FaqText {
  groups: readonly (FaqGroupText & { id: string; scene: GMPScene })[];
}
export interface EditorialTranslation {
  stories: Record<EditorialStoryId, StoryText>;
  faq: FaqText;
  contact: ContactCopy;
  ui: UICopy;
}
