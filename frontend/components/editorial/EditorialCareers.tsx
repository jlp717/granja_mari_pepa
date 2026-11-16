"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import { GMPRoute } from "@/components/gmp/GMPRoute";
import { Chapter } from "@/components/gmp/Chapter";
import { WordReveal } from "@/components/gmp/WordReveal";
import {
  Warehouse,
  Truck,
  TrendingUp,
  FileText,
  Shield,
  MapPin,
  Upload,
  Search,
  X,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
  GraduationCap,
  HeartHandshake,
  HardHat,
  Compass,
} from "lucide-react";
import styles from "./careers.module.css";
import {
  DEPARTMENTS,
  LOCATIONS,
  SECTORS,
  type Job,
  type JobIcon,
} from "./careers-data";

const ICONS: Record<JobIcon, typeof Warehouse> = {
  warehouse: Warehouse,
  truck: Truck,
  sales: TrendingUp,
  admin: FileText,
  quality: Shield,
};

type BadField = "nombre" | "email" | "telefono" | "file";

const FIELD_ERROR: Record<BadField, { es: string; en: string }> = {
  nombre: { es: "Escribe tu nombre y apellidos.", en: "Enter your full name." },
  email: { es: "Introduce un email válido.", en: "Enter a valid email." },
  telefono: {
    es: "Introduce un teléfono de contacto.",
    en: "Enter a contact phone number.",
  },
  file: {
    es: "Adjunta tu currículum en PDF.",
    en: "Attach your resume as PDF.",
  },
};

const BENEFITS = [
  {
    icon: Compass,
    title: "Trabajo con propósito",
    text: "Servimos a cocinas y negocios de Murcia y Almería. Lo que haces llega a la mesa.",
  },
  {
    icon: Clock,
    title: "Sin sorpresas",
    text: "Las condiciones, los turnos y las rutas se explican antes de empezar.",
  },
  {
    icon: GraduationCap,
    title: "Formación real",
    text: "Producto, seguridad alimentaria, PRL y manejo de sistemas desde el primer día.",
  },
  {
    icon: Users,
    title: "Equipo cercano",
    text: "Equipos pequeños, trato directo con responsables y decisiones que se explican.",
  },
  {
    icon: HeartHandshake,
    title: "Conciliación",
    text: "Turnos definidos y planificación con antelación para que puedas organizarte.",
  },
  {
    icon: HardHat,
    title: "Seguridad primero",
    text: "EPIs, formación en prevención y protocolos claros en almacén y reparto.",
  },
];

const HIRING_STEPS = [
  {
    title: "Candidatura",
    text: "Envías tu CV por el formulario o por email. Son cuatro datos y el CV.",
  },
  {
    title: "Revisión",
    text: "Una persona del equipo de RRHH lee tu perfil y lo contrasta con la vacante.",
  },
  {
    title: "Entrevista",
    text: "Conversación telefónica o presencial con el responsable del área.",
  },
  {
    title: "Incorporación",
    text: "Bienvenida, formación inicial y entrega de equipos de protección.",
  },
];

const FAQ = [
  {
    q: "¿Necesito experiencia previa?",
    a: "No siempre. Valoramos la actitud y las ganas de aprender. Algunos puestos requieren experiencia específica (comercial, calidad), pero otros como mozo de almacén o repartidor admiten perfiles sin experiencia.",
  },
  {
    q: "¿Qué horarios tienen?",
    a: "Depende del puesto. Almacén y reparto: turnos de mañana y tarde. Administración: jornada de oficina. Comercial: según zona asignada.",
  },
  {
    q: "¿Ofrecen formación?",
    a: "Sí. Formación en producto, seguridad alimentaria, manejo de sistemas y PRL. La formación es continua y adaptada al puesto.",
  },
  {
    q: "¿Puedo enviar mi CV aunque no haya ofertas?",
    a: "Sí. Usa el formulario de candidatura abierta. Revisamos cada candidatura y contactamos si encaja en el proceso.",
  },
  {
    q: "¿Dónde están las sedes?",
    a: "Sede principal en Lorca (Murcia) y delegación en Viator (Almería).",
  },
];

