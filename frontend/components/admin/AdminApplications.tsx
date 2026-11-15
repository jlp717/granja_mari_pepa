"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  Mail,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react";
import styles from "./admin.module.css";
import { gmailCompose } from "@/components/editorial/facts";
import {
  APPLICATION_STATUS,
  formatAdminDate,
  type Application,
} from "./admin-data";

interface AdminApplicationsProps {
  applications: Application[];
  onUpdate: (application: Application) => Promise<void>;
  onDelete: (application: Application) => void;
}

export function AdminApplications({
  applications,
  onUpdate,
  onDelete,
}: AdminApplicationsProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Application["status"]>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [draft, setDraft] = useState<Application | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selected && !applications.some((application) => application.id === selected.id)) {
      setSelected(null);
      setDraft(null);
    }
  }, [applications, selected]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  const filtered = applications
    .filter((application) => {
      if (status !== "all" && application.status !== status) return false;
      if (!query.trim()) return true;
      const term = query.trim().toLowerCase();
      return (
        application.name.toLowerCase().includes(term) ||
        application.email.toLowerCase().includes(term) ||
        application.sector.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const open = (application: Application) => {
    setSelected(application);
    setDraft({ ...application });
    setError("");
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const rows = [
      ["Nombre", "Email", "Teléfono", "Sector", "Estado", "Recibida", "CV"],
      ...filtered.map((application) => [
        application.name,
        application.email,
        application.phone,
        application.sector,
        APPLICATION_STATUS[application.status].label,
        application.createdAt.slice(0, 10),
        application.cvName,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `candidaturas-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    try {
      await onUpdate({ ...draft, notes: draft.notes.trim() });
      setSelected(null);
      setDraft(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "No se pudo guardar la candidatura.",
      );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Selección</span>
          <h1 className={styles.pageTitle}>Candidaturas</h1>
          <p className={styles.pageDesc}>
            Revisa los CV recibidos, cambia su estado y deja notas internas para el equipo.
          </p>
        </div>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          <Download size={14} aria-hidden="true" /> Exportar CSV
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}>
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, email o sector"
            aria-label="Buscar candidaturas"
            className={styles.searchInput}
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className={styles.selectInput}
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          {(Object.keys(APPLICATION_STATUS) as Array<Application["status"]>).map((key) => (
            <option key={key} value={key}>{APPLICATION_STATUS[key].label}</option>
          ))}
        </select>
        <span className={styles.toolbarCount}>{filtered.length} de {applications.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><Inbox size={20} aria-hidden="true" /></span>
          <h2>No hay candidaturas con esos filtros</h2>
          <p>Cambia la búsqueda o el estado seleccionado.</p>
        </div>
      ) : (
        <section className={styles.panel}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidatura</th>
                  <th>Puesto / sector</th>
                  <th>Recibida</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((application) => (
                  <tr key={application.id}>
                    <td data-label="Candidatura">
                      <button type="button" className={styles.titleCell} onClick={() => open(application)}>
                        <b>{application.name}</b>
                        <span>{application.email}</span>
                      </button>
                    </td>
                    <td data-label="Puesto / sector">
                      {application.jobTitle || application.sector}
                    </td>
                    <td data-label="Recibida">{formatAdminDate(application.createdAt)}</td>
                    <td data-label="Estado">
                      <span className={`${styles.status} ${styles[`status_${APPLICATION_STATUS[application.status].tone}`]}`}>
                        {APPLICATION_STATUS[application.status].label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => open(application)}
                        aria-label={`Abrir candidatura de ${application.name}`}
                      >
                        <ChevronRight size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && draft ? (
        <div className={styles.overlay}>
          <form
            className={styles.drawer}
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-title"
          >
            <header className={styles.drawerHead}>
              <div>
                <span className={styles.kicker}>Candidatura</span>
                <h2 id="application-title">{selected.name}</h2>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  setSelected(null);
                  setDraft(null);
                }}
                aria-label="Cerrar candidatura"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.drawerBody}>
              <section className={styles.applicationSummary}>
                <span className={styles.avatarLarge}>{selected.name.slice(0, 1)}</span>
                <div>
                  <b>{selected.name}</b>
                  <span>
                    {selected.jobTitle ? `${selected.jobTitle} · ` : ""}
                    {selected.sector} · {formatAdminDate(selected.createdAt)}
                  </span>
                </div>
              </section>

              <section className={styles.contactGrid}>
                <a
                  href={gmailCompose(
                    selected.email,
                    selected.jobTitle
                      ? `Respuesta a tu candidatura — ${selected.jobTitle}`
                      : "Respuesta a tu candidatura — Granja Maripepa",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Mail size={14} aria-hidden="true" />
                  {selected.email}
                </a>
                <a href={`tel:${selected.phone.replace(/\s/g, "")}`}>
                  <Phone size={14} aria-hidden="true" />
                  {selected.phone}
                </a>
              </section>

              <section className={styles.formSection}>
                <h3>Mensaje de la candidatura</h3>
                <p className={styles.messageText}>
                  {selected.message || "Sin mensaje."}
                </p>
                <div className={styles.cvRow}>
                  <FileText size={15} aria-hidden="true" />
                  <span>{selected.cvName || "Sin CV adjunto"}</span>
                  {selected.cvUrl ? (
                    <a href={selected.cvUrl} target="_blank" rel="noopener noreferrer">
                      Abrir CV
                    </a>
                  ) : (
                    <small>El CV llegará adjunto en las candidaturas de la web.</small>
                  )}
                </div>
              </section>

              <section className={styles.formSection}>
                <h3>Seguimiento</h3>
                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Estado</span>
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value as Application["status"] })
                      }
                      className={styles.selectInput}
                    >
                      {(Object.keys(APPLICATION_STATUS) as Array<Application["status"]>).map((key) => (
                        <option key={key} value={key}>{APPLICATION_STATUS[key].label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={`${styles.field} ${styles.fieldWide}`}>
                    <span>Notas internas</span>
                    <textarea
                      rows={4}
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                      className={styles.textarea}
                      placeholder="Llamadas, entrevistas, impresiones…"
                    />
                  </label>
                </div>
                {error ? <p className={styles.fieldError}>{error}</p> : null}
              </section>
            </div>
            <footer className={styles.drawerFoot}>
              <button
                type="button"
                className={styles.dangerGhost}
                onClick={() => onDelete(selected)}
              >
                <Trash2 size={14} aria-hidden="true" /> Eliminar
              </button>
              <span className={styles.drawerFootSpacer} />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setSelected(null);
                  setDraft(null);
                }}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn}>
                <Check size={15} aria-hidden="true" /> Guardar cambios
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
