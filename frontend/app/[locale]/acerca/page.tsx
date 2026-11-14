import { EditorialStory } from "@/components/editorial/EditorialStory";
import { getStoryCopy } from "@/components/editorial/copy";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const copy = getStoryCopy("acerca", params.locale);
  return editorialMetadata(
    params.locale,
    "/acerca",
    copy.seo.title,
    copy.seo.description,
  );
}
export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return <EditorialStory storyId="acerca" locale={params.locale} />;
}
