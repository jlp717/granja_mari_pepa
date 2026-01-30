import '../globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { ScrollToTopProvider } from '@/components/providers/scroll-to-top-provider'
import { PerformanceProvider } from '@/components/providers/performance-provider'
import { LazyLoadingProvider } from '@/components/providers/lazy-loading-provider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { GlobalChatbot } from '@/components/ui/global-chatbot'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { JsonLdSchemas } from '@/components/seo/JsonLdSchemas'
import { locales, type Locale } from '@/i18n'
import { TolgeeProvider } from '@/components/providers/tolgee-provider'

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', 'arial']
})

// Force dynamic rendering to avoid SSG 404s
export const dynamic = 'force-dynamic';

// Viewport separado (requerido en Next.js 14+)
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#16a34a',
};

// Generar metadata dinámica por locale
export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'meta' });
    const isSpanish = locale === 'es';

    return {
        metadataBase: new URL('https://www.mari-pepa.com'),
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        authors: [{ name: 'Granja Mari Pepa', url: 'https://www.mari-pepa.com' }],
        creator: 'Grupo Topgel',
        publisher: 'Granja Mari Pepa',
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        openGraph: {
            type: 'website',
            locale: isSpanish ? 'es_ES' : 'en_US',
            url: isSpanish ? 'https://www.mari-pepa.com' : 'https://www.mari-pepa.com/en',
            siteName: 'Granja Mari Pepa',
            title: t('title'),
            description: t('description'),
            images: [
                {
                    url: 'https://www.mari-pepa.com/og-image.jpg',
                    width: 1200,
                    height: 630,
                    alt: t('title'),
                    type: 'image/jpeg',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['https://www.mari-pepa.com/og-image.jpg'],
            creator: '@GranjaMaripepa',
        },
        alternates: {
            canonical: isSpanish ? 'https://www.mari-pepa.com' : 'https://www.mari-pepa.com/en',
            languages: {
                'es': 'https://www.mari-pepa.com',
                'en': 'https://www.mari-pepa.com/en',
            },
        },
        icons: {
            icon: [
                { url: '/images/icons/icon.svg', type: 'image/svg+xml' },
                { url: '/favicon.ico', sizes: 'any' },
            ],
            apple: [
                { url: '/images/logo.jpeg', sizes: '180x180', type: 'image/jpeg' },
            ],
            shortcut: '/images/icons/icon.svg',
            other: [
                { rel: 'mask-icon', url: '/images/icons/icon.svg', color: '#0d3d4d' },
            ],
        }
    };
}

// Generar rutas estáticas para todos los locales
export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
    children: React.ReactNode;
    params: { locale: Locale };
}

export default async function LocaleLayout({
    children,
    params: { locale }
}: LocaleLayoutProps) {
    // Validar locale
    if (!locales.includes(locale)) {
        notFound();
    }

    // Cargar mensajes de traducción
    const messages = await getMessages();

    return (
        <html lang={locale} className="scroll-smooth">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="//fonts.googleapis.com" />
                <link rel="dns-prefetch" href="//fonts.gstatic.com" />
                {/* PWA Manifest */}
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/images/logo.jpeg" />
                <link rel="icon" type="image/svg+xml" href="/images/icons/icon.svg" />
                {/* hreflang para SEO multilingüe */}
                <link rel="alternate" hrefLang="es" href="https://www.mari-pepa.com" />
                <link rel="alternate" hrefLang="en" href="https://www.mari-pepa.com/en" />
                <link rel="alternate" hrefLang="x-default" href="https://www.mari-pepa.com" />
                {/* JSON-LD SEO Schemas */}
                <JsonLdSchemas />
            </head>
            <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-background`}>
                <NextIntlClientProvider messages={messages}>
                    <TolgeeProvider>
                        <ErrorBoundary>
                            <ThemeProvider>
                                <SessionProvider>
                                    <AnalyticsProvider>
                                        <PerformanceProvider>
                                            <LazyLoadingProvider>
                                                <ScrollToTopProvider />
                                                {/* Skip to main content para accesibilidad */}
                                                <a
                                                    href="#main-content"
                                                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:outline-none"
                                                >
                                                    {locale === 'es' ? 'Ir al contenido principal' : 'Skip to main content'}
                                                </a>
                                                <Header />
                                                {/* pt responsive: móvil (top-bar 48px + header 80px = 128px = pt-32), 
                              sm (48+96=144 = pt-36), md (48+112=160 = pt-40), lg+ (48+128=176 = pt-44) */}
                                                {/* pt responsive: Top 12 + Announce 11 + Header (Variable) */}
                                                {/* pt responsive: Adjusted for Taller Mobile Announcement (8rem + Height) */}
                                                <main
                                                    id="main-content"
                                                    className="pt-56 sm:pt-48 md:pt-52 lg:pt-56 flex-1 bg-background"
                                                    role="main"
                                                >
                                                    {children}
                                                </main>
                                                <Footer />
                                                <Toaster />
                                                <Sonner />
                                                <GlobalChatbot />
                                            </LazyLoadingProvider>
                                        </PerformanceProvider>
                                    </AnalyticsProvider>
                                </SessionProvider>
                            </ThemeProvider>
                        </ErrorBoundary>
                    </TolgeeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
