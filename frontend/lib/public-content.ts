import type { Job } from "@/components/editorial/careers-data";

export interface PublicMagazine {
  id: string;
  title: string;
  edition: string;
  date: string;
  description: string;
  pdfUrl: string;
  pdfName: string;
  coverUrl: string;
}

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5000";

interface ReadResult<T> {
  reachable: boolean;
  data: T | null;
}

async function readJson<T>(path: string): Promise<ReadResult<T>> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { reachable: true, data: null };
    return { reachable: true, data: (await response.json()) as T };
  } catch {
    return { reachable: false, data: null };
  }
}

function toJob(row: Record<string, unknown>): Job {
  const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
  return {
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    department: String(row.department ?? ""),
    location: String(row.location ?? ""),
    type: String(row.type ?? ""),
    schedule: String(row.schedule ?? ""),
    description: String(row.description ?? ""),
    responsibilities: list(row.responsibilities),
    requirements: list(row.requirements),
    offers: list(row.offers),
    details: Array.isArray(row.details)
      ? row.details
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === "object",
          )
          .map((item) => ({
            label: String(item.label ?? ""),
            value: String(item.value ?? ""),
          }))
          .filter((item) => item.label || item.value)
      : [],
    icon: (row.icon as Job["icon"]) || "warehouse",
    accent: String(row.accent ?? "#C24A1F"),
  };
}

/** null = backend unreachable (usa el contenido empaquetado como respaldo). */
export async function fetchPublicJobs(): Promise<Job[] | null> {
  const result = await readJson<{ jobs?: Array<Record<string, unknown>> }>("/api/public/jobs");
  if (!result.reachable) return null;
  const rows = result.data?.jobs;
  if (!Array.isArray(rows)) return [];
  return rows.map(toJob);
}

export async function fetchPublicJob(
  slug: string,
): Promise<{ reachable: boolean; job: Job | null }> {
  const result = await readJson<{ job?: Record<string, unknown> }>(
    `/api/public/jobs/${encodeURIComponent(slug)}`,
  );
  if (!result.reachable) return { reachable: false, job: null };
  if (!result.data?.job) return { reachable: true, job: null };
  return { reachable: true, job: toJob(result.data.job) };
}

/** null = backend unreachable (la interfaz conserva sus enlaces empaquetados). */
export async function fetchPublicMagazines(): Promise<PublicMagazine[] | null> {
  const result = await readJson<{ magazines?: Array<Record<string, unknown>> }>(
    "/api/public/magazines",
  );
  if (!result.reachable) return null;
  const rows = result.data?.magazines;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    edition: String(row.edition ?? ""),
    date: String(row.date ?? ""),
    description: String(row.description ?? ""),
    pdfUrl: String(row.pdfUrl ?? ""),
    pdfName: String(row.pdfName ?? ""),
    coverUrl: String(row.coverUrl ?? ""),
  }));
}
