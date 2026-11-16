/**
 * JOBS son datos de ejemplo para tipar/desarrollar; no se publican si la API
 * no devuelve ofertas. Las páginas de empleo solo renderizan `live` y, si la
 * API falla o no hay vacantes, muestran el estado vacío o `notFound()`.
 */
export type JobIcon =
  | "warehouse"
  | "truck"
  | "sales"
  | "admin"
  | "quality"
  | "factory"
  | "shopping"
  | "code"
  | "handshake"
  | "cold"
  | "calendar";

export interface JobDetail {
  label: string;
  value: string;
}

export interface Job {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  schedule: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  offers: string[];
  details?: JobDetail[];
  icon: string;
  accent: string;
}

export const JOBS: Job[] = [
  {
    slug: "mozo-almacen-lorca",
    title: "Mozo de almacén",
    department: "Logística",
    location: "Lorca (Murcia)",
    type: "Jornada completa",
    schedule: "Turnos de mañana y tarde",
    description:
      "Preparación de pedidos, carga y descarga de mercancía, control de stock y mantenimiento del orden en cámara frigorífica.",
    responsibilities: [
      "Preparar pedidos según albarán",
      "Carga y descarga de mercancía",
      "Control de stock y caducidades",
      "Mantenimiento del orden en cámara",
      "Uso de carretilla elevadora",
    ],
    requirements: [
      "Experiencia en almacén (valorable)",
      "Carnet de carretilla (valorable)",
      "Disponibilidad para turnos",
      "Residencia en Lorca o alrededores",
    ],
    offers: [
      "Turnos planificados con antelación",
      "Formación en seguridad alimentaria y PRL",
      "Equipos de protección individual",
    ],
    icon: "warehouse",
    accent: "#5C6238",
  },
  {
    slug: "repartidor-lorca",
    title: "Repartidor/a",
    department: "Logística",
    location: "Lorca (Murcia)",
    type: "Jornada completa",
    schedule: "Turno de mañana",
    description:
      "Entrega de pedidos a clientes HORECA en la zona de Murcia. Conducción de furgoneta refrigerada, control de albaranes y trato directo con el cliente.",
    responsibilities: [
      "Entrega de pedidos en ruta asignada",
      "Conducción de furgoneta refrigerada",
      "Control de albaranes y firma de entrega",
      "Trato directo con clientes HORECA",
      "Mantenimiento básico del vehículo",
    ],
    requirements: [
      "Carnet B (obligatorio)",
      "Experiencia en reparto (valorable)",
      "Disponibilidad para turnos de mañana",
      "Residencia en Lorca o alrededores",
    ],
    offers: [
      "Ruta fija en la zona asignada",
      "Vehículo de empresa y combustible",
      "Formación en producto y atención al cliente",
    ],
    icon: "truck",
    accent: "#9CB4C2",
  },
  {
    slug: "repartidor-viator",
    title: "Repartidor/a",
    department: "Logística",
    location: "Viator (Almería)",
    type: "Jornada completa",
    schedule: "Turno de mañana",
    description:
      "Entrega de pedidos a clientes HORECA en la zona de Almería. Conducción de furgoneta refrigerada y control de albaranes.",
    responsibilities: [
      "Entrega de pedidos en ruta asignada",
      "Conducción de furgoneta refrigerada",
      "Control de albaranes y firma de entrega",
      "Trato directo con clientes HORECA",
    ],
    requirements: [
      "Carnet B (obligatorio)",
      "Residencia en Almería o alrededores",
      "Disponibilidad para turnos de mañana",
    ],
    offers: [
      "Delegación en Viator",
      "Ruta fija en la zona asignada",
      "Formación en producto y atención al cliente",
    ],
    icon: "truck",
    accent: "#9CB4C2",
  },
  {
    slug: "comercial-horeca",
    title: "Comercial HORECA",
    department: "Ventas",
    location: "Murcia / Almería",
    type: "Jornada completa",
    schedule: "Jornada comercial, según zona",
    description:
      "Visita a clientes de hostelería y restauración, asesoramiento de producto, gestión de pedidos y fidelización. Cartera de clientes asignada.",
    responsibilities: [
      "Visita a clientes HORECA",
      "Asesoramiento de producto y novedades",
      "Gestión de pedidos y seguimiento",
      "Fidelización de cartera",
      "Reporting de ventas",
    ],
    requirements: [
      "Experiencia en venta B2B (valorable)",
      "Carnet B",
      "Habilidades de comunicación y negociación",
      "Residencia en Murcia o Almería",
    ],
    offers: [
      "Cartera de clientes asignada",
      "Formación continua en producto",
      "Vehículo y herramientas de trabajo",
    ],
    icon: "sales",
    accent: "#C24A1F",
  },
  {
    slug: "admin-pedidos",
    title: "Administrativo/a de pedidos",
    department: "Administración",
    location: "Lorca (Murcia)",
    type: "Jornada completa",
    schedule: "Jornada de oficina",
    description:
      "Gestión de pedidos, facturación, atención telefónica, coordinación con almacén y reparto. Uso de ERP y hojas de cálculo.",
    responsibilities: [
      "Gestión de pedidos y facturación",
      "Atención telefónica a clientes",
      "Coordinación con almacén y reparto",
      "Uso de ERP y Excel",
      "Archivo y documentación",
    ],
    requirements: [
      "Experiencia en administración",
      "Manejo de Excel y ERP",
      "Atención al detalle",
      "Disponibilidad inmediata",
    ],
    offers: [
      "Jornada de oficina en Lorca",
      "Formación en ERP y procesos internos",
      "Equipo pequeño y trato directo",
    ],
    icon: "admin",
    accent: "#5C6238",
  },
  {
    slug: "tecnico-calidad",
    title: "Técnico/a de calidad",
    department: "Calidad",
    location: "Lorca (Murcia)",
    type: "Jornada completa",
    schedule: "Jornada de oficina y planta",
    description:
      "Control de calidad de producto, trazabilidad, gestión de no conformidades, auditorías internas y documentación ISO 9001.",
    responsibilities: [
      "Control de calidad de producto",
      "Gestión de trazabilidad",
      "No conformidades y CAPA",
      "Auditorías internas ISO 9001",
      "Documentación y registros",
    ],
    requirements: [
      "Formación en calidad alimentaria",
      "Conocimiento ISO 9001",
      "Experiencia en sector alimentario (valorable)",
      "Capacidad de análisis",
    ],
    offers: [
      "Formación continua en calidad y seguridad alimentaria",
      "Trabajo junto a producción y almacén",
      "Participación en auditorías y mejora continua",
    ],
    icon: "quality",
    accent: "#9CB4C2",
  },
];

