"use client";

import { useRouter } from "@/lib/navigation";
import { OperationalState } from "@/components/kage/operations/StateView";

export default function NotFound() {
  const router = useRouter();
  return <OperationalState kind="missing" goBack={() => router.back()} />;
}
