/**
 * Escritura controlada: candidatura real, subida de CV y validación del
 * formulario de contacto.
 *
 * Apagado por defecto. Solo escribe si ALLOW_WRITES=true, porque cada
 * iteración crea una fila en JAVIER.ADMIN_APPLICATIONS y un PDF en disco.
 *
 * Uso seguro (valida sin escribir):
 *   k6 run load/k6/public-write.js
 *
 * Uso con escritura real (entorno de pruebas):
 *   ALLOW_WRITES=true TEST_TAG=k6 k6 run load/k6/public-write.js
 *
 * El contacto se prueba con una carga inválida a propósito: recorre la ruta y
 * comprueba la validación sin enviar correo a nadie.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = __ENV.BASE_URL || "https://www.mari-pepa.com";
const allowWrites = __ENV.ALLOW_WRITES === "true";
const tag = __ENV.TEST_TAG || "k6";
const businessErrors = new Rate("business_errors");

const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";

// 400 y 409 son respuestas esperadas (datos inválidos y duplicados).
http.setResponseCallback(http.expectedStatuses(200, 201, 400, 409));

const scenarios = {};
const validationIterations = Number(__ENV.ITERATIONS ?? 3);
if (validationIterations > 0) {
  scenarios.validacion = {
    executor: "per-vu-iterations",
    vus: 1,
    iterations: validationIterations,
    exec: "validation",
  };
}
if (allowWrites) {
  scenarios.escritura = {
    executor: "per-vu-iterations",
    vus: 1,
    iterations: Number(__ENV.WRITE_ITERATIONS || 1),
    startTime: "1s",
    exec: "writeApplication",
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    business_errors: ["rate<0.01"],
  },
};

export function validation() {
  const eligibility = http.get(
    `${BASE}/api/public/applications/eligibility?email=carga-preflight@example.com`,
    { tags: { name: "elegibilidad" } },
  );
  const eligibilityOk = check(eligibility, {
    "elegibilidad 200": (r) => r.status === 200,
    "elegibilidad responde": (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
  });
  businessErrors.add(!eligibilityOk);
  sleep(0.5);

  const contact = http.post(
    `${BASE}/api/public/contact`,
    JSON.stringify({ nombre: "", email: "no-es-un-email", mensaje: "corto", privacidad: false }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "contacto_validacion" } },
  );
  const contactOk = check(contact, {
    "contacto rechaza datos invalidos": (r) => r.status === 400,
  });
  businessErrors.add(!contactOk);
  sleep(0.5);

  const application = http.post(
    `${BASE}/api/public/applications`,
    JSON.stringify({ name: "", email: "no-es-un-email" }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "candidatura_validacion" } },
  );
  const applicationOk = check(application, {
    "candidatura rechaza datos invalidos": (r) => r.status === 400,
  });
  businessErrors.add(!applicationOk);
  sleep(0.5);
}

export function writeApplication() {
  const stamp = `${Date.now()}-${__VU}-${__ITER}`;
  const email = `carga+${tag}-${stamp}@example.com`;
  const cv = http.post(`${BASE}/api/public/cv?name=carga-${stamp}.pdf`, pdf, {
    headers: { "Content-Type": "application/pdf" },
    tags: { name: "cv_carga" },
  });
  const cvOk = check(cv, {
    "cv aceptado": (r) => r.status === 201,
  });
  businessErrors.add(!cvOk);
  if (!cvOk) return;

  let cvUrl = "";
  try {
    cvUrl = JSON.parse(cv.body).url;
  } catch {
    cvUrl = "";
  }

  const payload = JSON.stringify({
    name: `Carga ${stamp}`,
    email,
    phone: "600000000",
    sector: "Otro",
    message: "Prueba de carga k6",
    jobId: "",
    jobTitle: "",
    cvName: `carga-${stamp}.pdf`,
    cvUrl,
  });
  const application = http.post(`${BASE}/api/public/applications`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "candidatura_carga" },
  });
  const applicationOk = check(application, {
    "candidatura creada": (r) => r.status === 201,
  });
  businessErrors.add(!applicationOk);

  const duplicate = http.post(`${BASE}/api/public/applications`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "candidatura_duplicada" },
  });
  const duplicateOk = check(duplicate, {
    "duplicado bloqueado": (r) => r.status === 409,
  });
  businessErrors.add(!duplicateOk);
  sleep(1);
}
