"use client";

import { OperationalState } from "@/components/kage/operations/StateView";

export default function OfflinePage() {
  return (
    <OperationalState kind="offline" reset={() => window.location.reload()} />
  );
}
