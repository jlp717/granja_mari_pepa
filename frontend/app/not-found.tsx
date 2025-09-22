'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, ShoppingBag, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated 404 */}
        <motion.div
          className="relative mb-8"
          animate={floatingAnimation}
        >
          <motion.h1
            className="text-[12rem] md:text-[16rem] font-bold text-emerald-500/20 leading-none select-none"
            variants={itemVariants}
          >
            404
          </motion.h1>

          {/* Floating elements */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-8 h-8 bg-emerald-400 rounded-full opacity-60"
            animate={{
              y: [-15, 15, -15],
              x: [-5, 5, -5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-3/4 right-1/4 w-6 h-6 bg-emerald-600 rounded-full opacity-40"
            animate={{
              y: [10, -20, 10],
              x: [5, -5, 5],
              rotate: [360, 180, 0]
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="space-y-6">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-gray-800"
            variants={itemVariants}
          >
            ¡Oops! Página no encontrada
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 max-w-md mx-auto"
            variants={itemVariants}
          >
            La página que buscas no existe o ha sido movida.
            No te preocupes, te ayudamos a encontrar lo que necesitas.
          </motion.p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
          variants={itemVariants}
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="group hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver Atrás
          </Button>

          <Link href="/">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Button>
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div
          className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Enlaces rápidos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/productos"
              className="group flex items-center p-3 rounded-lg hover:bg-emerald-50 transition-colors duration-200"
            >
              <ShoppingBag className="h-5 w-5 text-emerald-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-emerald-700">
                Ver Productos
              </span>
            </Link>

            <Link
              href="/contacto"
              className="group flex items-center p-3 rounded-lg hover:bg-emerald-50 transition-colors duration-200"
            >
              <Search className="h-5 w-5 text-emerald-600 mr-3 group-hover:scale-110 transition-transform" />
              <span className="text-gray-700 group-hover:text-emerald-700">
                Contacto
              </span>
            </Link>
          </div>
        </motion.div>

        {/* Footer text */}
        <motion.p
          className="mt-8 text-sm text-gray-500"
          variants={itemVariants}
        >
          Si el problema persiste, no dudes en{' '}
          <Link
            href="/contacto"
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            contactarnos
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}