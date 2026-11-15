import "./globals.css";
import "@/components/kage/styles/kage.css";
import "@/components/kage/styles/controls.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import { getLocale } from "next-intl/server";
import { kageFontVariables } from "@/components/kage/fonts";
import { JsonLdSchemas } from "@/components/seo/JsonLdSchemas";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#05070a",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let locale = "es";
  try {
    locale = await getLocale();
  } catch {
    /* /admin is outside the localized tree and has no request locale. */
  }
  return (
    <html lang={locale} className={kageFontVariables}>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/kage/brand/logo-alpha.png" />
        <link rel="icon" type="image/svg+xml" href="/images/icons/icon.svg" />
        {/* JSON-LD SEO Schemas */}
        <JsonLdSchemas />
      </head>
      <body
        className="kage-site antialiased"
        data-layout-hero="b"
        data-layout-story="b"
        data-layout-gallery="b"
        data-layout-curriculum="b"
        data-layout-closing="b"
        data-layout-footer="b"
      >
        {children}
      </body>
    </html>
  );
}
