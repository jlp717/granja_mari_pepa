import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Productos | Granja Mari Pepa - Alimentación de Calidad',
  description: 'Descubre nuestro catálogo completo de productos alimentarios: helados, lácteos, chocolates, snacks y mucho más. Precios competitivos y calidad garantizada.',
  keywords: ['productos alimentación', 'helados', 'lácteos', 'chocolates', 'snacks', 'bebidas', 'granja mari pepa', 'catálogo productos', 'alimentos calidad'],
  openGraph: {
    title: 'Productos - Granja Mari Pepa',
    description: 'Catálogo completo de productos alimentarios de primera calidad',
    type: 'website',
    images: [
      {
        url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
        width: 1200,
        height: 630,
        alt: 'Productos Granja Mari Pepa'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Productos - Granja Mari Pepa',
    description: 'Catálogo completo de productos alimentarios',
    images: ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://granjamaripepa.com/productos'
  }
};
