import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { ScrollToTopProvider } from '@/components/providers/scroll-to-top-provider'
import { PerformanceProvider } from '@/components/providers/performance-provider'
import { LazyLoadingProvider } from '@/components/providers/lazy-loading-provider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://granjamaripepa.netlify.app'),
  title: {
    default: 'Grupo Topgel | Granja Mari Pepa - Distribución Alimentaria',
    template: '%s | Grupo Topgel - Granja Mari Pepa'
  },
  description: 'Especialistas en distribución de productos alimentarios de alta calidad. Más de 35 años de experiencia en el sector alimentario.',
  keywords: ['distribución alimentaria', 'productos del mar', 'carne', 'precocinados', 'repostería', 'Murcia', 'Almería', 'Grupo Topgel'],
  authors: [{ name: 'Grupo Topgel' }],
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
    url: 'https://granjamaripepa.netlify.app',
    siteName: 'Grupo Topgel | Granja Mari Pepa',
    title: 'Grupo Topgel | Granja Mari Pepa - Distribución Alimentaria',
    description: 'Especialistas en distribución de productos alimentarios de alta calidad. Más de 35 años de experiencia en el sector.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Grupo Topgel - Granja Mari Pepa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grupo Topgel | Granja Mari Pepa',
    description: 'Especialistas en distribución de productos alimentarios de alta calidad.',
    images: ['/og-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'google-verification-code',
  },
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
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PerformanceProvider>
          <LazyLoadingProvider>
            <ScrollToTopProvider />
            <Header />
            <main className="pt-32 sm:pt-36 md:pt-40 lg:pt-44 min-h-screen">
              {children}
            </main>
            <Footer />
            <Toaster />
            <Sonner />
          </LazyLoadingProvider>
        </PerformanceProvider>
      </body>
    </html>
  )
}