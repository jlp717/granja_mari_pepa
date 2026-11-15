import type { Job, JobIcon } from "@/components/editorial/careers-data";

export type JobStatus = "published" | "draft";
export type MagazineStatus = "published" | "draft";
export type ApplicationStatus = "new" | "review" | "interview" | "rejected" | "hired";
export type TeamRole = "admin" | "editor";
export type TeamStatus = "active" | "invited";
export type ActivityKind =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "status"
  | "settings"
  | "invite"
  | "login"
  | "security";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
}

export interface JobDetail {
  label: string;
  value: string;
}

export interface AdminJob extends Job {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  details?: JobDetail[];
}

export interface Magazine {
  id: string;
  title: string;
  edition: string;
  date: string;
  description: string;
  pdfUrl: string;
  pdfName: string;
  coverUrl: string;
  status: MagazineStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Application {
  id: string;
  jobId?: string;
  jobTitle?: string;
  name: string;
  email: string;
  phone: string;
  sector: string;
  message: string;
  cvName: string;
  cvUrl?: string;
  status: ApplicationStatus;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: TeamRole;
  status: TeamStatus;
  lastAccess: string | null;
  createdAt?: string;
}

export interface AdminSettings {
  rrhhEmail: string;
  phone: string;
  offersPublic: boolean;
  applicationsOpen: boolean;
  internalNote: string;
}

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  entity: string;
  detail: string;
  at: string;
  user: string;
}

export interface AdminMeta {
  actor: string;
  schema: string;
  sessionHours: number;
  generatedAt: string;
}

export interface AdminState {
  jobs: AdminJob[];
  magazines: Magazine[];
  applications: Application[];
  team: TeamMember[];
  settings: AdminSettings;
  activity: ActivityEntry[];
  meta: AdminMeta;
}

export interface SessionInfo {
  authenticated: boolean;
  user?: AdminUser;
  network?: { ip?: string };
}

export interface AdminSession {
  token: string;
  email: string;
  name: string;
  role: TeamRole;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export const JOB_ICONS: Array<{ value: JobIcon; label: string }> = [
  { value: "warehouse", label: "Almacén" },
  { value: "truck", label: "Reparto" },
  { value: "sales", label: "Ventas" },
  { value: "admin", label: "Administración" },
  { value: "quality", label: "Calidad" },
];

export const JOB_ACCENTS = ["#C24A1F", "#5C6238", "#9CB4C2", "#C9A24A"];

export const APPLICATION_STATUS: Record<
  ApplicationStatus,
  { label: string; tone: "accent" | "amber" | "green" | "red" | "muted" }
> = {
  new: { label: "Nueva", tone: "accent" },
  review: { label: "En revisión", tone: "amber" },
  interview: { label: "Entrevista", tone: "green" },
  rejected: { label: "Descartada", tone: "red" },
  hired: { label: "Contratada", tone: "muted" },
};

export const ROLE_LABEL: Record<TeamRole, string> = {
  admin: "Administrador",
  editor: "Editor",
};

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

let csrfToken: string | null = null;

async function getCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken;
  const response = await fetch("/api/csrf-token", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) {
    throw new AdminApiError("No se pudo preparar la conexión segura.", response.status);
  }
  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    throw new AdminApiError("No se pudo preparar la conexión segura.", 500);
  }
  csrfToken = data.token;
  return csrfToken;
}

export async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD") {
    headers.set("x-csrf-token", await getCsrfToken());
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(`/api/admin${path}`, {
      ...init,
      method,
      headers,
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdminApiError(
        "La operación ha tardado más de 12 segundos. Comprueba tu conexión o la VPN y vuelve a intentarlo.",
        408,
        "TIMEOUT",
      );
    }
    throw new AdminApiError(
      "No se pudo contactar con el servidor. Revisa tu conexión o la VPN.",
      503,
      "NETWORK",
    );
  } finally {
    window.clearTimeout(timer);
  }

  if (response.status === 403) {
    const payload = (await response.clone().json().catch(() => null)) as
      | { code?: string }
      | null;
    if (retry && payload?.code && payload.code.startsWith("CSRF_")) {
      await getCsrfToken(true);
      return adminRequest<T>(path, init, false);
    }
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { success?: boolean; message?: string; code?: string })
    | null;

  if (!response.ok) {
    throw new AdminApiError(
      data?.message || "No se pudo completar la operación.",
      response.status,
      data?.code,
    );
  }
  return data as T;
}

export async function fetchSession(): Promise<SessionInfo> {
  const data = await adminRequest<SessionInfo & { user?: AdminUser }>("/session");
  return { authenticated: data.authenticated, user: data.user, network: data.network };
}

export async function loginRequest(username: string, password: string): Promise<AdminUser> {
  const data = await adminRequest<{ user: AdminUser }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await adminRequest("/logout", { method: "POST" });
  csrfToken = null;
}

export async function fetchBootstrap(): Promise<AdminState> {
  const data = await adminRequest<AdminState & { success: boolean }>("/bootstrap");
  return {
    jobs: data.jobs,
    magazines: data.magazines,
    applications: data.applications,
    team: data.team,
    settings: data.settings,
    activity: data.activity,
    meta: data.meta,
  };
}

export async function fetchSessions(): Promise<AdminSession[]> {
  const data = await adminRequest<{ sessions: AdminSession[] }>("/sessions");
  return data.sessions;
}

export async function revokeSessionRequest(session: AdminSession): Promise<void> {
  await adminRequest(`/sessions/${encodeURIComponent(session.token)}`, {
    method: "DELETE",
  });
}

export async function revokeOtherSessionsRequest(): Promise<void> {
  await adminRequest("/sessions", { method: "DELETE" });
}

