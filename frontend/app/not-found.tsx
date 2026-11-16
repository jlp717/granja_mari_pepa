"use client";

import { RootState } from "@/components/gmp/operations/StateView";

export default function RootNotFound() {
  return <RootState kind="missing" />;
}
