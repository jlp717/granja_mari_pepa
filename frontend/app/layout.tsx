import "./globals.css";
import "@/components/gmp/styles/gmp.css";
import "@/components/gmp/styles/controls.css";
import "@/components/gmp/navigation/enhancement.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import { getLocale } from "next-intl/server";
import { gmpFontVariables } from "@/components/gmp/fonts";
import { JsonLdSchemas } from "@/components/seo/JsonLdSchemas";
import { RevealController } from "@/components/gmp/navigation/RevealController";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#05070a",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  let locale = "es";
  try {
    locale = await getLocale();
  } catch {
    /* /admin is outside the localized tree and has no request locale. */
  }
  return (
    <html lang={locale} className={gmpFontVariables}>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/gmp/brand/logo-alpha.png" />
        <link rel="icon" type="image/svg+xml" href="/images/icons/icon.svg" />
        {/* JSON-LD SEO Schemas */}
        <JsonLdSchemas />
      </head>
      <body
        className="gmp-site antialiased"
        data-layout-hero="b"
        data-layout-story="b"
        data-layout-gallery="b"
        data-layout-curriculum="b"
        data-layout-closing="b"
        data-layout-footer="b"
      >
        {children}
        <RevealController />
      </body>
    </html>
  );
}
