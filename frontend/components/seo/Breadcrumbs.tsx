import { KAGE_SITE_URL } from "@/lib/kage-seo";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** JSON-LD only. Visible navigation stays in the page design. */
export function Breadcrumbs({
  locale,
  items,
}: {
  locale: string;
  items: BreadcrumbItem[];
}) {
  const all = [{ name: "Inicio", path: "" }, ...items];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: KAGE_SITE_URL + "/" + locale + item.path,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export default Breadcrumbs;
