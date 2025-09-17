import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grupo Topgel | Granja Mari Pepa - Distribución Alimentaria',
  description: 'Especialistas en distribución de productos alimentarios de alta calidad. Más de 35 años de experiencia en el sector.',
  keywords: 'distribución alimentaria, productos del mar, carne, precocinados, repostería, Murcia, Almería',
  openGraph: {
    title: 'Grupo Topgel | Granja Mari Pepa',
    description: 'Especialistas en distribución de productos alimentarios de alta calidad.',
    type: 'website',
    locale: 'es_ES',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* ScrollMagic CDN */}
        <script src="//cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.7/ScrollMagic.min.js" async></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.7/plugins/debug.addIndicators.min.js" async></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" async></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.7/plugins/animation.gsap.min.js" async></script>
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}