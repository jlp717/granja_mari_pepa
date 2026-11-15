"use client";

import { RootState } from "@/components/kage/operations/StateView";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <RootState kind="error" reset={reset} />
      </body>
    </html>
  );
}
