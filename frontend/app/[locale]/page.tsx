import type { Locale } from "@/i18n";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { HomeEditorial } from "@/components/home/HomeEditorial";
import { getGMPHomeCopy } from "@/lib/gmp-home-copy";
import { createGMPMetadata } from "@/lib/gmp-seo";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const copy = getGMPHomeCopy(params.locale);
  return createGMPMetadata(
    params.locale,
    "",
    copy.seoTitle,
    copy.seoDescription,
  );
}
export default async function HomePage(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  return (
    <GMPRoute routeId="home" mode="journey" world="gmp">
      <HomeEditorial locale={params.locale} />
    </GMPRoute>
  );
}
