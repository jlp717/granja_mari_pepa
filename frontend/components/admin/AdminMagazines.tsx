"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Download,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import styles from "./admin.module.css";
import {
  emptyMagazine,
  formatAdminDate,
  type Magazine,
} from "./admin-data";

interface AdminMagazinesProps {
  magazines: Magazine[];
  newRequest: number;
  onSave: (magazine: Magazine) => Promise<void>;
  onDelete: (magazine: Magazine) => void;
  onToggle: (magazine: Magazine) => void;
  onUpload: (file: File) => Promise<{ url: string; name: string }>;
}

interface MagazineErrors {
  title?: string;
  edition?: string;
  date?: string;
  pdf?: string;
  cover?: string;
}

export function AdminMagazines({
  magazines,
  newRequest,
  onSave,
  onDelete,
  onToggle,
  onUpload,
}: AdminMagazinesProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Magazine["status"]>("all");
  const [editing, setEditing] = useState<Magazine | null>(null);
  const [errors, setErrors] = useState<MagazineErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const lastRequest = useRef(0);

  useEffect(() => {
    if (newRequest === lastRequest.current) return;
    lastRequest.current = newRequest;
    if (newRequest > 0) {
      setEditing(emptyMagazine());
      setErrors({});
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

  const filtered = magazines
    .filter((magazine) => {
      if (status !== "all" && magazine.status !== status) return false;
      if (!query.trim()) return true;
      const term = query.trim().toLowerCase();
      return (
        magazine.title.toLowerCase().includes(term) ||
        magazine.edition.toLowerCase().includes(term) ||
        magazine.description.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const openNew = () => {
    setEditing(emptyMagazine());
    setErrors({});
  };

  const openEdit = (magazine: Magazine) => {
    setEditing({ ...magazine });
    setErrors({});
  };

  const set = <K extends keyof Magazine>(key: K, value: Magazine[K]) =>
    setEditing((current) => (current ? { ...current, [key]: value } : current));

  const upload = async (kind: "pdf" | "cover", file: File | undefined) => {
    if (!file) return;
    if (kind === "pdf") {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setErrors((current) => ({ ...current, pdf: "El archivo debe ser un PDF." }));
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrors((current) => ({ ...current, pdf: "El PDF no puede superar 20 MB." }));
        return;
      }
      setErrors((current) => ({ ...current, pdf: undefined }));
      setUploading(true);
      try {
        const stored = await onUpload(file);
        set("pdfName", stored.name);
        set("pdfUrl", stored.url);
      } catch (failure) {
        setErrors((current) => ({
          ...current,
          pdf: failure instanceof Error ? failure.message : "No se pudo subir el PDF.",
        }));
      } finally {
        setUploading(false);
      }
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, cover: "La portada debe ser una imagen." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, cover: "La imagen no puede superar 5 MB." }));
      return;
    }
    setErrors((current) => ({ ...current, cover: undefined }));
    setUploading(true);
    try {
      const stored = await onUpload(file);
      set("coverUrl", stored.url);
    } catch (failure) {
      setErrors((current) => ({
        ...current,
        cover: failure instanceof Error ? failure.message : "No se pudo subir la portada.",
      }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const nextErrors: MagazineErrors = {};
    if (editing.title.trim().length < 3) nextErrors.title = "Escribe un título.";
    if (editing.edition.trim().length < 3) nextErrors.edition = "Indica la edición.";
    if (!editing.date) nextErrors.date = "Selecciona una fecha.";
    if (!editing.pdfUrl && !editing.pdfName) nextErrors.pdf = "Adjunta el PDF de la revista.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const now = new Date().toISOString();
    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        ...editing,
        title: editing.title.trim(),
        edition: editing.edition.trim(),
        description: editing.description.trim(),
        priority: Math.min(9, Math.max(0, Math.round(Number(editing.priority) || 0))),
        validUntil: editing.validUntil ? editing.validUntil.slice(0, 10) : null,
        updatedAt: now,
        createdAt: editing.createdAt || now,
      });
      setEditing(null);
    } catch (failure) {
      setSubmitError(
        failure instanceof Error ? failure.message : "No se pudo guardar la revista.",
      );
    } finally {
      setSaving(false);
    }
  };

  const isExisting = editing ? magazines.some((item) => item.id === editing.id) : false;

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Biblioteca comercial</span>
          <h1 className={styles.pageTitle}>Revistas</h1>
          <p className={styles.pageDesc}>
            Publica los catálogos y revistas que aparecen en la web. Cada edición guarda su
            PDF y su fecha de publicación.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openNew}>
          <Plus size={15} aria-hidden="true" /> Nueva revista
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar revista o edición"
            aria-label="Buscar revistas"
            className={styles.searchInput}
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className={styles.selectInput}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todas</option>
          <option value="published">Publicadas</option>
          <option value="draft">Borradores</option>
        </select>
        <span className={styles.toolbarCount}>{filtered.length} de {magazines.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><BookOpen size={20} aria-hidden="true" /></span>
          <h2>No hay revistas con esos filtros</h2>
          <p>Añade una edición nueva o cambia la búsqueda.</p>
          <button type="button" className={styles.secondaryBtn} onClick={openNew}>
            Nueva revista
          </button>
        </div>
      ) : (
        <div className={styles.magGrid}>
          {filtered.map((magazine) => (
            <article key={magazine.id} className={styles.magCard}>
              <div className={styles.magCover}>
                {magazine.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin mock preview uses a blob URL
                  <img src={magazine.coverUrl} alt="" />
                ) : (
                  <div className={styles.magCoverText}>
                    <span>MARIPEPA</span>
                    <b>{magazine.title || "Revista"}</b>
                    <em>{magazine.edition || "Sin edición"}</em>
                  </div>
                )}
              </div>
              <div className={styles.magInfo}>
                <div className={styles.magTopline}>
                  <span className={styles.kicker}>{formatAdminDate(magazine.date)}</span>
                  <span className={styles.statusStack}>
                    <span className={`${styles.status} ${magazine.status === "published" ? styles.status_green : styles.status_amber}`}>
                      {magazine.status === "published" ? "Publicada" : "Borrador"}
                    </span>
                    {magazine.expired ? (
                      <span className={`${styles.status} ${styles.status_red}`}>Caducada</span>
                    ) : null}
                  </span>
                </div>
                <h2>{magazine.title || "Sin título"}</h2>
                <p>{magazine.edition || "Sin edición"}</p>
                <span className={styles.metaLine}>
                  Prioridad {magazine.priority ?? 0} ·{" "}
                  {magazine.validUntil
                    ? `Vigente hasta ${formatAdminDate(magazine.validUntil)}`
                    : "Sin caducidad"}
                </span>
                <span className={styles.magFile}>
                  <FileText size={13} aria-hidden="true" />
                  {magazine.pdfName || "Sin PDF"}
                </span>
                <div className={styles.magActions}>
                  {magazine.pdfUrl ? (
                    <a
                      href={magazine.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionBtn}
                      title="Abrir PDF"
                      aria-label={`Abrir PDF de ${magazine.title}`}
                    >
                      <Download size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                  <button type="button" className={styles.actionBtn} onClick={() => openEdit(magazine)} title="Editar revista" aria-label={`Editar ${magazine.title}`}>
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onToggle(magazine)}
                    title={magazine.status === "published" ? "Pasar a borrador" : "Publicar"}
                    aria-label={magazine.status === "published" ? `Despublicar ${magazine.title}` : `Publicar ${magazine.title}`}
                  >
                    {magazine.status === "published" ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                    onClick={() => onDelete(magazine)}
                    title="Eliminar revista"
                    aria-label={`Eliminar ${magazine.title}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <div className={styles.overlay}>
          <form
            className={styles.drawer}
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="magazine-editor-title"
          >
            <header className={styles.drawerHead}>
              <div>
                <span className={styles.kicker}>{isExisting ? "Editar revista" : "Nueva revista"}</span>
                <h2 id="magazine-editor-title">{editing.title || "Revista sin título"}</h2>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setEditing(null)} aria-label="Cerrar editor">
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.drawerBody}>
              <section className={styles.formSection}>
                <h3>Datos de la edición</h3>
                <div className={styles.formGrid}>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Título *</span>
                    <input
                      value={editing.title}
                      onChange={(event) => {
                        set("title", event.target.value);
                        if (errors.title) setErrors((current) => ({ ...current, title: undefined }));
                      }}
                      className={`${styles.input} ${errors.title ? styles.inputBad : ""}`}
                      autoFocus
                    />
                    {errors.title ? <em className={styles.fieldError}>{errors.title}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Edición *</span>
                    <input
                      value={editing.edition}
                      onChange={(event) => {
                        set("edition", event.target.value);
                        if (errors.edition) setErrors((current) => ({ ...current, edition: undefined }));
                      }}
                      className={`${styles.input} ${errors.edition ? styles.inputBad : ""}`}
                      placeholder="Noviembre 2026"
                    />
                    {errors.edition ? <em className={styles.fieldError}>{errors.edition}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Fecha *</span>
                    <input
                      type="date"
                      value={editing.date.slice(0, 10)}
                      onChange={(event) => set("date", event.target.value)}
                      className={`${styles.input} ${errors.date ? styles.inputBad : ""}`}
                    />
                    {errors.date ? <em className={styles.fieldError}>{errors.date}</em> : null}
                  </label>
                  <label className={styles.field}>
                    <span>Estado</span>
                    <select
                      value={editing.status}
                      onChange={(event) => set("status", event.target.value as Magazine["status"])}
                      className={styles.selectInput}
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicada</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>Prioridad</span>
                    <input
                      type="number"
                      min={0}
                      max={9}
                      step={1}
                      value={editing.priority ?? 0}
                      onChange={(event) =>
                        set("priority", Math.min(9, Math.max(0, Number(event.target.value) || 0)))
                      }
                      className={styles.input}
                    />
                    <em className={styles.formHint}>
                      0 = normal. Más alto sale antes en la web.
                    </em>
                  </label>
                  <label className={styles.field}>
                    <span>Vigencia hasta</span>
                    <input
                      type="date"
                      value={(editing.validUntil || "").slice(0, 10)}
                      onChange={(event) => set("validUntil", event.target.value || null)}
                      className={styles.input}
                    />
                    <em className={styles.formHint}>
                      Pasada esta fecha deja de mostrarse en la web. No se borra: sigue
                      aquí para prorrogarla.
                    </em>
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Descripción</span>
                    <textarea
                      rows={3}
                      value={editing.description}
                      onChange={(event) => set("description", event.target.value)}
                      className={styles.textarea}
                    />
                  </label>
                </div>
              </section>

              <section className={styles.formSection}>
                <h3>Archivos</h3>
                <div className={styles.formGrid}>
                  <label className={`${styles.uploadBox} ${errors.pdf ? styles.inputBad : ""}`}>
                    <Upload size={16} aria-hidden="true" />
                    <span>{editing.pdfName || "Adjuntar PDF de la revista"}</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(event) => upload("pdf", event.target.files?.[0])}
                      className={styles.uploadInput}
                    />
                  </label>
                  <label className={styles.uploadBox}>
                    <Upload size={16} aria-hidden="true" />
                    <span>{editing.coverUrl ? "Cambiar portada" : "Añadir portada (opcional)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => upload("cover", event.target.files?.[0])}
                      className={styles.uploadInput}
                    />
                  </label>
                </div>
                {errors.pdf ? <em className={styles.fieldError}>{errors.pdf}</em> : null}
                {errors.cover ? <em className={styles.fieldError}>{errors.cover}</em> : null}
                <p className={styles.formHint}>
                  {uploading
                    ? "Subiendo el archivo al servidor de la empresa…"
                    : "El PDF y la portada se guardan en el almacenamiento del servidor. Los cambios se aplican a la web al publicar la edición."}
                </p>
              </section>
              {submitError ? <p className={styles.fieldError}>{submitError}</p> : null}
            </div>
            <footer className={styles.drawerFoot}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={saving || uploading}>
                {saving ? "Guardando…" : "Guardar revista"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
