import { EditorialStory } from "@/components/editorial/EditorialStory";
import { getStoryCopy } from "@/components/editorial/copy";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const copy = getStoryCopy("lorca", params.locale);
  return editorialMetadata(
    params.locale,
    "/lorca",
    copy.seo.title,
    copy.seo.description,
  );
}
export default async function LorcaPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return <EditorialStory storyId="lorca" locale={params.locale} />;
}
