import type { Locale } from "@/i18n";
import { KageRoute } from "@/components/kage/KageRoute";
import { Catalogue } from "@/components/kage/catalogue/Catalogue";
import { getKageCatalogueCopy } from "@/lib/kage-catalogue-copy";
import { createKageMetadata } from "@/lib/kage-seo";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const copy = getKageCatalogueCopy(params.locale);
  return createKageMetadata(
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
    <KageRoute routeId="catalogue" mode="ambient" world="gmp">
      <Catalogue
        locale={params.locale}
        category={searchParams.category}
        brand={searchParams.brand}
      />
    </KageRoute>
  );
}
