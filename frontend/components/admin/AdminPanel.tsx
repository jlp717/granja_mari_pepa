"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import styles from "./admin.module.css";
import {
  AdminApiError,
  APPLICATION_STATUS,
  ROLE_LABEL,
  changePasswordRequest,
  createJobRequest,
  createMagazineRequest,
  deleteApplicationRequest,
  deleteJobRequest,
  deleteMagazineRequest,
  duplicateJobRequest,
  fetchBootstrap,
  fetchSession,
  formatAdminDate,
  formatAdminDateTime,
  inviteMemberRequest,
  loginRequest,
  logoutRequest,
  resendInviteRequest,
  revokeMemberRequest,
  saveSettingsRequest,
  setJobStatusRequest,
  setMagazineStatusRequest,
  updateApplicationRequest,
  updateJobRequest,
  updateMagazineRequest,
  uploadAdminFile,
  type ActivityEntry,
  type AdminJob,
  type AdminSettings,
  type AdminState,
  type AdminUser,
  type Application,
  type Magazine,
  type TeamMember,
} from "./admin-data";
import { AdminOffers } from "./AdminOffers";
import { AdminMagazines } from "./AdminMagazines";
import { AdminApplications } from "./AdminApplications";
import { AdminSecurity } from "./AdminSecurity";

type TabId =
  | "summary"
  | "jobs"
  | "magazines"
  | "applications"
  | "activity"
  | "team"
  | "security"
  | "settings";

const NAV: Array<{
  id: TabId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "summary", label: "Resumen", icon: LayoutDashboard },
  { id: "jobs", label: "Ofertas de empleo", icon: BriefcaseBusiness },
  { id: "magazines", label: "Revistas", icon: BookOpen },
  { id: "applications", label: "Candidaturas", icon: Inbox },
  { id: "activity", label: "Actividad", icon: History },
  { id: "team", label: "Equipo", icon: Users },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
  { id: "settings", label: "Ajustes", icon: Settings },
];

interface ConfirmState {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ToastState {
  id: number;
  message: string;
}

function ActivityIcon({ kind }: { kind: ActivityEntry["kind"] }) {
  const Icon =
    kind === "create"
      ? Plus
      : kind === "update"
        ? Pencil
        : kind === "delete"
          ? Trash2
          : kind === "publish"
            ? Eye
            : kind === "status"
              ? CheckCircle2
              : kind === "settings"
                ? Settings
                : kind === "invite"
                  ? UserPlus
                  : kind === "security"
                    ? ShieldCheck
                    : Clock;
  return <Icon size={14} aria-hidden="true" />;
}

function StatusChip({ status }: { status: Application["status"] }) {
  const meta = APPLICATION_STATUS[status];
  return (
    <span className={`${styles.status} ${styles[`status_${meta.tone}`]}`}>
      {meta.label}
    </span>
  );
}

function Summary({
  state,
  actor,
  onNewJob,
  onNewMagazine,
  onTab,
}: {
  state: AdminState;
  actor: string;
  onNewJob: () => void;
  onNewMagazine: () => void;
  onTab: (tab: TabId) => void;
}) {
  const publishedJobs = state.jobs.filter((job) => job.status === "published").length;
  const draftJobs = state.jobs.length - publishedJobs;
  const publishedMagazines = state.magazines.filter((m) => m.status === "published").length;
  const newApplications = state.applications.filter((a) => a.status === "new").length;
  const byStatus = useMemo(() => {
    const counts: Record<Application["status"], number> = {
      new: 0,
      review: 0,
      interview: 0,
      rejected: 0,
      hired: 0,
    };
    state.applications.forEach((application) => {
      counts[application.status] += 1;
    });
    return counts;
  }, [state.applications]);
  const totalApplications = Math.max(1, state.applications.length);
  const latestApplications = [...state.applications]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const recentActivity = state.activity.slice(0, 5);
  const today = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className={styles.summary}>
      <section className={styles.welcome}>
        <div>
          <span className={styles.kicker}>Panel de administración</span>
          <h1 className={styles.welcomeTitle}>Buenas, {actor}.</h1>
          <p className={styles.welcomeText}>
            Este es el estado de la web hoy, {today}. Los cambios se guardan directamente en
            la base de datos de la empresa.
          </p>
        </div>
        <div className={styles.welcomeActions}>
          <button type="button" className={styles.primaryBtn} onClick={onNewJob}>
            <Plus size={15} aria-hidden="true" /> Nueva oferta
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onNewMagazine}>
            <Plus size={15} aria-hidden="true" /> Nueva revista
          </button>
        </div>
      </section>

