/**
 * Prueba de carga pública de Mari Pepa.
 *
 * Solo lectura: portada, empleo, contacto y las dos APIs públicas que
 * alimentan esas páginas. No escribe en DB2 ni envía correo.
 *
 * Uso:
 *   k6 run load/k6/public-smoke.js
 *   BASE_URL=https://www.mari-pepa.com PAGES_VUS=20 k6 run load/k6/public-smoke.js
 *
 * El límite general de la API es 200 peticiones / 15 min por IP. Para pruebas
 * grandes hay que ejecutarlas desde una IP autorizada o subir el límite de
 * forma temporal; este script mantiene el escenario API por defecto en 10
 * iteraciones para no agotarlo.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = __ENV.BASE_URL || "https://www.mari-pepa.com";
const businessErrors = new Rate("business_errors");
const apiIterations = Number(__ENV.API_ITERATIONS ?? 10);

// Los formularios devuelven 400 con datos inválidos de forma deliberada.
http.setResponseCallback(http.expectedStatuses(200, 201, 400));

const pages = ["/es", "/es/trabaja-con-nosotros", "/es/contacto"];

const scenarios = {
  navegacion: {
    executor: "constant-vus",
    vus: Number(__ENV.PAGES_VUS || 8),
    duration: __ENV.PAGES_DURATION || "20s",
    exec: "browse",
  },
};
if (apiIterations > 0) {
  scenarios.api_lectura = {
    executor: "per-vu-iterations",
    vus: 1,
    iterations: apiIterations,
    startTime: "1s",
    exec: "apiRead",
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    business_errors: ["rate<0.01"],
  },
};

export function browse() {
  const path = pages[Math.floor(Math.random() * pages.length)];
  const response = http.get(`${BASE}${path}`, { tags: { name: path } });
  const ok = check(response, {
    "pagina 200": (r) => r.status === 200,
    "contenido de marca": (r) => String(r.body).includes("Granja"),
  });
  businessErrors.add(!ok);
  sleep(1);
}

export function apiRead() {
  for (const path of ["/api/public/jobs", "/api/public/magazines"]) {
    const response = http.get(`${BASE}${path}`, { tags: { name: path } });
    const ok = check(response, {
      "api 200": (r) => r.status === 200,
      "api success": (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });
    businessErrors.add(!ok);
    sleep(0.5);
  }
}
