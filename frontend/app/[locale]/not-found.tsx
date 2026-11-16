"use client";

import { useRouter } from "@/lib/navigation";
import { OperationalState } from "@/components/gmp/operations/StateView";

export default function NotFound() {
  const router = useRouter();
  return <OperationalState kind="missing" goBack={() => router.back()} />;
}
