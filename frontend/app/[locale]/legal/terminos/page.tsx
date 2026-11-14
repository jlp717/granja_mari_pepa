import { EditorialLegal } from "@/components/editorial/EditorialLegal";
import { getTranslations } from "next-intl/server";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: "legal.terms",
  });
  return editorialMetadata(
    params.locale,
    "/legal/terminos",
    t("title"),
    t("intro"),
  );
}
export default async function TermsPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  return <EditorialLegal locale={params.locale} kind="terms" />;
}
