"use client";

import { useEffect, useState } from "react";

export interface NavMagazine {
  id: string;
  title: string;
  edition: string;
  pdfUrl: string;
  coverUrl: string;
  description: string;
  date: string;
}

/**
 * Portadas empaquetadas de las revistas publicadas. Se usan mientras llega la
 * respuesta de DB2 y como red de seguridad si el backend está arrancando o
 * degradado. La lista de la base de datos siempre tiene prioridad.
 */
const FALLBACK: NavMagazine[] = [
  {
    id: "mag-2026-01",
    title: "Revista Granja Mari Pepa",
    edition: "Enero 2026",
    pdfUrl: "/catalogs/enero-2026-granja-mari-pepa.pdf",
    coverUrl: "/catalogs/covers/enero-2026-granja-mari-pepa.jpg",
    description: "",
    date: "2026-01-01",
  },
  {
    id: "mag-2026-02",
    title: "Revista Topgel",
    edition: "Febrero 2026",
    pdfUrl: "/catalogs/topgel-febrero-2026.pdf",
    coverUrl: "/catalogs/covers/topgel-febrero-2026.jpg",
    description: "",
    date: "2026-02-01",
  },
  {
    id: "mag-2026-03",
    title: "Revista Granja Mari Pepa",
    edition: "Marzo 2026",
    pdfUrl: "/catalogs/gmp-marzo-2026.pdf",
    coverUrl: "/catalogs/covers/gmp-marzo-2026.jpg",
    description: "",
    date: "2026-03-01",
  },
  {
    id: "mag-2026-04",
    title: "Revista Topgel",
    edition: "Abril 2026",
    pdfUrl: "/catalogs/abril-2026-topgel.pdf",
    coverUrl: "/catalogs/covers/abril-2026-topgel.jpg",
    description: "",
    date: "2026-04-01",
  },
  {
    id: "mag-2026-05",
    title: "Revista Topgel",
    edition: "Mayo 2026",
    pdfUrl: "/catalogs/mayo-2026-topgel.pdf",
    coverUrl: "/catalogs/covers/mayo-2026-topgel.jpg",
    description: "",
    date: "2026-05-01",
  },
  {
    id: "mag-2026-06",
    title: "Revista Granja Mari Pepa",
    edition: "Junio 2026",
    pdfUrl: "/catalogs/junio-2026-granja-mari-pepa.pdf",
    coverUrl: "/catalogs/covers/junio-2026-granja-mari-pepa.jpg",
    description: "",
    date: "2026-06-01",
  },
  {
    id: "mag-2026-07",
    title: "Revista Granja Mari Pepa",
    edition: "Julio-Agosto 2026",
    pdfUrl: "/catalogs/julio-agosto-2026-granja-mari-pepa.pdf",
    coverUrl: "/catalogs/covers/julio-agosto-2026-granja-mari-pepa.jpg",
    description: "",
    date: "2026-07-01",
  },
  {
    id: "mag-2026-09",
    title: "Revista Topgel",
    edition: "Septiembre 2026",
    pdfUrl: "/catalogs/septiembre-2026-topgel.pdf",
    coverUrl: "/catalogs/covers/septiembre-2026-topgel.jpg",
    description: "",
    date: "2026-09-01",
  },
  {
    id: "mag-2026-10",
    title: "Revista Topgel",
    edition: "Octubre-Noviembre 2026",
    pdfUrl: "/catalogs/octubre-noviembre-2026-topgel.pdf",
    coverUrl: "/catalogs/covers/octubre-noviembre-2026-topgel.jpg",
    description: "",
    date: "2026-10-01",
  },
  {
    id: "mag-2026-12",
    title: "Revista Topgel",
    edition: "Navidad 2026",
    pdfUrl: "/catalogs/navidad-2026-topgel.pdf",
    coverUrl: "/catalogs/covers/navidad-2026-topgel.jpg",
    description: "",
    date: "2026-12-01",
  },
];

const RETRY_DELAYS = [2000, 5000, 10000, 20000, 30000];

/**
 * Revistas publicadas en la base de datos. Si el backend está arrancando o
 * DB2 falla de forma transitoria, reintenta con backoff y mantiene la lista
 * completa empaquetada para no dejar el hueco vacío.
 */
export function usePublicMagazines(): NavMagazine[] {
  const [items, setItems] = useState<NavMagazine[]>(FALLBACK);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const load = async () => {
      try {
        const response = await fetch("/api/public/magazines", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as {
          magazines?: Array<Record<string, unknown>>;
        };
        if (!active) return;
        if (!data || !Array.isArray(data.magazines)) {
          throw new Error("Respuesta sin revistas");
        }
        const list = data.magazines
          .map((row) => ({
            id: String(row.id ?? "").trim(),
            title: String(row.title ?? "").trim(),
            edition: String(row.edition ?? "").trim(),
            pdfUrl: String(row.pdfUrl ?? "").trim(),
            coverUrl: String(row.coverUrl ?? "").trim(),
            description: String(row.description ?? "").trim(),
            date: String(row.date ?? "").trim(),
          }))
          .filter((row) => row.pdfUrl);
        if (list.length) {
          setItems(list);
          return;
        }
        throw new Error("Lista vacía");
      } catch {
        if (!active) return;
        const delay = RETRY_DELAYS[attempt];
        if (delay === undefined) return;
        attempt += 1;
        timer = setTimeout(load, delay);
      }
    };

    load();

    const source = new EventSource("/api/public/events");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "magazines") {
          attempt = 0;
          void load();
        }
      } catch {
        /* Evento no válido: se ignora. */
      }
    };

    return () => {
      active = false;
      source.close();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return items;
}
