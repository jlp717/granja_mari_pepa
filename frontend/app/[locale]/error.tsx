"use client";

import { OperationalState } from "@/components/kage/operations/StateView";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <OperationalState kind="error" reset={reset} />;
}
