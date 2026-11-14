import { EditorialContact } from "@/components/editorial/EditorialContact";
import { getContactCopy, getUICopy } from "@/components/editorial/copy";
import { editorialMetadata } from "@/components/editorial/metadata";
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const copy = getContactCopy(params.locale);
  return editorialMetadata(
    params.locale,
    "/contacto",
    copy.seo.title,
    copy.seo.description,
  );
}
export default async function ContactPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  return (
    <EditorialContact
      copy={getContactCopy(params.locale)}
      ui={getUICopy(params.locale)}
    />
  );
}
