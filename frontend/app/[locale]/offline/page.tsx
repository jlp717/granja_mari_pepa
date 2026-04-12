'use client'

import { Home, RefreshCw, WifiOff } from 'lucide-react'
import { Link } from '@/lib/navigation'

export default function OfflinePage() {
  return (
    <main className="pds-page pds-dark">
      <section className="pds-section min-h-screen">
        <div className="pds-grid">
          <div className="col-span-4 max-md:col-span-full">
            <span className="pds-eyebrow inline-flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Sin conexión
            </span>
          </div>
          <div className="col-span-9 col-start-6 max-md:col-span-full">
            <h1 className="pds-title mb-8">Sin conexión</h1>
            <p className="pds-copy mb-10 max-w-2xl text-white/80">
              Parece que no tienes conexión a internet en este momento. Verifica tu conexión WiFi o datos móviles e intenta de nuevo.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => window.location.reload()} className="pds-button">
                <RefreshCw className="h-5 w-5" />
                <span>Reintentar</span>
              </button>
              <Link href="/" className="pds-button pds-button--ghost">
                <Home className="h-5 w-5" />
                <span>Ir al inicio</span>
              </Link>
            </div>

            <div className="mt-14 max-w-xl border-t border-white/20 pt-8 text-white/70">
              <h2 className="mb-4 text-2xl font-medium tracking-[-0.03em]">Mientras tanto puedes:</h2>
              <ul className="space-y-2">
                <li>Verificar que el WiFi esté activado</li>
                <li>Comprobar los datos móviles</li>
                <li>Reiniciar el router si estás en casa</li>
                <li>Esperar unos minutos e intentar de nuevo</li>
              </ul>
              <p className="mt-8">
                ¿Necesitas ayuda urgente? Llama al{' '}
                <a href="tel:968467514" className="text-white underline">
                  968 46 75 14
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
