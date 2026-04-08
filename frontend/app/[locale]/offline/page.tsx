'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Link } from '@/lib/navigation';

export default function OfflinePage() {
  return (
    <section className="px-6 py-24 md:px-10" style={{ backgroundColor: 'var(--color-beige)' }}>
      <div className="mx-auto max-w-lg rounded-[28px] border bg-white p-8 text-center" style={{ borderColor: 'rgba(14,22,32,0.12)' }}>
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0,122,229,0.12)' }}>
          <WifiOff className="h-10 w-10" style={{ color: 'var(--color-blue)' }} />
        </div>

        <h1 style={{ color: 'var(--color-black)' }}>Sin conexion</h1>
        <p className="mt-4" style={{ fontFamily: 'var(--font-text)', color: 'rgba(14,22,32,0.72)', lineHeight: 1.5 }}>
          Parece que no tienes conexion a internet. Verifica tu red y vuelve a intentarlo.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="joby-button blue px-6 py-4"
            style={{ fontFamily: 'var(--font-text)' }}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </span>
          </button>

          <Link href="/" className="joby-button px-6 py-4" style={{ fontFamily: 'var(--font-text)' }}>
            <span className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Ir al inicio
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
