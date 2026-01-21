'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0c0a1e 0%, #1a1b3a 25%, #2d1b69 50%, #1a1b3a 75%, #0c0a1e 100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 max-w-2xl mx-auto"
      >
        <Lock className="w-24 h-24 mx-auto text-purple-400 opacity-80 mb-8" />
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Próximamente
        </h1>
        <p className="text-xl sm:text-2xl text-blue-200/90 mb-4">
          Estamos preparando algo especial
        </p>
        <p className="text-base sm:text-lg text-blue-200/70 mb-8 max-w-xl mx-auto">
          Nuestro catálogo de productos está siendo actualizado con nuevas funcionalidades.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3"
          >
            Volver al inicio
          </Button>
          <Button
            onClick={() => router.push('/area-clientes')}
            variant="outline"
            className="border-2 border-purple-400/30 text-purple-300 px-8 py-3"
          >
            Área de clientes
          </Button>
        </div>
        <div className="mt-12 flex items-center justify-center gap-2 text-blue-300/60 text-sm">
          <Clock className="w-4 h-4" />
          <span>Disponible próximamente</span>
        </div>
      </motion.div>
    </div>
  );
}