export const DEPARTMENTS = [
  "Todos",
  "Logística",
  "Ventas",
  "Administración",
  "Calidad",
];

export const LOCATIONS = [
  "Todas",
  "Lorca (Murcia)",
  "Viator (Almería)",
  "Murcia / Almería",
];

export const SECTORS = [
  "Mozo de almacén",
  "Repartidor/a",
  "Comercial",
  "Administrativo/a",
  "Técnico/a de calidad",
  "Operario/a de producción",
  "Informático/a",
  "Responsable de compras",
  "Otro",
];

export function getJob(slug: string): Job | undefined {
  return JOBS.find((job) => job.slug === slug);
}

/* ---------------------------------------------------------------- etiquetas */

/**
 * Cualquier concepto escrito por el equipo se resuelve a un icono publicado.
 * No hay lista cerrada: si la palabra no coincide con ninguna conocida, se
 * elige un icono estable a partir del propio texto.
 */
export const JOB_ICON_OPTIONS: Array<{
  value: JobIcon;
  label: string;
  keywords: string[];
}> = [
  {
    value: "warehouse",
    label: "Almacén",
    keywords: ["almacen", "mozo", "logistica", "carga", "descarga", "stock", "pedido"],
  },
  {
    value: "truck",
    label: "Reparto",
    keywords: ["repart", "conduc", "transport", "camion", "ruta", "chofer"],
  },
  {
    value: "sales",
    label: "Ventas",
    keywords: ["comercial", "venta", "cuenta", "cliente", "horeca"],
  },
  {
    value: "admin",
    label: "Administración",
    keywords: ["admin", "oficin", "factur", "contab", "recepcion", "secretaria"],
  },
  {
    value: "quality",
    label: "Calidad",
    keywords: ["calidad", "prl", "appcc", "auditor", "seguridad alimentaria"],
  },
  {
    value: "factory",
    label: "Producción",
    keywords: ["producc", "fabric", "elabora", "operari", "cocina", "chef", "obrador"],
  },
  {
    value: "shopping",
    label: "Compras",
    keywords: ["compra", "aprovision", "proveedor"],
  },
  {
    value: "code",
    label: "Informática",
    keywords: ["informatic", "sistema", "program", "desarrollo", "tecnolog"],
  },
  {
    value: "handshake",
    label: "Personas",
    keywords: ["rrhh", "persona", "marketing", "comunic", "seleccion"],
  },
  {
    value: "cold",
    label: "Frío",
    keywords: ["frio", "camara", "congelado", "refriger"],
  },
  {
    value: "calendar",
    label: "Formación",
    keywords: ["practica", "beca", "formacion", "becari"],
  },
];

