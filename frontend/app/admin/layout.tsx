import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminBackdrop } from "@/components/admin/AdminBackdrop";
import styles from "@/components/admin/AdminBackdrop.module.css";

export const metadata: Metadata = {
  title: "Administración | Granja Maripepa",
  description: "Panel interno de administración de Granja Maripepa.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <AdminBackdrop />
      <div className={styles.stage}>{children}</div>
    </div>
  );
}
