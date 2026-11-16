import { notFound } from "next/navigation";
import { Link } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  MapPin,
} from "lucide-react";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import { editorialMetadata } from "@/components/editorial/metadata";
import { fetchPublicJob, fetchPublicJobs } from "@/lib/public-content";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { PublicLiveRefresh } from "@/components/live/PublicLiveRefresh";
import styles from "@/components/editorial/careers.module.css";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  const live = await fetchPublicJob(params.slug);
  const job = live.job;
  if (!job) {
    return editorialMetadata(
      params.locale,
      "/trabaja-con-nosotros",
      "Trabaja con nosotros | Maripepa",
      "Ofertas de empleo en Lorca y Viator.",
    );
  }
  return editorialMetadata(
    params.locale,
    `/trabaja-con-nosotros/${job.slug}`,
    `${job.title} — ${job.location} | Maripepa`,
    `${job.title} en ${job.location}. ${job.description}`,
  );
}

export default async function JobPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  const live = await fetchPublicJob(params.slug);
  const job = live.job;
  if (!job) notFound();

  const isEs = params.locale === "es";
  const applyHref = `/${params.locale}/trabaja-con-nosotros?puesto=${encodeURIComponent(job.slug)}#careers-cv`;
  const liveJobs = await fetchPublicJobs();
  const related = (liveJobs ?? [])
    .filter((item) => item.slug !== job.slug)
    .slice(0, 3);

  const applyCard = (
    <>
      <ul className={styles.applyRows}>
        <li>
          <span>{isEs ? "Departamento" : "Department"}</span>
          <b>{job.department}</b>
        </li>
        <li>
          <span>{isEs ? "Sede" : "Location"}</span>
          <b>{job.location}</b>
        </li>
        <li>
          <span>{isEs ? "Jornada" : "Contract"}</span>
          <b>{job.type}</b>
        </li>
        <li>
          <span>{isEs ? "Horario" : "Schedule"}</span>
          <b>{job.schedule}</b>
        </li>
      </ul>
      <a
        href={applyHref}
        className={styles.applyCardCta}
        data-cursor
      >
        <span className={styles.ctaLong}>
          {isEs ? "Enviar candidatura" : "Apply for this role"}
        </span>
        <span className={styles.ctaShort}>{isEs ? "Enviar CV" : "Apply"}</span>
        <ArrowRight size={14} aria-hidden="true" />
      </a>
      <p className={styles.applyNote}>
        {isEs
          ? "Adjunta tu CV en PDF. Respondemos en 5-10 días laborables."
          : "Attach your CV as PDF. We reply within 5-10 working days."}
      </p>
    </>
  );

  return (
    <>
      <Breadcrumbs
        locale={params.locale}
        items={[
          { name: "Trabaja con nosotros", path: "/trabaja-con-nosotros" },
          {
            name: job.title,
            path: `/trabaja-con-nosotros/${job.slug}`,
          },
        ]}
      />
      <PublicLiveRefresh types="jobs,settings" />
      <GMPRoute
        routeId={`career-${job.slug}`}
        mode="journey"
        world="gmp"
        className={styles.careers}
      >
        <Chapter id="role-hero" scene={0} title={job.title} className="hero">
          <div className={styles.detailHero}>
            <div className={styles.detailIntro}>
              <Link href="/trabaja-con-nosotros" className={styles.backLink}>
                <ArrowLeft size={13} aria-hidden="true" />
                {isEs ? "Todas las ofertas" : "All roles"}
              </Link>
              <div className="eyebrow" data-rv="fade">
                <span className={styles.dot} /> {job.department}
              </div>
              <WordReveal as="h1" className="display h-hero">
                {job.title}
              </WordReveal>
              <div className={styles.detailBadges}>
                <span className={styles.badge}>
                  <MapPin size={12} aria-hidden="true" /> {job.location}
                </span>
                <span className={styles.badge}>
                  <Briefcase size={12} aria-hidden="true" /> {job.type}
                </span>
                <span className={styles.badge}>
                  <Clock size={12} aria-hidden="true" /> {job.schedule}
                </span>
              </div>
              <p className={styles.detailLead}>{job.description}</p>
            </div>
            <aside
              className={styles.detailSide}
              aria-label={isEs ? "Solicitar el puesto" : "Apply"}
            >
              {applyCard}
            </aside>
          </div>
          <div className="hero-foot">
            <div className={`chapters ${styles.detailChapters}`}>
              {[
                {
                  label: isEs ? "Funciones" : "Role",
                  note: isEs ? "El día a día" : "Day to day",
                  href: "#role-detail",
                },
                {
                  label: isEs ? "Requisitos" : "Requirements",
                  note: isEs ? "Qué valoramos" : "What we value",
                  href: "#role-requirements",
                },
                {
                  label: isEs ? "Ofertas" : "Roles",
                  note: isEs ? "Otros puestos" : "Other openings",
                  href: "#role-related",
                },
              ].map((item, index) => (
                <a
                  key={item.label}
                  className="chip"
                  href={item.href}
                  data-rv="up"
                  data-cursor
                >
                  <span className="num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="tx">
                    <b>{item.label}</b>
                    <p>{item.note}</p>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </Chapter>

        <Chapter id="role-detail" scene={1}>
          <div className="sec-head">
            <span className="k">01 — {isEs ? "La oferta" : "The role"}</span>
            <span className="rule" />
            <span className="k">{job.department}</span>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailMain}>
              <h2>{isEs ? "Qué vas a hacer" : "What you will do"}</h2>
              <p>{job.description}</p>
              <ul className={styles.checkList}>
                {job.responsibilities.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>

              <h2 id="role-requirements">
                {isEs ? "Qué pedimos" : "What we ask"}
              </h2>
              <ul className={styles.checkList}>
                {job.requirements.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>

              <h2>{isEs ? "Qué ofrecemos" : "What we offer"}</h2>
              <ul className={styles.checkList}>
                {job.offers.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>

              {(job.details ?? []).length > 0 ? (
                <>
                  <h2>{isEs ? "Detalles" : "Details"}</h2>
                  <dl className={styles.detailList}>
                    {(job.details ?? []).map((detail) => (
                      <div key={`${detail.label}-${detail.value}`}>
                        <dt>{detail.label}</dt>
                        <dd>{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}
            </div>

            <div className={styles.stickySide}>
              <div className={styles.processCard}>
                <span className={styles.processCardK}>
                  {isEs ? "Cómo sigue" : "What happens next"}
                </span>
                <ol>
                  <li>
                    <b>01</b>
                    <span>
                      {isEs ? "Recibimos tu currículum" : "We receive your CV"}
                    </span>
                  </li>
                  <li>
                    <b>02</b>
                    <span>{isEs ? "Lo revisa RRHH" : "HR reviews it"}</span>
                  </li>
                  <li>
                    <b>03</b>
                    <span>{isEs ? "Hablamos contigo" : "We talk to you"}</span>
                  </li>
                </ol>
                <p>
                  {isEs
                    ? "Respondemos en 5-10 días laborables."
                    : "We reply within 5-10 working days."}
                </p>
                <a
                  href={applyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                >
                  {isEs ? "Enviar candidatura" : "Send application"}
                  <ArrowRight size={12} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </Chapter>

        <Chapter id="role-related" scene={2}>
          <div className="sec-head">
            <span className="k">
              02 — {isEs ? "Otras ofertas" : "Other roles"}
            </span>
            <span className="rule" />
            <span className="k">LORCA · VIATOR</span>
          </div>
          <div className={styles.relatedHead}>
            <WordReveal as="h2" className="display h-sec">
              {isEs ? "También estamos buscando" : "We are also hiring"}
            </WordReveal>
          </div>
          <ul className={styles.relatedList}>
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/trabaja-con-nosotros/${item.slug}`}
                  className={styles.relatedRow}
                  data-cursor
                >
                  <span>
                    <b>{item.title}</b>
                    <span className={styles.relatedMeta}>
                      {item.department} · {item.location}
                    </span>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.detailBack}>
            <Link href="/trabaja-con-nosotros" className={styles.backLink}>
              <ArrowLeft size={13} aria-hidden="true" />
              {isEs ? "Volver a todas las ofertas" : "Back to all roles"}
            </Link>
          </div>
        </Chapter>
      </GMPRoute>
    </>
  );
}