const ACCENT_BY_ICON: Record<JobIcon, string> = {
  warehouse: "#5C6238",
  truck: "#9CB4C2",
  sales: "#C24A1F",
  admin: "#5C6238",
  quality: "#9CB4C2",
  factory: "#C9A24A",
  shopping: "#C24A1F",
  code: "#9CB4C2",
  handshake: "#C9A24A",
  cold: "#9CB4C2",
  calendar: "#5C6238",
};

const SECTOR_RULES: Array<{ match: RegExp; sector: string }> = [
  { match: /(repart|conduc|transport|camion|ruta|chofer)/, sector: "Repartidor/a" },
  { match: /(comercial|venta|cuenta|cliente|horeca)/, sector: "Comercial" },
  { match: /(admin|oficin|factur|contab|recepcion|secretaria)/, sector: "Administrativo/a" },
  { match: /(calidad|prl|appcc|auditor)/, sector: "Técnico/a de calidad" },
  { match: /(producc|fabric|elabora|operari|cocina|chef|obrador)/, sector: "Operario/a de producción" },
  { match: /(informatic|sistema|program|desarrollo|tecnolog)/, sector: "Informático/a" },
  { match: /(compra|aprovision|proveedor)/, sector: "Responsable de compras" },
  { match: /(almacen|mozo|logistica|carga|descarga|stock)/, sector: "Mozo de almacén" },
];

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hashIndex(value: string, size: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return size ? hash % size : 0;
}

export function resolveJobIconName(raw: string): JobIcon {
  const value = normalizeText(raw);
  if (!value) return "warehouse";
  const direct = JOB_ICON_OPTIONS.find((option) => option.value === value);
  if (direct) return direct.value;
  const byLabel = JOB_ICON_OPTIONS.find(
    (option) => normalizeText(option.label) === value,
  );
  if (byLabel) return byLabel.value;
  const byKeyword = JOB_ICON_OPTIONS.find((option) =>
    option.keywords.some((word) => value.includes(word)),
  );
  if (byKeyword) return byKeyword.value;
  return JOB_ICON_OPTIONS[hashIndex(value, JOB_ICON_OPTIONS.length)].value;
}

export function resolveJobAccent(raw: string | undefined, icon: string): string {
  const accent = String(raw || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(accent)) return accent;
  return ACCENT_BY_ICON[resolveJobIconName(icon)];
}

/** Etiqueta legible para el editor; respeta cualquier concepto libre. */
export function jobIconLabel(raw: string): string {
  const value = normalizeText(raw);
  const option = JOB_ICON_OPTIONS.find((item) => item.value === value);
  return option ? option.label : String(raw || "");
}

export function sectorForJob(job: { title?: string; department?: string }): string {
  const value = normalizeText(`${job.department || ""} ${job.title || ""}`);
  const rule = SECTOR_RULES.find((item) => item.match.test(value));
  if (rule) return rule.sector;
  const department = String(job.department || "").trim();
  return department || "Otro";
}
