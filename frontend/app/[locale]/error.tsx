"use client";

import { OperationalState } from "@/components/gmp/operations/StateView";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <OperationalState kind="error" reset={reset} />;
}
