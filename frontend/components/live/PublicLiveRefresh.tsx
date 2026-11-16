"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca contenido servido por Server Components cuando el panel publica
 * cambios. Mantiene la página abierta sin recarga completa.
 */
export function PublicLiveRefresh({ types }: { types: string }) {
  const router = useRouter();

  useEffect(() => {
    const wanted = new Set(
      types
        .split(",")
        .map((type) => type.trim())
        .filter(Boolean),
    );
    let timer: number | undefined;

    const source = new EventSource("/api/public/events");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (!payload.type || !wanted.has(payload.type)) return;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => router.refresh(), 200);
      } catch {
        /* Evento no válido: se ignora. */
      }
    };

    return () => {
      source.close();
      if (timer) window.clearTimeout(timer);
    };
  }, [router, types]);

  return null;
}
