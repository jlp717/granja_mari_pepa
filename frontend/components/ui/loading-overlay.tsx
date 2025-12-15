/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LOADING SPINNER 3D - COMPONENTE PROFESIONAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Componente de carga moderno con animación 3D para evitar mostrar datos
 * parciales mientras se cargan desde la base de datos.
 * 
 * Características:
 * - Animación 3D suave y profesional
 * - Múltiples variantes (spinner, dots, pulse, skeleton)
 * - Bloqueo completo de la UI durante la carga
 * - Mensaje personalizable
 * - Diseño responsive
 * - Accesible (ARIA labels)
 * 
 * @author Sistema de UI/UX
 * @version 1.0.0
 */

'use client';

import { motion } from 'framer-motion';
import { Loader2, Package, TrendingUp, DollarSign, FileText } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'cube' | 'dashboard';
  fullscreen?: boolean;
  blur?: boolean;
}

export function LoadingOverlay({ 
  message = 'Cargando...', 
  submessage,
  variant = 'dashboard',
  fullscreen = false,
  blur = true
}: LoadingOverlayProps) {
  
  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0';

  return (
    <div 
      className={`${containerClasses} flex items-center justify-center bg-black/60 ${blur ? 'backdrop-blur-md' : ''}`}
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {variant === 'spinner' && <SpinnerLoader />}
        {variant === 'dots' && <DotsLoader />}
        {variant === 'pulse' && <PulseLoader />}
        {variant === 'cube' && <CubeLoader />}
        {variant === 'dashboard' && <DashboardLoader />}
        
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {message}
            </h3>
            {submessage && (
              <p className="text-blue-200/70 text-sm">
                {submessage}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VARIANTE: SPINNER SIMPLE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function SpinnerLoader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-16 h-16"
    >
      <Loader2 className="w-full h-full text-blue-400" />
    </motion.div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VARIANTE: DOTS ANIMADOS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function DotsLoader() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -20 }
  };

  return (
    <div className="flex space-x-3">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.15
          }}
          className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
        />
      ))}
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VARIANTE: PULSE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function PulseLoader() {
  return (
    <div className="relative w-24 h-24">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0 rounded-full border-4 border-blue-400"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.6
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
      </div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VARIANTE: CUBO 3D
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function CubeLoader() {
  return (
    <div className="relative w-24 h-24" style={{ perspective: '1000px' }}>
      <motion.div
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: 360,
          rotateY: 360
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {/* Caras del cubo */}
        {[
          { rotateY: 0, translateZ: 48, bg: 'from-blue-500 to-blue-600' },
          { rotateY: 90, translateZ: 48, bg: 'from-purple-500 to-purple-600' },
          { rotateY: 180, translateZ: 48, bg: 'from-pink-500 to-pink-600' },
          { rotateY: -90, translateZ: 48, bg: 'from-cyan-500 to-cyan-600' },
          { rotateX: 90, translateZ: 48, bg: 'from-indigo-500 to-indigo-600' },
          { rotateX: -90, translateZ: 48, bg: 'from-violet-500 to-violet-600' }
        ].map((face, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-gradient-to-br ${face.bg} opacity-80 border border-white/20`}
            style={{
              transform: `rotateY(${face.rotateY}deg) rotateX(${face.rotateX || 0}deg) translateZ(${face.translateZ}px)`
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VARIANTE: DASHBOARD (Específico para datos de cliente)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
function DashboardLoader() {
  const icons = [
    { Icon: DollarSign, color: 'from-green-400 to-emerald-500', delay: 0 },
    { Icon: FileText, color: 'from-blue-400 to-cyan-500', delay: 0.2 },
    { Icon: TrendingUp, color: 'from-purple-400 to-pink-500', delay: 0.4 },
    { Icon: Package, color: 'from-orange-400 to-red-500', delay: 0.6 }
  ];

  return (
    <div className="relative w-32 h-32">
      {/* Círculo central pulsante */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20" />
      </motion.div>

      {/* Iconos orbitando */}
      {icons.map(({ Icon, color, delay }, index) => {
        const angle = (index * 360) / icons.length;
        
        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2"
            style={{
              marginLeft: '-12px',
              marginTop: '-12px'
            }}
            animate={{
              rotate: 360,
              x: Math.cos((angle * Math.PI) / 180) * 50,
              y: Math.sin((angle * Math.PI) / 180) * 50
            }}
            transition={{
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              },
              x: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: 'linear'
              },
              delay
            }}
          >
            <motion.div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay
              }}
            >
              <Icon className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Anillo exterior rotando */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SKELETON LOADER (Para cargar contenido progresivamente)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm p-6 border border-white/10 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-white/10 rounded" />
        <div className="h-8 w-8 bg-white/10 rounded-full" />
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-32 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
      </div>

      {/* Footer skeleton */}
      <div className="mt-6 flex justify-between">
        <div className="h-3 w-20 bg-white/10 rounded" />
        <div className="h-3 w-16 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SKELETON TABLE (Para tablas de datos)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-white/10 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 h-6 bg-white/10 rounded animate-pulse"
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingOverlay;
