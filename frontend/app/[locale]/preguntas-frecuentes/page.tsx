import { EditorialFaq } from "@/components/editorial/EditorialFaq";
import { getFaqCopy } from "@/components/editorial/copy";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const copy = getFaqCopy(params.locale);
  return editorialMetadata(
    params.locale,
    "/preguntas-frecuentes",
    copy.seo.title,
    copy.seo.description,
  );
}
export default async function QuestionsPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  return <EditorialFaq locale={params.locale} />;
}
