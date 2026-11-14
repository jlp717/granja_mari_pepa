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
    namespace: "legal.privacy",
  });
  return editorialMetadata(
    params.locale,
    "/legal/privacidad",
    t("title"),
    t("intro"),
  );
}
export default async function PrivacyPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  return <EditorialLegal locale={params.locale} kind="privacy" />;
}