export function EditorialCareers({
  locale,
  jobs,
}: {
  locale: string;
  jobs: Job[];
}) {
  const isEs = locale === "es";
  const [dept, setDept] = useState("Todos");
  const [loc, setLoc] = useState("Todas");
  const [search, setSearch] = useState("");
  const [cvSector, setCvSector] = useState("Otro");
  const [cvSubmitted, setCvSubmitted] = useState(false);
  const [cvSending, setCvSending] = useState(false);
  const [cvError, setCvError] = useState("");
  const [cvInvalid, setCvInvalid] = useState<BadField[]>([]);
  const [cvFileName, setCvFileName] = useState("");
  const cvFormRef = useRef<HTMLFormElement>(null);
  const cvMessageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!cvInvalid.length) return;
    cvFormRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [cvInvalid]);

  const growMessage = () => {
    const field = cvMessageRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  };

  const cvEmailHref = "#candidatura";

  const filtered = jobs.filter((job) => {
    if (dept !== "Todos" && job.department !== dept) return false;
    if (loc !== "Todas" && job.location !== loc) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !job.title.toLowerCase().includes(q) &&
        !job.description.toLowerCase().includes(q) &&
        !job.department.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
  const hasFilters = dept !== "Todos" || loc !== "Todas" || search !== "";
  const clearFilters = () => {
    setDept("Todos");
    setLoc("Todas");
    setSearch("");
  };

  async function handleCvSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("cv-nombre") || "").trim();
    const email = String(fd.get("cv-email") || "").trim();
    const phone = String(fd.get("cv-telefono") || "").trim();
    const message = String(fd.get("cv-mensaje") || "").trim();
    const jobSlug = String(fd.get("cv-puesto") || "").trim();
    const selectedJob = jobs.find((item) => item.slug === jobSlug);
    const file = fd.get("cv-file") as File | null;
    const bad: BadField[] = [];
    if (name.length < 2) bad.push("nombre");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push("email");
    if (phone.replace(/\D/g, "").length < 9) bad.push("telefono");
    if (!file || file.size === 0) bad.push("file");
    else if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      bad.push("file");
    }
    setCvInvalid(bad);
    if (bad.length) {
      setCvError(
        isEs
          ? `Faltan ${bad.length === 1 ? "un dato" : `${bad.length} datos`}: revisa lo marcado en rojo.`
          : `Missing ${bad.length === 1 ? "one field" : `${bad.length} fields`}: check what is marked in red.`,
      );
      return;
    }
    setCvError("");
    setCvSending(true);
    const timeoutMs = 20000;
    try {
      const cvResponse = await fetch(
        `/api/public/cv?name=${encodeURIComponent(file!.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/pdf" },
          body: file,
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
      const cvData = (await cvResponse.json().catch(() => null)) as {
        url?: string;
        name?: string;
        message?: string;
      } | null;
      if (!cvResponse.ok || !cvData?.url) {
        throw new Error(
          cvData?.message ||
            (isEs
              ? "No se pudo subir el currículum."
              : "Could not upload your resume."),
        );
      }
      const response = await fetch("/api/public/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          sector: cvSector,
          message,
          jobId: jobSlug,
          jobTitle: selectedJob?.title || "",
          cvName: cvData.name || file!.name,
          cvUrl: cvData.url,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEs
              ? "No se pudo enviar la candidatura."
              : "Could not send your application."),
        );
      }
      setCvSubmitted(true);
    } catch (failure) {
      const timedOut =
        failure instanceof DOMException && failure.name === "TimeoutError";
      setCvError(
        timedOut
          ? isEs
            ? "El envío ha tardado demasiado. Revisa tu conexión y vuelve a intentarlo."
            : "The upload took too long. Check your connection and try again."
          : failure instanceof Error
            ? failure.message
            : isEs
              ? "No se pudo enviar la candidatura."
              : "Could not send your application.",
      );
    } finally {
      setCvSending(false);
    }
  }

  const invalid = (f: BadField) => cvInvalid.includes(f);
  const badClass = (f: BadField) => (invalid(f) ? styles.fieldBad : "");
  const badAttr = (f: BadField) => ({
    "aria-invalid": invalid(f) || undefined,
    "aria-describedby": invalid(f) ? `cv-${f}-err` : undefined,
  });
  const fieldErr = (f: BadField) =>
    invalid(f) ? (
      <em className={styles.fieldErr} id={`cv-${f}-err`}>
        {isEs ? FIELD_ERROR[f].es : FIELD_ERROR[f].en}
      </em>
    ) : null;

  return (
    <>
      <GMPRoute
        routeId="careers"
        mode="journey"
        world="gmp"
        className={styles.careers}
      >
        {/* ── Hero ── */}
        <Chapter
          id="careers-hero"
          scene={0}
          className="hero"
          title={isEs ? "Trabaja con nosotros" : "Work with us"}
        >
          <div className={styles.heroGrid}>
            <div className={styles.heroIntro}>
              <div className="eyebrow" data-rv="fade">
                <span className={styles.dot} />{" "}
                {isEs
                  ? "Equipo · HORECA · Lorca y Almería"
                  : "Team · HORECA · Lorca & Almería"}
              </div>
              <WordReveal as="h1" className="display h-hero">
                {isEs ? "Únete a Granja Maripepa" : "Join Granja Maripepa"}
              </WordReveal>
              <p className="hero-sub body">
                {isEs
                  ? "Distribuimos alimentación a la hostelería de Murcia y Almería. Buscamos personas que quieran hacerlo bien, todos los días."
                  : "We distribute food to hospitality across Murcia and Almería. We look for people who want to do it well, every day."}
              </p>
              <div className={styles.heroActions}>
                <a href="#careers-jobs" className="arrowlink" data-cursor>
                  <span>{isEs ? "Ver ofertas" : "See open roles"}</span>
                  <span className="ar" aria-hidden="true">
                    <svg viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 11 11 3M5 3h6v6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                    </svg>
                  </span>
                </a>
                <a href="#careers-cv" className="arrowlink" data-cursor>
                  <span>
                    {isEs ? "Enviar candidatura" : "Send application"}
                  </span>
                  <span className="ar" aria-hidden="true">
                    <svg viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 11 11 3M5 3h6v6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </div>

            <aside
              className={styles.livePanel}
              aria-label={isEs ? "Ofertas abiertas" : "Open roles"}
            >
              <div className={styles.liveHead}>
                <span>{isEs ? "Ahora mismo" : "Right now"}</span>
                <b>
                  {jobs.length} {isEs ? "puestos" : "roles"}
                </b>
              </div>
              <ul className={styles.liveList}>
                {jobs.slice(0, 5).map((job) => (
                  <li key={job.slug}>
                    <Link
                      href={`/trabaja-con-nosotros/${job.slug}`}
                      className={styles.liveRow}
                      data-cursor
                    >
                      <span
                        className={styles.liveDot}
                        style={{ background: job.accent }}
                        aria-hidden="true"
                      />
                      <span className={styles.liveBody}>
                        <span className={styles.liveTitle}>{job.title}</span>
                        <span className={styles.liveMeta}>
                          {job.department} · {job.location}
                        </span>
                      </span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <a href="#careers-jobs" className={styles.liveAll} data-cursor>
                {isEs ? "Ver las ofertas" : "See all roles"}{" "}
                <span aria-hidden="true">↓</span>
              </a>
            </aside>
          </div>

          <div className="hero-foot">
            <div className="chapters">
              {[
                {
                  label: isEs ? "Por qué" : "Why",
                  note: isEs ? "Lo que puedes esperar" : "What to expect",
                  href: "#careers-why",
                },
                {
                  label: isEs ? "Ofertas" : "Openings",
                  note: isEs
                    ? `${jobs.length} puestos abiertos`
                    : `${jobs.length} open roles`,
                  href: "#careers-jobs",
                },
                {
                  label: isEs ? "Proceso" : "Process",
                  note: isEs ? "4 pasos" : "4 steps",
                  href: "#careers-process",
                },
                {
                  label: isEs ? "Candidatura" : "Application",
                  note: isEs ? "Envía tu CV" : "Send your CV",
                  href: "#careers-cv",
                },
              ].map((ch, i) => (
                <a
                  key={ch.label}
                  className="chip"
                  href={ch.href}
                  data-rv="up"
                  data-cursor
                >
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="tx">
                    <b>{ch.label}</b>
                    <p>{ch.note}</p>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </Chapter>

        {/* ── Why ── */}
        <Chapter
          id="careers-why"
          scene={1}
          title={isEs ? "Por qué trabajar aquí" : "Why work here"}
        >
          <div className="sec-head">
            <span className="k">
              02 — {isEs ? "Lo que ofrecemos" : "What we offer"}
            </span>
            <span className="rule" />
            <span className="k">LORCA · VIATOR</span>
          </div>
          <div className={styles.whyGrid}>
            <div className={styles.whyIntro}>
              <WordReveal as="h2" className="display h-sec">
                {isEs
                  ? "Un trabajo que se entiende"
                  : "Work you can understand"}
              </WordReveal>
              <p className="lead" data-rv="up">
                {isEs
                  ? "Sin cultura de folleto: explicamos qué se hace en cada puesto, con qué medios y en qué horario. Si encaja, lo sabrás desde la primera conversación."
                  : "No brochure culture: we explain what each role does, with what means and on what schedule. If it fits, you will know from the first conversation."}
              </p>
            </div>
            <ul className={styles.benefitList}>
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} data-rv="up">
                    <span className={styles.benefitNum}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.benefitIcon}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className={styles.benefitBody}>
                      <h3>{b.title}</h3>
                      <p>{b.text}</p>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.plantStrip} data-rv="up">
            <figure className={styles.plantShot}>
              <Image
                src="/gmp/careers/careers-facility.jpg"
                alt={
                  isEs
                    ? "Nave de Granja Maripepa en el Polígono Saprelorca, Lorca"
                    : "Granja Maripepa warehouse at Saprelorca, Lorca"
                }
                fill
                sizes="(max-width: 1080px) 100vw, 46vw"
              />
              <figcaption>
                {isEs ? "Lorca · Pol. Saprelorca" : "Lorca · Saprelorca"}
              </figcaption>
            </figure>
            <div className={styles.plantCopy}>
              <h3>
                {isEs ? "Dos sedes, el mismo equipo" : "Two sites, one team"}
              </h3>
              <p>
                {isEs
                  ? "Trabajamos desde Lorca (Murcia) y Viator (Almería). Las rutas, el almacén y la atención al cliente se coordinan entre las dos sedes."
                  : "We work from Lorca (Murcia) and Viator (Almería). Routes, warehouse and customer service are coordinated across both sites."}
              </p>
              <ul className={styles.plantPlaces}>
                <li>
                  <MapPin size={14} aria-hidden="true" />
                  <span>
                    <b>Lorca (Murcia)</b>
                    {isEs
                      ? "Av. Francisco Jimeno Sola, 3 · Pol. Saprelorca"
                      : "Av. Francisco Jimeno Sola, 3 · Saprelorca industrial park"}
                  </span>
                </li>
                <li>
                  <MapPin size={14} aria-hidden="true" />
                  <span>
                    <b>Viator (Almería)</b>
                    {isEs
                      ? "C/ Sierra de Ronda, 26 · Pol. La Juaida"
                      : "C/ Sierra de Ronda, 26 · La Juaida industrial park"}
                  </span>
                </li>
              </ul>
              <div className={styles.plantLinks}>
                <a
                  className={styles.plantLink}
                  href="https://maps.google.com/?q=Granja+Mari+Pepa+Lorca"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                >
                  {isEs ? "Ver Lorca en Maps" : "Lorca in Maps"}
                  <ArrowRight size={12} aria-hidden="true" />
                </a>
                <a
                  className={styles.plantLink}
                  href="https://maps.google.com/?q=Calle+Sierra+de+Ronda+26+Viator+Almeria"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor
                >
                  {isEs ? "Ver Viator en Maps" : "Viator in Maps"}
                  <ArrowRight size={12} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </Chapter>

        {/* ── Jobs ── */}
        <Chapter
          id="careers-jobs"
          scene={2}
          title={isEs ? "Ofertas disponibles" : "Open positions"}
        >
          <div className="sec-head">
            <span className="k">03 — {isEs ? "Ofertas" : "Openings"}</span>
            <span className="rule" />
            <span className="k">
              {jobs.length} {isEs ? "abiertas" : "open"}
            </span>
          </div>
          <div className={styles.jobsHead}>
            <WordReveal as="h2" className="display h-sec">
              {isEs ? "Encuentra tu puesto" : "Find your role"}
            </WordReveal>
            <p className="lead" data-rv="up">
              {isEs
                ? "Filtra por departamento, sede o palabra clave. Cada oferta tiene su ficha con responsabilidades, requisitos y condiciones."
                : "Filter by department, site or keyword. Every role has its own page with responsibilities, requirements and conditions."}
            </p>
          </div>

          <div className={styles.filterBar} role="search">
            <div className={styles.searchWrap}>
              <Search
                size={16}
                className={styles.searchIcon}
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isEs
                    ? "Buscar puesto o departamento"
                    : "Search role or department"
                }
                aria-label={isEs ? "Buscar puesto" : "Search role"}
                className={styles.searchInput}
              />
              {search && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearch("")}
                  aria-label={isEs ? "Borrar búsqueda" : "Clear search"}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <label className={styles.selectWrap}>
              <span>{isEs ? "Departamento" : "Department"}</span>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === "Todos" ? (isEs ? "Todos" : "All") : d}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.selectWrap}>
              <span>{isEs ? "Sede" : "Location"}</span>
              <select value={loc} onChange={(e) => setLoc(e.target.value)}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l === "Todas" ? (isEs ? "Todas" : "All") : l}
                  </option>
                ))}
              </select>
            </label>
            {hasFilters && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearFilters}
                data-cursor
              >
                {isEs ? "Limpiar" : "Clear"} <X size={13} />
              </button>
            )}
          </div>

          <div className={styles.resultLine}>
            <span>
              <b>{filtered.length}</b>{" "}
              {isEs
                ? filtered.length === 1
                  ? "oferta"
                  : "ofertas"
                : filtered.length === 1
                  ? "role"
                  : "roles"}
            </span>
            {hasFilters && (
              <span className={styles.activeFilters}>
                {dept !== "Todos" && (
                  <button type="button" onClick={() => setDept("Todos")}>
                    {dept} <X size={11} />
                  </button>
                )}
                {loc !== "Todas" && (
                  <button type="button" onClick={() => setLoc("Todas")}>
                    {loc} <X size={11} />
                  </button>
                )}
                {search && (
                  <button type="button" onClick={() => setSearch("")}>
                    “{search}” <X size={11} />
                  </button>
                )}
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState} data-rv="up">
              <Search
                size={30}
                className={styles.emptyIcon}
                aria-hidden="true"
              />
              <h3>
                {jobs.length === 0
                  ? isEs
                    ? "Ahora mismo no hay vacantes abiertas"
                    : "No open roles right now"
                  : isEs
                    ? "Ninguna oferta coincide"
                    : "No roles match"}
              </h3>
              <p>
                {jobs.length === 0
                  ? isEs
                    ? "Déjanos tu CV y te tendremos en cuenta para las próximas incorporaciones."
                    : "Leave us your CV and we will keep you in mind for upcoming roles."
                  : isEs
                    ? "Prueba con otros filtros o envíanos tu CV. Siempre estamos abiertos a conocer gente."
                    : "Try other filters or send us your CV. We are always open to meeting people."}
              </p>
              {jobs.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clearFilters}
                >
                  {isEs ? "Ver todas las ofertas" : "See all roles"}
                </button>
              ) : (
                <a className={styles.clearBtn} href="#careers-cv">
                  {isEs ? "Enviar candidatura" : "Send application"}
                </a>
              )}
            </div>
          ) : (
            <ul className={styles.jobList}>
              {filtered.map((job) => {
                const Icon = ICONS[job.icon];
                return (
                  <li key={job.slug} data-rv="up">
                    <Link
                      href={`/trabaja-con-nosotros/${job.slug}`}
                      className={styles.jobRow}
                      data-cursor
                    >
                      <span
                        className={styles.jobIcon}
                        style={{ color: job.accent }}
                      >
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className={styles.jobMain}>
                        <span className={styles.jobDept}>{job.department}</span>
                        <h3>{job.title}</h3>
                        <span className={styles.jobMeta}>
                          <MapPin size={13} aria-hidden="true" /> {job.location}
                          <span aria-hidden="true">·</span> {job.type}
                        </span>
                      </span>
                      <span className={styles.jobGo}>
                        <span className={styles.jobGoLabel}>
                          {isEs ? "Ver oferta" : "View role"}
                        </span>
                        <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Chapter>

        {/* ── Process ── */}
        <Chapter
          id="careers-process"
          scene={3}
          title={isEs ? "Proceso de selección" : "Hiring process"}
        >
          <div className="sec-head">
            <span className="k">04 — {isEs ? "Proceso" : "Process"}</span>
            <span className="rule" />
            <span className="k">4 {isEs ? "pasos" : "steps"}</span>
          </div>
          <div className={styles.processHead}>
            <WordReveal as="h2" className="display h-sec">
              {isEs ? "Sin laberintos" : "No mazes"}
            </WordReveal>
            <p className="lead" data-rv="up">
              {isEs
                ? "Cuatro pasos, plazos claros y una persona de referencia. Te decimos en qué punto está tu candidatura."
                : "Four steps, clear timelines and one contact person. We tell you where your application stands."}
            </p>
          </div>
          <ol className={styles.process}>
            {HIRING_STEPS.map((step, i) => (
              <li key={step.title} className={styles.processStep} data-rv="up">
                <span className={styles.processNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.processBody}>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </span>
              </li>
            ))}
          </ol>
        </Chapter>

        {/* ── CV ── */}
        <Chapter
          id="careers-cv"
          scene={4}
          title={isEs ? "Envía tu CV" : "Send your CV"}
        >
          <div className="sec-head">
            <span className="k">
              05 — {isEs ? "Candidatura abierta" : "Open application"}
            </span>
            <span className="rule" />
            <span className="k">RRHH</span>
          </div>
          <div className={styles.cvGrid}>
            <div className={styles.cvIntro}>
              <WordReveal as="h2" className="display h-sec">
                {isEs ? "¿No ves tu puesto?" : "Don't see your role?"}
              </WordReveal>
              <p className="lead" data-rv="up">
                {isEs
                  ? "Envíanos tu currículum e indica el sector que te interesa. Lo revisamos y te escribimos si encaja en una vacante futura."
                  : "Send us your CV and tell us which sector interests you. We review it and contact you if a future opening fits."}
              </p>
              <div className={styles.cvContact} data-rv="up">
                <span>
                  {isEs
                    ? "Las candidaturas se registran solo desde este formulario"
                    : "Applications are recorded only through this form"}
                </span>
                <a href={cvEmailHref} data-cursor>
                  {isEs ? "Rellenar candidatura" : "Fill in the form"}
                </a>
              </div>
              <ul className={styles.cvNotes}>
                <li>
                  <CheckCircle size={14} aria-hidden="true" />{" "}
                  {isEs
                    ? "Revisamos todas las candidaturas"
                    : "We review every application"}
                </li>
                <li>
                  <CheckCircle size={14} aria-hidden="true" />{" "}
                  {isEs ? "CV en PDF" : "CV in PDF"}
                </li>
                <li>
                  <CheckCircle size={14} aria-hidden="true" />{" "}
                  {isEs ? (
                    <>
                      Datos tratados solo para selección.{" "}
                      <Link href="/legal/privacidad">
                        Política de privacidad
                      </Link>
                    </>
                  ) : (
                    <>
                      Data used only for recruitment.{" "}
                      <Link href="/legal/privacidad">Privacy policy</Link>
                    </>
                  )}
                </li>
              </ul>
            </div>

            {cvSubmitted ? (
              <div className={styles.successState} data-rv="up">
                <CheckCircle
                  size={34}
                  className={styles.successIcon}
                  aria-hidden="true"
                />
                <h3>
                  {isEs ? "Candidatura recibida" : "Application received"}
                </h3>
                <p>
                  {isEs
                    ? "Gracias por tu interés. Te contactaremos si encajas en alguna vacante."
                    : "Thank you for your interest. We will contact you if you fit an opening."}
                </p>
              </div>
            ) : (
              <form
                ref={cvFormRef}
                className={styles.cvForm}
                noValidate
                onSubmit={handleCvSubmit}
              >
                <div className={styles.formRow}>
                  <label className={`${styles.field} ${badClass("nombre")}`}>
                    <span>{isEs ? "Nombre y apellidos" : "Full name"} *</span>
                    <input
                      name="cv-nombre"
                      type="text"
                      required
                      autoComplete="name"
                      {...badAttr("nombre")}
                    />
                    {fieldErr("nombre")}
                  </label>
                  <label className={`${styles.field} ${badClass("email")}`}>
                    <span>Email *</span>
                    <input
                      name="cv-email"
                      type="email"
                      required
                      autoComplete="email"
                      {...badAttr("email")}
                    />
                    {fieldErr("email")}
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label className={`${styles.field} ${badClass("telefono")}`}>
                    <span>{isEs ? "Teléfono" : "Phone"} *</span>
                    <input
                      name="cv-telefono"
                      type="tel"
                      required
                      autoComplete="tel"
                      {...badAttr("telefono")}
                    />
                    {fieldErr("telefono")}
                  </label>
                  <label className={styles.field}>
                    <span>
                      {isEs ? "Sector de interés" : "Sector of interest"} *
                    </span>
                    <select
                      name="cv-sector"
                      value={cvSector}
                      onChange={(e) => setCvSector(e.target.value)}
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={styles.field}>
                  <span>
                    {isEs
                      ? "Puesto al que aplicas"
                      : "Role you are applying for"}
                  </span>
                  <select name="cv-puesto" defaultValue="">
                    <option value="">
                      {isEs ? "Candidatura espontánea" : "Open application"}
                    </option>
                    {jobs.map((job) => (
                      <option key={job.slug} value={job.slug}>
                        {job.title} · {job.location}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>
                    {isEs ? "Mensaje (opcional)" : "Message (optional)"}
                  </span>
                  <textarea
                    ref={cvMessageRef}
                    name="cv-mensaje"
                    rows={4}
                    maxLength={4000}
                    placeholder={
                      isEs
                        ? "Cuéntanos tu experiencia, disponibilidad o lo que quieras destacar. Puedes usar varias líneas."
                        : "Tell us about your experience, availability or anything you want to highlight. You can use several lines."
                    }
                    onInput={growMessage}
                    style={{
                      resize: "none",
                      overflowY: "hidden",
                      minHeight: 104,
                    }}
                  />
                </label>
                <label
                  className={`${styles.fileField} ${invalid("file") ? styles.fileFieldBad : ""}`}
                >
                  <Upload size={18} aria-hidden="true" />
                  <span>
                    {cvFileName ||
                      (isEs
                        ? "Adjuntar currículum (PDF)"
                        : "Attach resume (PDF)")}{" "}
                    *
                  </span>
                  <input
                    name="cv-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    onChange={(event) =>
                      setCvFileName(event.currentTarget.files?.[0]?.name ?? "")
                    }
                    {...badAttr("file")}
                  />
                </label>
                {fieldErr("file")}
                {cvError && (
                  <p className={styles.errorMsg} role="alert">
                    {cvError}
                  </p>
                )}
                <button
                  className="cta"
                  type="submit"
                  data-cursor
                  disabled={cvSending}
                >
                  <i aria-hidden="true" />
                  <span>
                    {cvSending
                      ? isEs
                        ? "Enviando…"
                        : "Sending…"
                      : isEs
                        ? "Enviar candidatura"
                        : "Submit application"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </Chapter>

        {/* ── FAQ ── */}
        <Chapter
          id="careers-faq"
          scene={5}
          title={isEs ? "Preguntas frecuentes" : "FAQ"}
        >
          <div className="sec-head">
            <span className="k">06 — FAQ</span>
            <span className="rule" />
            <span className="k">RRHH</span>
          </div>
          <div className={styles.faqGrid}>
            <WordReveal as="h2" className="display h-sec">
              {isEs ? "Antes de aplicar" : "Before you apply"}
            </WordReveal>
            <div className={styles.faqList}>
              {FAQ.map((item) => (
                <details key={item.q} className={styles.faqItem} data-rv="up">
                  <summary data-cursor>
                    <span>{item.q}</span>
                    <span className={styles.faqMark} aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className={styles.closeRail} data-rv="up">
            <span className={styles.closeLabel}>
              {isEs ? "Siguiente paso" : "Next step"}
            </span>
            <div className={styles.closeActions}>
              <a
                href="#careers-jobs"
                className={styles.closeAction}
                data-cursor
              >
                <span>
                  {isEs
                    ? `Ver las ${jobs.length} ofertas`
                    : `See all ${jobs.length} roles`}
                </span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <a href="#careers-cv" className={styles.closeAction} data-cursor>
                <span>{isEs ? "Enviar candidatura" : "Send application"}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <a
                href={cvEmailHref}
                className={styles.closeAction}
                data-cursor
              >
                <span>{isEs ? "Rellenar candidatura" : "Fill in the form"}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </Chapter>
      </GMPRoute>
    </>
  );
}
