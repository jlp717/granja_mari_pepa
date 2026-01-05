'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, ShieldCheck, Sparkles, ExternalLink, ArrowRight, Building2 } from 'lucide-react';
import ResponsiveImage from '@/components/ui/responsive-image';
import { useReAnimatedSection } from '@/hooks/use-re-animated-section';
import Link from 'next/link';

// DATOS REALES - FUENTE: https://granjamaripepa.com/productos/
const distributors = [
  {
    id: 'grupo-topgel',
    name: 'Grupo Topgel',
    description: 'Productos congelados de alta calidad',
    detailedDescription: 'Líder en distribución de productos congelados: pescados, mariscos, carnes, precocinados y repostería de primera calidad.',
    image: '/images/logo-gtg.png',
    externalUrl: 'http://www.grupotopgel.es/',
    size: 'large' as const,
    category: 'Congelados Premium',
    color: '#3B82F6',
    specialties: ['Productos del mar', 'Carnes selectas', 'Precocinados', 'Repostería']
  },
  {
    id: 'nestle',
    name: 'Nestlé',
    description: 'Distribuidor oficial de helados Nestlé',
    detailedDescription: 'Granja Mari Pepa es distribuidor oficial de helados Nestlé para hostelería y establecimientos.',
    image: '/images/logo-nestle.png',
    externalUrl: 'https://www.helados.nestle.es/',
    size: 'large' as const,
    category: 'Helados Premium',
    color: '#EF4444',
    specialties: ['Helados hostelería', 'Tarinas', 'Postres helados', 'Especialidades']
  },
  {
    id: 'panamar',
    name: 'Panamar',
    description: 'Pan y masas congeladas',
    detailedDescription: 'Especialistas en panadería congelada de alta calidad para hostelería y restauración.',
    image: '/images/logo-panamar.png',
    externalUrl: 'http://www.panamar.es/',
    size: 'normal' as const,
    category: 'Panadería',
    color: '#06B6D4',
    specialties: ['Pan congelado', 'Masas fermentadas', 'Bollería']
  },
  /*
  {
    id: 'okin',
    name: 'Okin',
    description: 'Productos cárnicos de primera',
    detailedDescription: 'Carnes y embutidos de calidad superior con trazabilidad garantizada.',
    image: '/images/logo-okin.png',
    externalUrl: 'http://okin.es/es/',
    size: 'normal' as const,
    category: 'Cárnicos',
    color: '#F59E0B',
    specialties: ['Carnes frescas', 'Embutidos', 'Productos curados']
  },
  */
  /*
  {
    id: 'amparin',
    name: 'Pastelería Amparín',
    description: 'Repostería artesanal congelada',
    detailedDescription: 'Tartas y bollería artesanal congelada para hostelería y eventos.',
    image: '/images/logo-pamparin.png',
    externalUrl: 'http://www.pasteleriaamparin.com/',
    size: 'normal' as const,
    category: 'Repostería',
    color: '#EC4899',
    specialties: ['Tartas', 'Bollería', 'Dulces artesanales']
  }
  */
];

