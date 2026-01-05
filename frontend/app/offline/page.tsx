'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icono */}
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-amber-600" />
        </div>
        
        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Sin conexión
        </h1>
        
        {/* Descripción */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Parece que no tienes conexión a internet en este momento. 
          Verifica tu conexión WiFi o datos móviles e intenta de nuevo.
        </p>
        
        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Ir al inicio
          </Link>
        </div>
        
        {/* Sugerencias */}
        <div className="mt-10 text-left bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">
            Mientras tanto puedes:
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Verificar que el WiFi esté activado</li>
            <li>• Comprobar los datos móviles</li>
            <li>• Reiniciar el router si estás en casa</li>
            <li>• Esperar unos minutos e intentar de nuevo</li>
          </ul>
        </div>
        
        {/* Contacto */}
        <p className="text-sm text-gray-500 mt-8">
          ¿Necesitas ayuda urgente? Llama al{' '}
          <a 
            href="tel:968467514" 
            className="text-green-600 font-medium hover:underline"
          >
            968 46 75 14
          </a>
        </p>
      </div>
    </div>
  );
}
