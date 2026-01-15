import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

// Viewport separado (requerido en Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#16a34a',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mari-pepa.com'),
  title: 'Granja Mari Pepa | Distribución Alimentaria Premium en Murcia y Almería',
  description: 'Líderes en distribución alimentaria para hostelería (HORECA) desde 1966. Más de 4000 referencias en productos congelados, frescos y secos. Servicio logístico integral 24h en Murcia y Almería.',
  keywords: [
    'distribución alimentaria murcia',
    'proveedores hostelería almería',
    'granja mari pepa',
    'productos congelados horeca',
    'distribuidor carne lorca',
    'pescado fresco por mayor',
    'grupo topgel',
    'logística alimentaria refrigerada'
  ],
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
    locale: 'es_ES',
    url: 'https://www.mari-pepa.com',
    siteName: 'Granja Mari Pepa - Calidad y Servicio desde 1966',
    title: 'Granja Mari Pepa | Distribución Alimentaria Premium',
    description: 'Soluciones integrales de alimentación para profesionales. Especialistas en carnes, pescados y precocinados de alta gama.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Granja Mari Pepa - Distribución Profesional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Granja Mari Pepa | Proveedor Líder HORECA',
    description: 'Distribución de productos alimentarios de alta calidad en Murcia y Almería. Servicio 24h.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.mari-pepa.com',
  },
  icons: {
    icon: [
      { url: '/images/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' } // Fallback
    ],
    apple: '/images/logo.jpeg', // Usamos el logo cuadrado para Apple touch icon
    shortcut: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/logo.jpeg" />
        <link rel="icon" type="image/svg+xml" href="/images/icons/icon.svg" />
        {/* JSON-LD SEO Schemas */}
        <JsonLdSchemas />
      </head>
      <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-background`}>
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
                      Ir al contenido principal
                    </a>
                    <Header />
                    {/* pt responsive: móvil (top-bar 48px + header 80px = 128px = pt-32), 
                        sm (48+96=144 = pt-36), md (48+112=160 = pt-40), lg+ (48+128=176 = pt-44) */}
                    <main
                      id="main-content"
                      className="pt-32 sm:pt-36 md:pt-40 lg:pt-44 flex-1 bg-background"
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
      </body>
    </html>
  )
}