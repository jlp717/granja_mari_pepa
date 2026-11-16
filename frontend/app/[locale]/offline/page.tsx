"use client";

import { OperationalState } from "@/components/gmp/operations/StateView";

export default function OfflinePage() {
  return (
    <OperationalState kind="offline" reset={() => window.location.reload()} />
  );
}
