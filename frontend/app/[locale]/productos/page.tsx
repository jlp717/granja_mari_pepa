import type { Locale } from "@/i18n";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Catalogue } from "@/components/gmp/catalogue/Catalogue";
import { getGMPCatalogueCopy } from "@/lib/gmp-catalogue-copy";
import { createGMPMetadata } from "@/lib/gmp-seo";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const copy = getGMPCatalogueCopy(params.locale);
  return createGMPMetadata(
    params.locale,
    "/productos",
    copy.seoTitle,
    copy.seoDescription,
  );
}
export default async function ProductsPage(
  props: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ category?: string | string[]; brand?: string | string[] }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return (
    <GMPRoute routeId="catalogue" mode="ambient" world="gmp">
      <Catalogue
        locale={params.locale}
        category={searchParams.category}
        brand={searchParams.brand}
      />
    </GMPRoute>
  );
}
