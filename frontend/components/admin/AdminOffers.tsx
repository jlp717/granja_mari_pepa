"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Copy,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import styles from "./admin.module.css";
import {
  DEPARTMENTS,
  LOCATIONS,
  jobIconLabel,
  resolveJobAccent,
  resolveJobIconName,
} from "@/components/editorial/careers-data";
import {
  JOB_ACCENTS,
  JOB_ICONS,
  emptyJob,
  formatAdminDate,
  slugify,
  uniqueSlug,
  type AdminJob,
  type JobDetail,
} from "./admin-data";

interface AdminOffersProps {
  jobs: AdminJob[];
  newRequest: number;
  onSave: (job: AdminJob) => Promise<void>;
  onDelete: (job: AdminJob) => void;
  onDuplicate: (job: AdminJob) => void;
  onToggle: (job: AdminJob) => void;
}

interface JobErrors {
  title?: string;
  slug?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
}

const statusLabel = (status: AdminJob["status"]) =>
  status === "published" ? "Publicada" : "Borrador";

export function AdminOffers({
  jobs,
  newRequest,
  onSave,
  onDelete,
  onDuplicate,
  onToggle,
}: AdminOffersProps) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState<"all" | AdminJob["status"]>("all");
  const [editing, setEditing] = useState<AdminJob | null>(null);
  const [errors, setErrors] = useState<JobErrors>({});
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const lastRequest = useRef(0);

  useEffect(() => {
    if (newRequest === lastRequest.current) return;
    lastRequest.current = newRequest;
    if (newRequest > 0) {
      setEditing(emptyJob());
      setErrors({});
      setSlugEdited(false);
    }
  }, [newRequest]);

  useEffect(() => {
    if (!editing) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [editing]);

  const departments = DEPARTMENTS.filter((item) => item !== "Todos");
  const locations = LOCATIONS.filter((item) => item !== "Todas");

  const filtered = jobs
    .filter((job) => {
      if (department !== "all" && job.department !== department) return false;
      if (status !== "all" && job.status !== status) return false;
      if (!query.trim()) return true;
      const term = query.trim().toLowerCase();
      return (
        job.title.toLowerCase().includes(term) ||
        job.department.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.slug.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const openNew = () => {
    setEditing(emptyJob());
    setErrors({});
    setSlugEdited(false);
  };

  const openEdit = (job: AdminJob) => {
    setEditing({
      ...job,
      icon: jobIconLabel(job.icon),
      responsibilities: [...job.responsibilities],
      requirements: [...job.requirements],
      offers: [...job.offers],
    });
    setErrors({});
    setSlugEdited(true);
  };

  const set = <K extends keyof AdminJob>(key: K, value: AdminJob[K]) =>
    setEditing((current) => (current ? { ...current, [key]: value } : current));

  const updateDetails = (next: JobDetail[]) => set("details", next);
  const addDetail = () =>
    updateDetails([...(editing?.details ?? []), { label: "", value: "" }]);
  const removeDetail = (index: number) =>
    updateDetails((editing?.details ?? []).filter((_, i) => i !== index));
  const updateDetail = (index: number, key: "label" | "value", value: string) =>
    updateDetails(
      (editing?.details ?? []).map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    );

  const changeTitle = (value: string) => {
    setEditing((current) => {
      if (!current) return current;
      return {
        ...current,
        title: value,
        slug: slugEdited ? current.slug : slugify(value),
      };
    });
    if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
  };

  const changeSlug = (value: string) => {
    setSlugEdited(true);
    set("slug", slugify(value));
    if (errors.slug) setErrors((current) => ({ ...current, slug: undefined }));
  };

  const listValue = (items: string[]) => items.join("\n");
  // Sin recortar al escribir: el espacio final de cada línea debe sobrevivir
  // mientras se teclea. El recorte ocurre solo al guardar.
  const splitValue = (value: string) => value.split("\n");
  const filled = (items: string[]) => items.filter((item) => item.trim().length > 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const nextErrors: JobErrors = {};
    if (editing.title.trim().length < 3) nextErrors.title = "Escribe un título de al menos 3 caracteres.";
    const slug = slugify(editing.slug || editing.title);
    if (!slug) nextErrors.slug = "La URL de la oferta es obligatoria.";
    else if (jobs.some((job) => job.slug === slug && job.id !== editing.id))
      nextErrors.slug = "Ya existe una oferta con esa URL.";
    if (editing.description.trim().length < 20)
      nextErrors.description = "Describe el puesto con al menos 20 caracteres.";
    if (filled(editing.responsibilities).length === 0)
      nextErrors.responsibilities = "Añade al menos una función.";
    if (filled(editing.requirements).length === 0)
      nextErrors.requirements = "Añade al menos un requisito.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const now = new Date().toISOString();
    const icon = resolveJobIconName(
      editing.icon || editing.department || editing.title,
    );
    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        ...editing,
        icon,
        accent: resolveJobAccent(editing.accent, icon),
        slug: uniqueSlug(slug, jobs, editing.id),
        title: editing.title.trim(),
        description: editing.description.trim(),
        responsibilities: editing.responsibilities.map((item) => item.trim()).filter(Boolean),
        requirements: editing.requirements.map((item) => item.trim()).filter(Boolean),
        offers: editing.offers.map((item) => item.trim()).filter(Boolean),
        updatedAt: now,
        createdAt: editing.createdAt || now,
      });
      setEditing(null);
    } catch (failure) {
      setSubmitError(
        failure instanceof Error ? failure.message : "No se pudo guardar la oferta.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isPublic = editing ? editing.status === "published" : false;
  const isExisting = editing ? jobs.some((job) => job.id === editing.id) : false;
  const previewIcon = resolveJobIconName(
    editing?.icon || editing?.department || editing?.title || "",
  );
  const previewAccent = resolveJobAccent(editing?.accent, previewIcon);

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Contenido público</span>
          <h1 className={styles.pageTitle}>Ofertas de empleo</h1>
          <p className={styles.pageDesc}>
            Crea, edita y publica las vacantes que aparecen en «Trabaja con nosotros».
            {status === "draft" ? " Estás viendo los borradores." : ""}
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openNew}>
          <Plus size={15} aria-hidden="true" /> Nueva oferta
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por puesto, sede o URL"
            aria-label="Buscar ofertas"
            className={styles.searchInput}
          />
        </label>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className={styles.selectInput}
          aria-label="Filtrar por departamento"
        >
          <option value="all">Todos los departamentos</option>
          {departments.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className={styles.selectInput}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          <option value="published">Publicadas</option>
          <option value="draft">Borradores</option>
        </select>
        <span className={styles.toolbarCount}>{filtered.length} de {jobs.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><BriefcaseBusiness size={20} aria-hidden="true" /></span>
          <h2>No hay ofertas con esos filtros</h2>
          <p>Prueba con otra búsqueda o crea una oferta nueva.</p>
          <button type="button" className={styles.secondaryBtn} onClick={openNew}>
            Nueva oferta
          </button>
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Oferta</th>
                  <th>Departamento</th>
                  <th>Sede</th>
                  <th>Estado</th>
                  <th>Actualizada</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((job) => (
                  <tr key={job.id}>
                    <td data-label="Oferta">
                      <button type="button" className={styles.titleCell} onClick={() => openEdit(job)}>
                        <b>{job.title || "Sin título"}</b>
                        <span>/{job.slug || "sin-url"}</span>
                      </button>
                    </td>
                    <td data-label="Departamento">{job.department}</td>
                    <td data-label="Sede">{job.location}</td>
                    <td data-label="Estado">
                      <span className={`${styles.status} ${job.status === "published" ? styles.status_green : styles.status_amber}`}>
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td data-label="Actualizada">{formatAdminDate(job.updatedAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        {job.status === "published" ? (
                          <a
                            href={`/es/trabaja-con-nosotros/${job.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                            title="Ver ficha pública"
                            aria-label={`Ver ${job.title} en la web`}
                          >
                            <ArrowUpRight size={14} aria-hidden="true" />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEdit(job)}
                          title="Editar oferta"
                          aria-label={`Editar ${job.title}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onDuplicate(job)}
                          title="Duplicar oferta"
                          aria-label={`Duplicar ${job.title}`}
                        >
                          <Copy size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onToggle(job)}
                          title={job.status === "published" ? "Pasar a borrador" : "Publicar"}
                          aria-label={job.status === "published" ? `Despublicar ${job.title}` : `Publicar ${job.title}`}
                        >
                          {job.status === "published" ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionDanger}`}
                          onClick={() => onDelete(job)}
                          title="Eliminar oferta"
                          aria-label={`Eliminar ${job.title}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing ? (
        <div className={styles.overlay}>
          <form
            className={styles.drawer}
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-editor-title"
          >
            <header className={styles.drawerHead}>
              <div>
                <span className={styles.kicker}>{isExisting ? "Editar oferta" : "Nueva oferta"}</span>
                <h2 id="job-editor-title">{editing.title || "Oferta sin título"}</h2>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setEditing(null)} aria-label="Cerrar editor">
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.drawerBody}>
              <section className={styles.formSection}>
                <h3>Datos principales</h3>
                <div className={styles.formGrid}>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Título *</span>
                    <input
                      value={editing.title}
                      onChange={(event) => changeTitle(event.target.value)}
                      className={`${styles.input} ${errors.title ? styles.inputBad : ""}`}
                      autoFocus
                    />
                    {errors.title ? <em className={styles.fieldError}>{errors.title}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>URL pública *</span>
                    <input
                      value={editing.slug}
                      onChange={(event) => changeSlug(event.target.value)}
                      className={`${styles.input} ${errors.slug ? styles.inputBad : ""}`}
                      placeholder="mozo-almacen-lorca"
                    />
                    {errors.slug ? <em className={styles.fieldError}>{errors.slug}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Estado</span>
                    <select
                      value={editing.status}
                      onChange={(event) => set("status", event.target.value as AdminJob["status"])}
                      className={styles.selectInput}
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicada</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Departamento</span>
                    <input
                      list="admin-departments"
                      value={editing.department}
                      onChange={(event) => set("department", event.target.value)}
                      className={styles.input}
                      placeholder="Logística"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Sede</span>
                    <input
                      list="admin-locations"
                      value={editing.location}
                      onChange={(event) => set("location", event.target.value)}
                      className={styles.input}
                      placeholder="Lorca (Murcia)"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Jornada</span>
                    <input
                      value={editing.type}
                      onChange={(event) => set("type", event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Horario</span>
                    <input
                      value={editing.schedule}
                      onChange={(event) => set("schedule", event.target.value)}
                      className={styles.input}
                    />
                  </label>
                </div>
                <datalist id="admin-departments">
                  {departments.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                <datalist id="admin-locations">
                  {locations.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </section>

              <section className={styles.formSection}>
                <h3>Campos personalizados</h3>
                <p className={styles.formHint}>
                  Añade lo que necesite esta oferta: salario, convenio, fecha de
                  incorporación, permisos, lo que sea. Se guarda con la oferta y se
                  publica en la web.
                </p>
                {(editing.details ?? []).map((detail, index) => (
                  <div key={index} className={styles.detailRow}>
                    <input
                      value={detail.label}
                      onChange={(event) => updateDetail(index, "label", event.target.value)}
                      className={styles.input}
                      placeholder="Etiqueta (ej. Salario)"
                      aria-label={`Etiqueta del campo ${index + 1}`}
                    />
                    <input
                      value={detail.value}
                      onChange={(event) => updateDetail(index, "value", event.target.value)}
                      className={styles.input}
                      placeholder="Valor (ej. Según convenio)"
                      aria-label={`Valor del campo ${index + 1}`}
                    />
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => removeDetail(index)}
                      aria-label={`Quitar campo ${index + 1}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button type="button" className={styles.secondaryBtn} onClick={addDetail}>
                  <Plus size={14} aria-hidden="true" /> Añadir campo
                </button>
              </section>

              <section className={styles.formSection}>
                <h3>Descripción</h3>
                <label className={styles.field}>
                  <span>Resumen del puesto *</span>
                  <textarea
                    rows={3}
                    value={editing.description}
                    onChange={(event) => {
                      set("description", event.target.value);
                      if (errors.description) setErrors((current) => ({ ...current, description: undefined }));
                    }}
                    className={`${styles.textarea} ${errors.description ? styles.inputBad : ""}`}
                  />
                  {errors.description ? <em className={styles.fieldError}>{errors.description}</em> : null}
                </label>
              </section>

              <section className={styles.formSection}>
                <h3>Ficha de la oferta</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Funciones · una por línea *</span>
                    <textarea
                      rows={5}
                      value={listValue(editing.responsibilities)}
                      onChange={(event) => {
                        set("responsibilities", splitValue(event.target.value));
                        if (errors.responsibilities) setErrors((current) => ({ ...current, responsibilities: undefined }));
                      }}
                      className={`${styles.textarea} ${errors.responsibilities ? styles.inputBad : ""}`}
                    />
                    {errors.responsibilities ? <em className={styles.fieldError}>{errors.responsibilities}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Requisitos · uno por línea *</span>
                    <textarea
                      rows={5}
                      value={listValue(editing.requirements)}
                      onChange={(event) => {
                        set("requirements", splitValue(event.target.value));
                        if (errors.requirements) setErrors((current) => ({ ...current, requirements: undefined }));
                      }}
                      className={`${styles.textarea} ${errors.requirements ? styles.inputBad : ""}`}
                    />
                    {errors.requirements ? <em className={styles.fieldError}>{errors.requirements}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Qué ofrecemos · una por línea</span>
                    <textarea
                      rows={4}
                      value={listValue(editing.offers)}
                      onChange={(event) => set("offers", splitValue(event.target.value))}
                      className={styles.textarea}
                    />
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <h3>Etiqueta visual</h3>
                <div className={styles.formGrid}>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Icono</span>
                    <input
                      list="admin-job-icons"
                      value={editing.icon}
                      onChange={(event) => set("icon", event.target.value)}
                      className={styles.input}
                      placeholder="Escribe el concepto: almacén, reparto, calidad…"
                    />
                    <datalist id="admin-job-icons">
                      {JOB_ICONS.map((icon) => (
                        <option key={icon.value} value={icon.label} />
                      ))}
                    </datalist>
                    <em className={styles.formHint}>
                      Acepta cualquier palabra: si no coincide con un icono
                      conocido, se genera uno estable a partir del texto.
                    </em>
                  </label>
                  <div className={styles.field}>
                    <span>Color</span>
                    <div className={styles.swatches}>
                      {JOB_ACCENTS.map((accent) => (
                        <button
                          key={accent}
                          type="button"
                          className={`${styles.swatch} ${editing.accent === accent ? styles.swatchActive : ""}`}
                          style={{ background: accent }}
                          onClick={() => set("accent", accent)}
                          aria-label={`Usar color ${accent}`}
                          aria-pressed={editing.accent === accent}
                        />
                      ))}
                    </div>
                    <div className={styles.colorAuto}>
                      <span
                        className={styles.colorDot}
                        style={{ background: previewAccent }}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => set("accent", "")}
                        aria-pressed={!editing.accent}
                      >
                        {editing.accent ? "Color automático" : "Automático activo"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {isPublic ? (
                <a
                  href={`/es/trabaja-con-nosotros/${editing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.previewLink}
                >
                  Ver ficha pública actual <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ) : (
                <p className={styles.formHint}>
                  Esta oferta está en borrador. Se mostrará en la web al publicarla.
                </p>
              )}
              {submitError ? <p className={styles.fieldError}>{submitError}</p> : null}
            </div>
            <footer className={styles.drawerFoot}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? "Guardando…" : "Guardar oferta"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