      <div className={styles.stats}>
        <button type="button" className={styles.stat} onClick={() => onTab("jobs")}>
          <span className={styles.statIcon}><BriefcaseBusiness size={17} aria-hidden="true" /></span>
          <span className={styles.statK}>Ofertas publicadas</span>
          <b className={styles.statValue}>{publishedJobs}</b>
          <span className={styles.statMeta}>{draftJobs} en borrador</span>
        </button>
        <button type="button" className={styles.stat} onClick={() => onTab("magazines")}>
          <span className={styles.statIcon}><BookOpen size={17} aria-hidden="true" /></span>
          <span className={styles.statK}>Revistas publicadas</span>
          <b className={styles.statValue}>{publishedMagazines}</b>
          <span className={styles.statMeta}>{state.magazines.length} en total</span>
        </button>
        <button type="button" className={styles.stat} onClick={() => onTab("applications")}>
          <span className={styles.statIcon}><Inbox size={17} aria-hidden="true" /></span>
          <span className={styles.statK}>Candidaturas nuevas</span>
          <b className={styles.statValue}>{newApplications}</b>
          <span className={styles.statMeta}>{state.applications.length} recibidas</span>
        </button>
        <button type="button" className={styles.stat} onClick={() => onTab("team")}>
          <span className={styles.statIcon}><ShieldCheck size={17} aria-hidden="true" /></span>
          <span className={styles.statK}>Equipo con acceso</span>
          <b className={styles.statValue}>{state.team.filter((t) => t.status === "active").length}</b>
          <span className={styles.statMeta}>{state.team.filter((t) => t.status === "invited").length} invitación pendiente</span>
        </button>
      </div>

