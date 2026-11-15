"use client";

import { RootState } from "@/components/kage/operations/StateView";

export default function RootNotFound() {
  return <RootState kind="missing" />;
}