export function DistributorsSection() {
  const { sectionRef, isReduced } = useReAnimatedSection({
    threshold: 0.2,
    rootMargin: '100px',
    animationDelay: 50,
    stagger: 0.2,
    retriggerOnNavigation: true
  });

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 sm:py-28 lg:py-32 overflow-hidden"
      style={{
        position: 'relative',
        background: `
          linear-gradient(180deg, 
            #0f172a 0%, 
            #1a1f35 15%,
            #0d1525 50%,
            #1a1f35 85%,
            #0f172a 100%
          )
        `
      }}
    >
      {/* Fondo futurista con grid animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid futurista */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'grid-move 25s linear infinite',
            perspective: '1000px',
            transform: 'rotateX(60deg) translateZ(0)',
            transformOrigin: 'center top'
          }}
        />
        
        {/* Línea de energía horizontal animada */}
        <div 
          className="absolute left-0 right-0 h-px top-1/3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
            animation: 'pulse-line 3s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute left-0 right-0 h-px top-2/3"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.5), transparent)',
            animation: 'pulse-line 3s ease-in-out infinite 1.5s'
          }}
        />
        
        {/* Orbes de luz flotantes */}
        {[
          { size: 300, left: -5, top: 20, color: '59, 130, 246', delay: 0 },
          { size: 250, left: 80, top: 60, color: '147, 51, 234', delay: 2 },
          { size: 200, left: 40, top: 10, color: '6, 182, 212', delay: 1 },
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              background: `radial-gradient(circle, rgba(${orb.color}, 0.15) 0%, transparent 70%)`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              filter: 'blur(40px)',
              animation: `float-orb 15s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Título principal */}
        <div 
          className="text-center mb-16 sm:mb-20"
          data-animate="title"
        >
          <motion.div 
            className="inline-flex items-center mb-6 px-5 py-2.5 rounded-full border border-blue-400/40 bg-blue-500/10 backdrop-blur-md"
            whileHover={{ scale: 1.05 }}
          >
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-bold text-xs sm:text-sm tracking-wider">PARTNERS OFICIALES</span>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 ml-2" />
          </motion.div>

          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span 
              className="block text-white"
              style={{
                textShadow: '0 0 60px rgba(59, 130, 246, 0.4), 0 4px 20px rgba(0,0,0,0.8)'
              }}
            >
              MARCAS QUE
            </span>
            <span 
              className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
              style={{
                textShadow: '0 0 80px rgba(59, 130, 246, 0.6)'
              }}
            >
              DISTRIBUIMOS
            </span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
            Trabajamos con los <span className="text-blue-400 font-bold">líderes del sector alimentario</span> para 
            ofrecerte productos de <span className="text-cyan-400 font-bold">máxima calidad</span> y prestigio.
          </p>
        </div>

        {/* Grid de distribuidores - Diseño moderno con tarjetas glassmorphism */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto"
          data-animate="content"
        >
          {distributors.map((distributor, index) => (
            <motion.div
              key={distributor.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group ${distributor.size === 'large' ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <Link 
                href={distributor.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div 
                  className="relative h-full min-h-[280px] sm:min-h-[320px] rounded-2xl overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    boxShadow: `0 0 40px rgba(${distributor.color === '#3B82F6' ? '59, 130, 246' : distributor.color === '#EF4444' ? '239, 68, 68' : distributor.color === '#06B6D4' ? '6, 182, 212' : distributor.color === '#F59E0B' ? '245, 158, 11' : '236, 72, 153'}, 0.1)`
                  }}
                >
                  {/* Borde brillante animado */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${distributor.color}20, transparent 50%, ${distributor.color}10)`,
                      border: `1px solid ${distributor.color}40`
                    }}
                  />
                  
                  {/* Efecto de brillo en hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${distributor.color}, transparent 60%)`
                    }}
                  />

                  {/* Contenido */}
                  <div className="relative z-10 h-full flex flex-col p-6 sm:p-8">
                    {/* Header con logo y categoría */}
                    <div className="flex items-start justify-between mb-6">
                      {/* Logo container */}
                      <div 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                        }}
                      >
                        <ResponsiveImage
                          src={distributor.image}
                          alt={`Logo ${distributor.name}`}
                          className="w-full h-full object-contain filter brightness-110"
                          sizes="80px"
                        />
                      </div>
                      
                      {/* Badge de categoría */}
                      <span 
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${distributor.color}CC, ${distributor.color}99)`,
                          boxShadow: `0 4px 15px ${distributor.color}40`
                        }}
                      >
                        {distributor.category}
                      </span>
                    </div>

                    {/* Nombre y descripción */}
                    <div className="flex-1">
                      <h3 
                        className="text-xl sm:text-2xl font-bold mb-2 transition-colors duration-300"
                        style={{ color: distributor.color }}
                      >
                        {distributor.name}
                      </h3>
                      
                      <p className="text-slate-300 text-sm sm:text-base mb-4 leading-relaxed">
                        {distributor.detailedDescription}
                      </p>

                      {/* Especialidades */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {distributor.specialties.slice(0, 3).map((specialty, idx) => (
                          <span 
                            key={idx}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                        Ver productos
                      </span>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                        style={{
                          background: `linear-gradient(135deg, ${distributor.color}30, ${distributor.color}10)`,
                          border: `1px solid ${distributor.color}30`
                        }}
                      >
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Call to action final */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-slate-400 text-sm sm:text-base mb-4">
            ¿Interesado en nuestros productos?
          </p>
          <Link href="/contacto">
            <motion.button
              className="inline-flex items-center px-8 py-4 rounded-xl font-bold text-white transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Solicitar información
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: rotateX(60deg) translateZ(0) translateY(0); }
          100% { transform: rotateX(60deg) translateZ(0) translateY(60px); }
        }
        
        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
        
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </section>
  );
}