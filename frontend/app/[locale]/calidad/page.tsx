import { EditorialStory } from "@/components/editorial/EditorialStory";
import { getStoryCopy } from "@/components/editorial/copy";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const copy = getStoryCopy("calidad", params.locale);
  return editorialMetadata(
    params.locale,
    "/calidad",
    copy.seo.title,
    copy.seo.description,
  );
}
export default async function QualityPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  return <EditorialStory storyId="calidad" locale={params.locale} />;
}
