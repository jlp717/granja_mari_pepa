import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { ScrollToTopProvider } from '@/components/providers/scroll-to-top-provider';

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
      <body className={inter.className}>
        <ScrollToTopProvider />
        <Header />
        <main className="pt-32 sm:pt-36 md:pt-40 lg:pt-44">{children}</main>
        <Footer />
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}