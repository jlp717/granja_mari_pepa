import { EditorialCareers } from "@/components/editorial/EditorialCareers";
import { editorialMetadata } from "@/components/editorial/metadata";
import { fetchPublicJobs } from "@/lib/public-content";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { PublicLiveRefresh } from "@/components/live/PublicLiveRefresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  return editorialMetadata(
    params.locale,
    "/trabaja-con-nosotros",
    "Trabaja con nosotros | Maripepa",
    "Únete al equipo de Maripepa. Ofertas de empleo en Lorca y Viator. Envía tu currículum.",
  );
}

export default async function CareersPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const live = await fetchPublicJobs();
  return (
    <>
      <Breadcrumbs
        locale={params.locale}
        items={[
          { name: "Trabaja con nosotros", path: "/trabaja-con-nosotros" },
        ]}
      />
      <PublicLiveRefresh types="jobs,settings" />
      <EditorialCareers locale={params.locale} jobs={live ?? []} />
    </>
  );
}
