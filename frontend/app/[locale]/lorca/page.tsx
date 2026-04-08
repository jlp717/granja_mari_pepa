import type { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import { MapPin, Phone, Mail, Clock, Truck, Award, Users, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Distribucion Alimentaria en Lorca | Granja Mari Pepa - Poligono Saprelorca',
  description:
    'Granja Mari Pepa en Lorca (Murcia). Distribuidores de productos congelados, carnes, pescados y precocinados para hosteleria.',
};

export default function LorcaPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-beige)' }}>
      <section className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: 'var(--color-navy)' }}>
        <div className="mx-auto max-w-5xl text-center">
          <p
            style={{
              fontFamily: 'var(--font-text)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.82rem',
              color: 'rgba(245,244,223,0.7)',
              marginBottom: '1rem',
            }}
          >
            Poligono Industrial Saprelorca
          </p>
          <h1 style={{ color: 'var(--color-beige)' }}>Granja Mari Pepa en Lorca</h1>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.1rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.84)',
            }}
          >
            Tu distribuidor de confianza desde 1966 para hosteleria y restauracion en Murcia y Almeria.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/contacto" className="joby-button blue px-8 py-4" style={{ fontFamily: 'var(--font-text)' }}>
              <span className="inline-flex items-center gap-2">
                Contactar
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/productos" className="joby-button px-8 py-4" style={{ fontFamily: 'var(--font-text)' }}>
              <span>Ver productos</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <article className="rounded-[28px] border bg-white p-8" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
            <h2 style={{ color: 'var(--color-black)', marginBottom: '1rem' }}>Datos de contacto</h2>
            <div className="space-y-4" style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)' }}>
              <p className="inline-flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1" />
                <span>Pol. Industrial Saprelorca, Avd. Francisco Jimeno Sola 3, 30817 Lorca (Murcia)</span>
              </p>
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+34968467514" style={{ color: 'var(--color-blue)' }}>968 46 75 14</a>
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:pedidos@mari-pepa.com" style={{ color: 'var(--color-blue)' }}>pedidos@mari-pepa.com</a>
              </p>
              <p className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lunes a Viernes, 8:00 - 13:00 y 16:00 - 19:00
              </p>
            </div>
          </article>

          <article className="rounded-[28px] border bg-white p-8" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
            <h2 style={{ color: 'var(--color-black)', marginBottom: '1rem' }}>Por que elegirnos</h2>
            <div className="space-y-4" style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)' }}>
              <p className="inline-flex items-center gap-2"><Truck className="h-4 w-4" /> Entrega 24-48h</p>
              <p className="inline-flex items-center gap-2"><Award className="h-4 w-4" /> Certificacion ISO 9001</p>
              <p className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Mas de 55 anos de experiencia</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
