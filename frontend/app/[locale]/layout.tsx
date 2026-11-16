import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { KageSiteShell } from "@/components/kage/KageSiteShell";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { PerformanceProvider } from "@/components/providers/performance-provider";
import { LazyLoadingProvider } from "@/components/providers/lazy-loading-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { GlobalChatbot } from "@/components/ui/global-chatbot";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { locales, type Locale } from "@/i18n";

// Force dynamic rendering only where the route needs request data.

// Viewport separado (requerido en Next.js 14+)

// Generar metadata dinámica por locale
export async function generateMetadata(props: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const params = await props.params;

  const { locale } = params;

  const t = await getTranslations({ locale, namespace: "meta" });
  const canonicalUrl = `https://www.mari-pepa.com/${locale}`;
  const ogLocaleMap: Record<string, string> = {
    es: "es_ES",
    en: "en_GB",
    de: "de_DE",
    it: "it_IT",
    zh: "zh_CN",
  };

  return {
    metadataBase: new URL("https://www.mari-pepa.com"),
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "Granja Maripepa", url: "https://www.mari-pepa.com" }],
    creator: "Granja Maripepa",
    publisher: "Granja Maripepa",
    robots:
      locale === "es" || locale === "en"
        ? {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              "max-video-preview": -1,
              "max-image-preview": "large",
              "max-snippet": -1,
            },
          }
        : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: ogLocaleMap[locale] || "es_ES",
      url: canonicalUrl,
      siteName: "Granja Maripepa",
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: "https://www.mari-pepa.com/og-maripepa.jpg",
          width: 1200,
          height: 630,
          alt: "Granja Maripepa · Distribución HORECA desde Lorca",
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://www.mari-pepa.com/og-maripepa.jpg"],
    },
    icons: {
      icon: [
        { url: "/images/icons/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        {
          url: "/kage/brand/logo-alpha.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
      shortcut: "/images/icons/icon.svg",
      other: [
        { rel: "mask-icon", url: "/images/icons/icon.svg", color: "#0d3d4d" },
      ],
    },
  };
}

// Generar rutas estáticas para todos los locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout(props: LocaleLayoutProps) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  // Validar locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Habilita renderizado estático para el árbol localizado (next-intl).
  setRequestLocale(locale);

  // Cargar mensajes de traducción
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ErrorBoundary>
        <ThemeProvider>
          <SessionProvider>
            <AnalyticsProvider>
              <PerformanceProvider>
                <LazyLoadingProvider>
                  <KageSiteShell
                    auxiliary={
                      <>
                        <Toaster />
                        <Sonner />
                        <GlobalChatbot />
                      </>
                    }
                  >
                    {children}
                  </KageSiteShell>
                </LazyLoadingProvider>
              </PerformanceProvider>
            </AnalyticsProvider>
          </SessionProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </NextIntlClientProvider>
  );
}