export async function createJobRequest(job: AdminJob): Promise<AdminJob> {
  const data = await adminRequest<{ job: AdminJob }>("/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
  return data.job;
}

export async function updateJobRequest(job: AdminJob): Promise<AdminJob> {
  const data = await adminRequest<{ job: AdminJob }>(`/jobs/${encodeURIComponent(job.id)}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
  return data.job;
}

export async function setJobStatusRequest(job: AdminJob, status: JobStatus): Promise<AdminJob> {
  const data = await adminRequest<{ job: AdminJob }>(
    `/jobs/${encodeURIComponent(job.id)}/status`,
    { method: "POST", body: JSON.stringify({ status }) },
  );
  return data.job;
}

export async function duplicateJobRequest(job: AdminJob): Promise<AdminJob> {
  const data = await adminRequest<{ job: AdminJob }>(
    `/jobs/${encodeURIComponent(job.id)}/duplicate`,
    { method: "POST" },
  );
  return data.job;
}

export async function deleteJobRequest(job: AdminJob): Promise<void> {
  await adminRequest(`/jobs/${encodeURIComponent(job.id)}`, { method: "DELETE" });
}

export async function createMagazineRequest(magazine: Magazine): Promise<Magazine> {
  const data = await adminRequest<{ magazine: Magazine }>("/magazines", {
    method: "POST",
    body: JSON.stringify(magazine),
  });
  return data.magazine;
}

export async function updateMagazineRequest(magazine: Magazine): Promise<Magazine> {
  const data = await adminRequest<{ magazine: Magazine }>(
    `/magazines/${encodeURIComponent(magazine.id)}`,
    { method: "PUT", body: JSON.stringify(magazine) },
  );
  return data.magazine;
}

export async function setMagazineStatusRequest(
  magazine: Magazine,
  status: MagazineStatus,
): Promise<Magazine> {
  const data = await adminRequest<{ magazine: Magazine }>(
    `/magazines/${encodeURIComponent(magazine.id)}/status`,
    { method: "POST", body: JSON.stringify({ status }) },
  );
  return data.magazine;
}

export async function deleteMagazineRequest(magazine: Magazine): Promise<void> {
  await adminRequest(`/magazines/${encodeURIComponent(magazine.id)}`, { method: "DELETE" });
}

export async function updateApplicationRequest(application: Application): Promise<void> {
  await adminRequest(`/applications/${encodeURIComponent(application.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      status: application.status,
      notes: application.notes,
      name: application.name,
    }),
  });
}

export async function deleteApplicationRequest(application: Application): Promise<void> {
  await adminRequest(`/applications/${encodeURIComponent(application.id)}`, {
    method: "DELETE",
  });
}

export async function inviteMemberRequest(
  email: string,
  role: TeamRole,
  password?: string,
): Promise<void> {
  await adminRequest("/team", {
    method: "POST",
    body: JSON.stringify({ email, role, password }),
  });
}

export async function resendInviteRequest(member: TeamMember): Promise<void> {
  await adminRequest(`/team/${encodeURIComponent(member.id)}/resend`, {
    method: "POST",
    body: JSON.stringify({ email: member.email }),
  });
}

export async function revokeMemberRequest(member: TeamMember): Promise<void> {
  await adminRequest(`/team/${encodeURIComponent(member.id)}`, { method: "DELETE" });
}

export async function saveSettingsRequest(settings: AdminSettings): Promise<AdminSettings> {
  const data = await adminRequest<{ settings: AdminSettings }>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return data.settings;
}

export async function changePasswordRequest(
  currentPassword: string,
  nextPassword: string,
): Promise<void> {
  await adminRequest("/account/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, nextPassword }),
  });
}

export async function uploadAdminFile(
  file: File,
): Promise<{ url: string; name: string; bytes: number }> {
  const lower = file.name.toLowerCase();
  const mime =
    file.type ||
    (lower.endsWith(".pdf")
      ? "application/pdf"
      : lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg");
  const headers = new Headers();
  headers.set("Content-Type", mime);
  headers.set("x-csrf-token", await getCsrfToken());
  const response = await fetch(
    `/api/admin/uploads?name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers,
      body: file,
      credentials: "same-origin",
      cache: "no-store",
    },
  );
  const data = (await response.json().catch(() => null)) as
    | { url?: string; name?: string; bytes?: number; message?: string }
    | null;
  if (!response.ok || !data?.url) {
    throw new AdminApiError(
      data?.message || "No se pudo subir el archivo.",
      response.status,
    );
  }
  return { url: data.url, name: data.name || file.name, bytes: data.bytes || file.size };
}

export function uid(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, jobs: AdminJob[], exceptId?: string): string {
  const root = slugify(base) || "oferta";
  let candidate = root;
  let i = 2;
  while (jobs.some((job) => job.slug === candidate && job.id !== exceptId)) {
    candidate = `${root}-${i}`;
    i += 1;
  }
  return candidate;
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function emptyJob(): AdminJob {
  const now = new Date().toISOString();
  return {
    id: uid("job"),
    slug: "",
    title: "",
    department: "Logística",
    location: "Lorca (Murcia)",
    type: "Jornada completa",
    schedule: "Turno de mañana",
    description: "",
    responsibilities: [],
    requirements: [],
    offers: [],
    details: [],
    icon: "warehouse",
    accent: JOB_ACCENTS[0],
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export function emptyMagazine(): Magazine {
  const now = new Date().toISOString();
  return {
    id: uid("mag"),
    title: "",
    edition: "",
    date: now.slice(0, 10),
    description: "",
    pdfUrl: "",
    pdfName: "",
    coverUrl: "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