      <div className={styles.panels}>
        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Candidaturas</span>
              <h2 className={styles.panelTitle}>Últimas recibidas</h2>
            </div>
            <button type="button" className={styles.panelLink} onClick={() => onTab("applications")}>
              Ver todas <ChevronRight size={13} aria-hidden="true" />
            </button>
          </header>
          {latestApplications.length ? (
            <ul className={styles.appList}>
              {latestApplications.map((application) => (
                <li key={application.id}>
                  <span className={styles.avatarSmall}>
                    {application.name.slice(0, 1)}
                  </span>
                  <span className={styles.appListBody}>
                    <b>{application.name}</b>
                    <span>{application.sector} · {formatAdminDate(application.createdAt)}</span>
                  </span>
                  <StatusChip status={application.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.panelEmpty}>
              No hay candidaturas todavía. Cuando alguien envíe su CV desde la
              web, aparecerá aquí y en la pestaña Candidaturas.
            </p>
          )}
        </section>

        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Registro</span>
              <h2 className={styles.panelTitle}>Actividad reciente</h2>
            </div>
            <button type="button" className={styles.panelLink} onClick={() => onTab("activity")}>
              Ver todo <ChevronRight size={13} aria-hidden="true" />
            </button>
          </header>
          <ul className={styles.timeline}>
            {recentActivity.map((entry) => (
              <li key={entry.id} className={styles.timelineItem}>
                <span className={styles.timelineDot}><ActivityIcon kind={entry.kind} /></span>
                <span className={styles.timelineBody}>
                  <b>{entry.entity}</b>
                  <span>{entry.detail}</span>
                </span>
                <time>{formatAdminDateTime(entry.at)}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.panels}>
        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Publicación</span>
              <h2 className={styles.panelTitle}>Estado del contenido</h2>
            </div>
          </header>
          <div className={styles.publishBlock}>
            <div className={styles.publishRow}>
              <span>Ofertas visibles</span>
              <b>{publishedJobs} / {state.jobs.length}</b>
            </div>
            <div className={styles.publishBar}>
              <i style={{ width: `${(publishedJobs / Math.max(1, state.jobs.length)) * 100}%` }} />
            </div>
            <ul className={styles.checklist}>
              <li className={draftJobs === 0 ? styles.checkDone : ""}>
                <span>{draftJobs === 0 ? <Check size={13} /> : <Clock size={13} />}</span>
                {draftJobs === 0 ? "Sin ofertas en borrador" : `${draftJobs} oferta${draftJobs === 1 ? "" : "s"} pendiente${draftJobs === 1 ? "" : "s"} de publicar`}
              </li>
              <li className={publishedMagazines > 0 ? styles.checkDone : ""}>
                <span>{publishedMagazines > 0 ? <Check size={13} /> : <Clock size={13} />}</span>
                {publishedMagazines > 0 ? `${publishedMagazines} revista${publishedMagazines === 1 ? "" : "s"} publicada${publishedMagazines === 1 ? "" : "s"}` : "No hay revistas publicadas"}
              </li>
              <li className={newApplications === 0 ? styles.checkDone : ""}>
                <span>{newApplications === 0 ? <Check size={13} /> : <Inbox size={13} />}</span>
                {newApplications === 0 ? "Candidaturas al día" : `${newApplications} candidatura${newApplications === 1 ? "" : "s"} nueva${newApplications === 1 ? "" : "s"} por revisar`}
              </li>
            </ul>
            <button type="button" className={styles.secondaryBtn} onClick={() => onTab("jobs")}>
              Revisar ofertas <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Selección</span>
              <h2 className={styles.panelTitle}>Candidaturas por estado</h2>
            </div>
          </header>
          <div className={styles.statusBars}>
            {(Object.keys(byStatus) as Array<Application["status"]>).map((status) => (
              <div key={status} className={styles.statusBarRow}>
                <span>{APPLICATION_STATUS[status].label}</span>
                <div className={styles.statusBarTrack}>
                  <i
                    className={styles[`bar_${APPLICATION_STATUS[status].tone}`]}
                    style={{ width: `${(byStatus[status] / totalApplications) * 100}%` }}
                  />
                </div>
                <b>{byStatus[status]}</b>
              </div>
            ))}
          </div>
          <button type="button" className={styles.panelLink} onClick={() => onTab("applications")}>
            Abrir candidaturas <ChevronRight size={13} aria-hidden="true" />
          </button>
        </section>
      </div>
    </div>
  );
}

function ActivityView({ activity }: { activity: ActivityEntry[] }) {
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Trazabilidad</span>
          <h1 className={styles.pageTitle}>Actividad</h1>
          <p className={styles.pageDesc}>
            Cada cambio guarda qué se hizo, sobre qué y cuándo. El registro se conserva en
            la base de datos de la empresa.
          </p>
        </div>
      </header>
      <section className={styles.panel}>
        <ul className={styles.activityList}>
          {activity.map((entry) => (
            <li key={entry.id}>
              <span className={styles.activityIcon}><ActivityIcon kind={entry.kind} /></span>
              <span className={styles.activityBody}>
                <b>{entry.entity}</b>
                <span>{entry.detail}</span>
              </span>
              <span className={styles.activityMeta}>
                <b>{entry.user}</b>
                <time>{formatAdminDateTime(entry.at)}</time>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TeamView({
  team,
  currentEmail,
  onInvite,
  onRevoke,
  onResend,
}: {
  team: TeamMember[];
  currentEmail: string;
  onInvite: () => void;
  onRevoke: (member: TeamMember) => void;
  onResend: (member: TeamMember) => void;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Accesos</span>
          <h1 className={styles.pageTitle}>Equipo</h1>
          <p className={styles.pageDesc}>
            Personas con acceso al panel interno. Los permisos se guardan en la base de
            datos y las sesiones se validan en el servidor.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={onInvite}>
          <UserPlus size={15} aria-hidden="true" /> Invitar persona
        </button>
      </header>
      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Persona</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id}>
                  <td data-label="Persona">
                    <span className={styles.personCell}>
                      <span className={styles.avatarSmall}>{member.name.slice(0, 1)}</span>
                      <span>
                        <b>{member.name}</b>
                        <span>
                          {member.username ? `${member.username} · ` : ""}
                          {member.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td data-label="Rol">{ROLE_LABEL[member.role]}</td>
                  <td data-label="Estado">
                    <span className={`${styles.status} ${member.status === "active" ? styles.status_green : styles.status_amber}`}>
                      {member.status === "active" ? "Activo" : "Invitación pendiente"}
                    </span>
                  </td>
                  <td data-label="Último acceso">
                    {member.lastAccess ? formatAdminDate(member.lastAccess) : "–"}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {member.status === "invited" ? (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onResend(member)}
                          title="Reenviar invitación"
                          aria-label={`Reenviar invitación a ${member.name}`}
                        >
                          <Mail size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                      {member.email.toLowerCase() !== currentEmail.toLowerCase() ? (
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionDanger}`}
                          onClick={() => onRevoke(member)}
                          title="Revocar acceso"
                          aria-label={`Revocar acceso a ${member.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className={styles.youTag}>Tú</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SettingsView({
  settings,
  onSave,
  onChangePassword,
}: {
  settings: AdminSettings;
  onSave: (settings: AdminSettings) => Promise<void>;
  onChangePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
}) {
  const [form, setForm] = useState(settings);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordDone, setPasswordDone] = useState("");
  const [changing, setChanging] = useState(false);
  useEffect(() => setForm(settings), [settings]);
  const set = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.rrhhEmail)) {
      setError("Introduce un email de RRHH válido.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudieron guardar los ajustes.");
    } finally {
      setSaving(false);
    }
  };
  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordDone("");
    if (nextPassword.length < 10) {
      setPasswordError("La nueva contraseña debe tener al menos 10 caracteres.");
      return;
    }
    if (nextPassword !== repeatPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setPasswordError("");
    setChanging(true);
    try {
      await onChangePassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setRepeatPassword("");
      setPasswordDone("Contraseña actualizada. Se mantiene tu sesión actual.");
    } catch (failure) {
      setPasswordError(
        failure instanceof Error ? failure.message : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setChanging(false);
    }
  };
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Configuración</span>
          <h1 className={styles.pageTitle}>Ajustes</h1>
          <p className={styles.pageDesc}>
            Contacto de selección y visibilidad pública. Los cambios se guardan en IBM i y
            se aplican a la web al instante.
          </p>
        </div>
      </header>
      <form className={styles.settingsGrid} onSubmit={submit}>
        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>RRHH</span>
              <h2 className={styles.panelTitle}>Contacto de selección</h2>
            </div>
          </header>
          <div className={styles.formStack}>
            <label className={styles.field}>
              <span>Email para candidaturas</span>
              <input
                type="email"
                value={form.rrhhEmail}
                onChange={(event) => set("rrhhEmail", event.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span>Teléfono de contacto</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                className={styles.input}
              />
            </label>
            {error ? <p className={styles.fieldError}>{error}</p> : null}
          </div>
        </section>

        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Publicación</span>
              <h2 className={styles.panelTitle}>Visibilidad en la web</h2>
            </div>
          </header>
          <div className={styles.toggleList}>
            <label className={styles.toggleRow}>
              <span>
                <b>Ofertas visibles</b>
                <small>Mostrar la sección de empleo en la web pública.</small>
              </span>
              <input
                type="checkbox"
                checked={form.offersPublic}
                onChange={(event) => set("offersPublic", event.target.checked)}
                className={styles.toggle}
              />
            </label>
            <label className={styles.toggleRow}>
              <span>
                <b>Candidaturas abiertas</b>
                <small>Permitir el envío de CV desde el formulario.</small>
              </span>
              <input
                type="checkbox"
                checked={form.applicationsOpen}
                onChange={(event) => set("applicationsOpen", event.target.checked)}
                className={styles.toggle}
              />
            </label>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.settingsWide}`}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Notas internas</span>
              <h2 className={styles.panelTitle}>Criterio de selección</h2>
            </div>
          </header>
          <label className={styles.field}>
            <span>Nota visible solo para el equipo</span>
            <textarea
              rows={4}
              value={form.internalNote}
              onChange={(event) => set("internalNote", event.target.value)}
              className={styles.textarea}
            />
          </label>
        </section>

        <div className={styles.settingsActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            <Check size={15} aria-hidden="true" /> {saving ? "Guardando…" : "Guardar ajustes"}
          </button>
        </div>
      </form>

      <form className={styles.settingsGrid} onSubmit={submitPassword}>
        <section className={`${styles.panel} ${styles.settingsWide}`}>
          <header className={styles.panelHead}>
            <div>
              <span className={styles.kicker}>Seguridad</span>
              <h2 className={styles.panelTitle}>Contraseña del panel</h2>
            </div>
          </header>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Contraseña actual</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={styles.input}
              />
            </label>
            <span />
            <label className={styles.field}>
              <span>Nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.field}>
              <span>Repetir nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                className={styles.input}
              />
            </label>
          </div>
          {passwordError ? <p className={styles.fieldError}>{passwordError}</p> : null}
          {passwordDone ? <p className={styles.formHint}>{passwordDone}</p> : null}
          <p className={styles.formHint}>
            La contraseña se guarda cifrada con bcrypt. La sesión está vinculada a la red
            interna de la empresa.
          </p>
          <div className={styles.settingsActions}>
            <button type="submit" className={styles.secondaryBtn} disabled={changing}>
              <ShieldCheck size={15} aria-hidden="true" />
              {changing ? "Actualizando…" : "Cambiar contraseña"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export function AdminPanel() {
  const [state, setState] = useState<AdminState | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [tab, setTab] = useState<TabId>("summary");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [jobRequest, setJobRequest] = useState(0);
  const [magazineRequest, setMagazineRequest] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("editor");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;
        if (!session.authenticated || !session.user) {
          setBooting(false);
          return;
        }
        setUser(session.user);
        const data = await fetchBootstrap();
        if (!cancelled) setState(data);
      } catch (failure) {
        if (!cancelled) {
          setBootError(
            failure instanceof Error
              ? failure.message
              : "No se pudo conectar con la base de datos.",
          );
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!confirm && !inviteOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else setInviteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, inviteOpen]);

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  };

  const refresh = async () => {
    try {
      const data = await fetchBootstrap();
      setState(data);
    } catch (failure) {
      if (failure instanceof AdminApiError && failure.status === 401) {
        setUser(null);
        setState(null);
      }
      throw failure;
    }
  };

  const reportFailure = (failure: unknown, fallback: string) => {
    notify(failure instanceof Error ? failure.message : fallback);
  };

  const openConfirm = (next: ConfirmState) => setConfirm(next);

  const newJob = () => {
    setTab("jobs");
    setJobRequest((value) => value + 1);
    setSidebarOpen(false);
  };
  const newMagazine = () => {
    setTab("magazines");
    setMagazineRequest((value) => value + 1);
    setSidebarOpen(false);
  };

  const saveJob = async (job: AdminJob) => {
    const exists = Boolean(state?.jobs.some((current) => current.id === job.id));
    if (exists) await updateJobRequest(job);
    else await createJobRequest(job);
    await refresh();
    notify(exists ? "Oferta actualizada" : "Oferta creada");
  };

  const deleteJob = (job: AdminJob) => {
    openConfirm({
      title: "Eliminar oferta",
      body: (
        <>
          <b>{job.title}</b> dejará de mostrarse en la web pública. La oferta se conserva
          en la base de datos como eliminada, con su fecha de borrado.
        </>
      ),
      confirmLabel: "Eliminar oferta",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteJobRequest(job);
          await refresh();
          notify("Oferta eliminada");
        } catch (failure) {
          reportFailure(failure, "No se pudo eliminar la oferta.");
        }
      },
    });
  };

  const toggleJob = async (job: AdminJob) => {
    const status: AdminJob["status"] = job.status === "published" ? "draft" : "published";
    try {
      await setJobStatusRequest(job, status);
      await refresh();
      notify(status === "published" ? "Oferta publicada" : "Oferta en borrador");
    } catch (failure) {
      reportFailure(failure, "No se pudo cambiar el estado de la oferta.");
    }
  };

  const duplicateJob = async (job: AdminJob) => {
    try {
      await duplicateJobRequest(job);
      await refresh();
      notify("Oferta duplicada como borrador");
    } catch (failure) {
      reportFailure(failure, "No se pudo duplicar la oferta.");
    }
  };

  const saveMagazine = async (magazine: Magazine) => {
    const exists = Boolean(
      state?.magazines.some((current) => current.id === magazine.id),
    );
    if (exists) await updateMagazineRequest(magazine);
    else await createMagazineRequest(magazine);
    await refresh();
    notify(exists ? "Revista actualizada" : "Revista añadida");
  };

  const deleteMagazine = (magazine: Magazine) => {
    openConfirm({
      title: "Eliminar revista",
      body: (
        <>
          <b>{magazine.title} · {magazine.edition}</b> dejará de enlazarse en la web. El
          registro se conserva como eliminado, con su fecha de borrado.
        </>
      ),
      confirmLabel: "Eliminar revista",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMagazineRequest(magazine);
          await refresh();
          notify("Revista eliminada");
        } catch (failure) {
          reportFailure(failure, "No se pudo eliminar la revista.");
        }
      },
    });
  };

  const toggleMagazine = async (magazine: Magazine) => {
    const status: Magazine["status"] =
      magazine.status === "published" ? "draft" : "published";
    try {
      await setMagazineStatusRequest(magazine, status);
      await refresh();
      notify(status === "published" ? "Revista publicada" : "Revista en borrador");
    } catch (failure) {
      reportFailure(failure, "No se pudo cambiar el estado de la revista.");
    }
  };

  const updateApplication = async (application: Application) => {
    await updateApplicationRequest(application);
    await refresh();
    notify("Candidatura actualizada");
  };

  const deleteApplication = (application: Application) => {
    openConfirm({
      title: "Eliminar candidatura",
      body: (
        <>
          <b>{application.name}</b> y sus notas se conservarán como eliminadas en la base
          de datos, con su fecha de borrado.
        </>
      ),
      confirmLabel: "Eliminar candidatura",
      danger: true,
      onConfirm: async () => {
        try {
          await deleteApplicationRequest(application);
          await refresh();
          notify("Candidatura eliminada");
        } catch (failure) {
          reportFailure(failure, "No se pudo eliminar la candidatura.");
        }
      },
    });
  };

  const inviteMember = async (event: FormEvent) => {
    event.preventDefault();
    const address = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setInviteError("Introduce un email válido.");
      return;
    }
    if (state?.team.some((member) => member.email.toLowerCase() === address)) {
      setInviteError("Ese email ya tiene acceso o una invitación.");
      return;
    }
    if (invitePassword && invitePassword.length < 10) {
      setInviteError("La contraseña temporal debe tener al menos 10 caracteres.");
      return;
    }
    setInviteError("");
    try {
      await inviteMemberRequest(address, inviteRole, invitePassword || undefined);
      await refresh();
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
      setInvitePassword("");
      notify(invitePassword ? "Acceso creado" : "Invitación creada");
    } catch (failure) {
      setInviteError(
        failure instanceof Error ? failure.message : "No se pudo crear la invitación.",
      );
    }
  };

  const revokeMember = (member: TeamMember) => {
    openConfirm({
      title: "Revocar acceso",
      body: (
        <>
          <b>{member.name}</b> dejará de poder entrar al panel y su sesión se cerrará en
          todos los dispositivos.
        </>
      ),
      confirmLabel: "Revocar acceso",
      danger: true,
      onConfirm: async () => {
        try {
          await revokeMemberRequest(member);
          await refresh();
          notify("Acceso revocado");
        } catch (failure) {
          reportFailure(failure, "No se pudo revocar el acceso.");
        }
      },
    });
  };

  const resendInvite = async (member: TeamMember) => {
    try {
      await resendInviteRequest(member);
      await refresh();
      notify(`Invitación reenviada a ${member.email}`);
    } catch (failure) {
      reportFailure(failure, "No se pudo reenviar la invitación.");
    }
  };

  const saveSettings = async (settings: AdminSettings) => {
    try {
      await saveSettingsRequest(settings);
      await refresh();
      notify("Ajustes guardados");
    } catch (failure) {
      notify(failure instanceof Error ? failure.message : "No se pudieron guardar los ajustes.");
      throw failure;
    }
  };

  const changePassword = async (currentPassword: string, nextPassword: string) => {
    await changePasswordRequest(currentPassword, nextPassword);
    notify("Contraseña actualizada");
  };

  const uploadFile = async (file: File) => {
    const stored = await uploadAdminFile(file);
    return { url: stored.url, name: stored.name };
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const nextUser = await loginRequest(username.trim(), password);
      const data = await fetchBootstrap();
      setUser(nextUser);
      setState(data);
      setPassword("");
      setTab("summary");
    } catch (failure) {
      setLoginError(
        failure instanceof Error ? failure.message : "Usuario o contraseña incorrectos.",
      );
    } finally {
      setLoginBusy(false);
    }
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* la sesión local se cierra igualmente */
    }
    setState(null);
    setUser(null);
    setTab("summary");
    setPassword("");
  };

  if (booting) {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginPane} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.loginCard}>
            <span className={styles.kicker}>Panel de administración</span>
            <h1 className={styles.loginTitle}>Comprobando acceso…</h1>
            <p className={styles.loginText}>
              Verificando la red interna y la sesión segura.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !state) {
    return (
      <div className={styles.loginShell}>
        <div className={styles.loginVisual} aria-hidden="true">
          <div className={styles.loginImage} />
          <div className={styles.loginOverlay} />
          <div className={styles.loginBrand}>
            <Image
              src="/gmp/brand/logo-alpha.png"
              alt="Granja Maripepa"
              width={160}
              height={49}
            />
            <span>Administración</span>
          </div>
          <div className={styles.loginQuote}>
            <span className={styles.kicker}>Granja Maripepa</span>
            <p>El contenido de la web, en un solo lugar.</p>
            <small>Ofertas · Revistas · Candidaturas</small>
          </div>
        </div>
        <div className={styles.loginPane}>
          <div className={styles.loginCard}>
            <div className={styles.loginCardBrand}>
              <Image
                src="/gmp/brand/logo-alpha.png"
                alt="Granja Maripepa"
                width={118}
                height={36}
              />
              <span>Administración</span>
            </div>
            <span className={styles.demoPill}>Acceso restringido · red interna</span>
            <span className={styles.kicker}>Acceso reservado</span>
            <h1 className={styles.loginTitle}>Panel de administración</h1>
            <p className={styles.loginText}>
              Gestiona las ofertas de empleo, las revistas y las candidaturas de Granja
              Maripepa.
            </p>
            <form onSubmit={login} className={styles.loginForm}>
              <label className={styles.field}>
                <span>Usuario</span>
                <input
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={styles.input}
                  placeholder="javier"
                />
              </label>
              <label className={styles.field}>
                <span>Contraseña</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </label>
              {loginError ? <p className={styles.fieldError}>{loginError}</p> : null}
              {bootError ? (
                <p className={styles.fieldError}>
                  No se pudo conectar con la base de datos: {bootError}
                </p>
              ) : null}
              <button type="submit" className={styles.loginSubmit} disabled={loginBusy}>
                {loginBusy ? "Comprobando…" : "Entrar al panel"}
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </form>
            <p className={styles.demoNote}>
              Solo disponible desde la red corporativa o la VPN de la empresa.
            </p>
            <a href="/es" className={styles.backToSite}>
              Volver a la web
            </a>
          </div>
        </div>
      </div>
    );
  }

  const applicationsNew = state.applications.filter((a) => a.status === "new").length;


  return (
    <div className={styles.shell}>
      {sidebarOpen ? (
        <button
          type="button"
          className={styles.sidebarScrim}
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHead}>
          <a href="/es" className={styles.brand} aria-label="Granja Maripepa">
            <Image
              src="/gmp/brand/logo-alpha.png"
              alt="Granja Maripepa"
              width={126}
              height={38}
            />
          </a>
          <span className={styles.brandTag}>Administración</span>
        </div>
        <nav className={styles.nav} aria-label="Secciones de administración">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            const count =
              item.id === "jobs"
                ? state.jobs.length
                : item.id === "magazines"
                  ? state.magazines.length
                  : item.id === "applications" && applicationsNew
                    ? applicationsNew
                    : null;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                  setJobRequest(0);
                  setMagazineRequest(0);
                }}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
                {count !== null ? <b className={styles.navBadge}>{count}</b> : null}
              </button>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.userChip}>
            <span className={styles.avatar}>{user.name.slice(0, 1)}</span>
            <span className={styles.userMeta}>
              <b>{user.name}</b>
              <small>Administrador</small>
            </span>
            <button type="button" className={styles.logout} onClick={logout} aria-label="Cerrar sesión">
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>
          <span className={styles.demoNote}>Datos reales · IBM i JAVIER</span>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <span className={styles.crumb}>
              Administración <ChevronRight size={12} aria-hidden="true" />
              <b>{NAV.find((item) => item.id === tab)?.label}</b>
            </span>
          </div>
          <div className={styles.topActions}>
            <span className={styles.demoPillSmall}>DB2 · Producción</span>
            <a href="/es/trabaja-con-nosotros" className={styles.topLink} target="_blank" rel="noopener noreferrer">
              Ver web <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            <div className={styles.notifWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Notificaciones"
                aria-haspopup="dialog"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((value) => !value)}
              >
                <Bell size={16} aria-hidden="true" />
                {applicationsNew ? <i className={styles.notificationDot} /> : null}
              </button>
              {notifOpen ? (
                <div className={styles.notifPanel} role="dialog" aria-label="Candidaturas recientes">
                  <div className={styles.notifHead}>
                    <b>Candidaturas</b>
                    <span>{applicationsNew} sin revisar</span>
                  </div>
                  {state.applications.length ? (
                    <ul className={styles.notifList}>
                      {state.applications.slice(0, 6).map((application) => (
                        <li key={application.id}>
                          <button
                            type="button"
                            className={styles.notifItem}
                            onClick={() => {
                              setNotifOpen(false);
                              setTab("applications");
                            }}
                          >
                            <span className={styles.notifTop}>
                              <b>{application.name}</b>
                              <em>{formatAdminDate(application.createdAt)}</em>
                            </span>
                            <span className={styles.notifMeta}>{application.email}</span>
                            <span className={styles.notifMeta}>
                              {application.jobTitle || application.sector || "Candidatura espontánea"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.notifEmpty}>No hay candidaturas todavía.</p>
                  )}
                  <button
                    type="button"
                    className={styles.notifAll}
                    onClick={() => {
                      setNotifOpen(false);
                      setTab("applications");
                    }}
                  >
                    Ver todas
                  </button>
                </div>
              ) : null}
            </div>
            <span className={styles.topAvatar}>{user.name.slice(0, 1)}</span>
          </div>
        </header>

        <main className={styles.content}>
          {tab === "summary" ? (
            <Summary
              state={state}
              actor={user.name}
              onNewJob={newJob}
              onNewMagazine={newMagazine}
              onTab={setTab}
            />
          ) : null}
          {tab === "jobs" ? (
            <AdminOffers
              jobs={state.jobs}
              newRequest={jobRequest}
              onSave={saveJob}
              onDelete={deleteJob}
              onDuplicate={duplicateJob}
              onToggle={toggleJob}
            />
          ) : null}
          {tab === "magazines" ? (
            <AdminMagazines
              magazines={state.magazines}
              newRequest={magazineRequest}
              onSave={saveMagazine}
              onDelete={deleteMagazine}
              onToggle={toggleMagazine}
              onUpload={uploadFile}
            />
          ) : null}
          {tab === "applications" ? (
            <AdminApplications
              applications={state.applications}
              onUpdate={updateApplication}
              onDelete={deleteApplication}
            />
          ) : null}
          {tab === "activity" ? <ActivityView activity={state.activity} /> : null}
          {tab === "security" ? <AdminSecurity onNotify={notify} /> : null}
          {tab === "team" ? (
            <TeamView
              team={state.team}
              currentEmail={user.email}
              onInvite={() => {
                setInviteError("");
                setInviteOpen(true);
              }}
              onRevoke={revokeMember}
              onResend={resendInvite}
            />
          ) : null}
          {tab === "settings" ? (
            <SettingsView
              settings={state.settings}
              onSave={saveSettings}
              onChangePassword={changePassword}
            />
          ) : null}
        </main>
      </div>

      {toast ? (
        <div className={styles.toast} role="status" aria-live="polite">
          <Check size={14} aria-hidden="true" /> {toast.message}
        </div>
      ) : null}

      {confirm ? (
        <div className={styles.confirmLayer}>
          <div className={styles.confirm} role="dialog" aria-modal="true" aria-label={confirm.title}>
            <span className={styles.confirmKicker}>Administración</span>
            <h2>{confirm.title}</h2>
            <p>{confirm.body}</p>
            <div className={styles.confirmActions}>
              <button type="button" autoFocus onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={confirm.danger ? styles.dangerBtn : styles.primaryBtn}
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
              >
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className={styles.confirmLayer}>
          <div className={styles.confirm} role="dialog" aria-modal="true" aria-label="Invitar persona">
            <span className={styles.confirmKicker}>Equipo</span>
            <h2>Invitar persona</h2>
            <p>
              Crea el acceso con una contraseña temporal o deja el campo vacío para
              enviar una invitación pendiente.
            </p>
            <form onSubmit={inviteMember} className={styles.inviteForm}>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  autoFocus
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className={styles.input}
                  placeholder="nombre@mari-pepa.com"
                />
              </label>
              <label className={styles.field}>
                <span>Rol</span>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as TeamMember["role"])}
                  className={styles.selectInput}
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Contraseña temporal (opcional)</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={invitePassword}
                  onChange={(event) => setInvitePassword(event.target.value)}
                  className={styles.input}
                  placeholder="Mínimo 10 caracteres"
                />
              </label>
              {inviteError ? <p className={styles.fieldError}>{inviteError}</p> : null}
              <div className={styles.confirmActions}>
                <button type="button" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  {invitePassword ? "Crear acceso" : "Crear invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

