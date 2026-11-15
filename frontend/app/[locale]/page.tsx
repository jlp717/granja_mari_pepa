import type { Locale } from "@/i18n";
import { KageRoute } from "@/components/kage/KageRoute";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { getKageHomeCopy } from "@/lib/kage-home-copy";
import { createKageMetadata } from "@/lib/kage-seo";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const copy = getKageHomeCopy(params.locale);
  return createKageMetadata(
    params.locale,
    "",
    copy.seoTitle,
    copy.seoDescription,
  );
}
export default async function HomePage(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  return (
    <KageRoute routeId="home" mode="journey" world="gmp">
      <HomeEditorial locale={params.locale} />
    </KageRoute>
  );
}
