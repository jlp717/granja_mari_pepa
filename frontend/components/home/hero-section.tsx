'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsiveVideo from '@/components/ui/responsive-video';
import ResponsiveImage from '@/components/ui/responsive-image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const squidRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [isReduced, setIsReduced] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fixed floating particles data to prevent hydration issues
  const FLOATING_PARTICLES = [
    { left: 15, top: 25, size: 4, opacity: 0.4, duration: 12, delay: 0 },
    { left: 85, top: 60, size: 3, opacity: 0.3, duration: 15, delay: 2 },
    { left: 45, top: 80, size: 5, opacity: 0.5, duration: 10, delay: 1 },
    { left: 75, top: 15, size: 4, opacity: 0.4, duration: 13, delay: 3 },
    { left: 25, top: 45, size: 3, opacity: 0.3, duration: 14, delay: 1.5 },
    { left: 65, top: 35, size: 4, opacity: 0.4, duration: 11, delay: 2.5 },
    { left: 35, top: 70, size: 5, opacity: 0.5, duration: 12, delay: 0.5 },
    { left: 90, top: 40, size: 3, opacity: 0.3, duration: 16, delay: 1.8 },
    { left: 10, top: 55, size: 4, opacity: 0.4, duration: 13, delay: 2.3 },
    { left: 55, top: 20, size: 3, opacity: 0.3, duration: 14, delay: 1.1 },
    { left: 20, top: 65, size: 4, opacity: 0.4, duration: 15, delay: 0.8 },
    { left: 80, top: 25, size: 5, opacity: 0.5, duration: 11, delay: 2.8 },
    { left: 40, top: 50, size: 3, opacity: 0.3, duration: 13, delay: 1.3 },
    { left: 70, top: 75, size: 4, opacity: 0.4, duration: 12, delay: 2.1 },
    { left: 30, top: 30, size: 5, opacity: 0.5, duration: 14, delay: 0.3 }
  ];

  useEffect(() => {
    if (!heroRef.current || isReduced) return;

    const hero = heroRef.current;
    const squid = squidRef.current;
    const ink = inkRef.current;
    const title = titleRef.current;

    // Professional parallax effects with ScrollTrigger
    const parallaxTl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

    // Smooth title parallax
    if (title) {
      parallaxTl.to(title, {
        y: -50,
        opacity: 0.7,
        ease: 'none'
      });
    }

    // Professional ink expansion effect
    if (ink) {
      gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 2
        }
      }).to(ink.querySelector('div'), {
        scale: 8,
        opacity: 0.6,
        ease: 'power2.out'
      });
    }

    // Smooth squid rotation
    if (squid) {
      gsap.to(squid, {
        rotation: 360,
        duration: 25,
        ease: 'none',
        repeat: -1
      });

      // Squid parallax effect
      gsap.to(squid, {
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5
        },
        scale: 1.1,
        opacity: 0.4,
        ease: 'none'
      });
    }

    // Create deterministic floating particles
    FLOATING_PARTICLES.forEach((particle, i) => {
      const particleEl = document.createElement('div');
      particleEl.className = 'floating-particle';
      particleEl.style.cssText = `
        position: absolute;
        width: ${particle.size}px;
        height: ${particle.size}px;
        background: rgba(59, 130, 246, ${particle.opacity});
        border-radius: 50%;
        pointer-events: none;
        left: ${particle.left}%;
        top: ${particle.top}%;
        z-index: 5;
      `;
      hero.appendChild(particleEl);

      gsap.to(particleEl, {
        x: (particle.left > 50 ? -100 : 100),
        y: (particle.top > 50 ? -80 : 80),
        duration: particle.duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: particle.delay
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      // Clean up particles
      hero.querySelectorAll('.floating-particle').forEach(p => p.remove());
    };
  }, [isReduced]);

  const scrollToProducts = () => {
    const productsSection = document.getElementById('productos-section');
    if (productsSection) {
      productsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
        style={{
          background: 'radial-gradient(ellipse at center, #1e3a8a 0%, #0f172a 70%)',
          minHeight: '100dvh' // Usar dvh para mejor soporte móvil
        }}
      >
        {/* Overlay con textura */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        
        {/* Efecto de ondas de agua - RESPONSIVO */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-blue-400/10"></div>
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
              `
            }}
          ></div>
        </div>

        {/* Calamar principal - RESPONSIVO */}
        <div 
          ref={squidRef}
          className="absolute inset-0 flex items-center justify-center z-5 opacity-60 sm:opacity-80"
        >
          <div 
            className="w-48 h-48 sm:w-80 sm:h-80 lg:w-96 lg:h-96 relative transform transition-all duration-1000"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 50% 40%, rgba(31, 41, 55, 0.9) 0%, rgba(31, 41, 55, 0.7) 40%, transparent 70%),
                radial-gradient(ellipse 40% 60% at 50% 70%, rgba(55, 65, 81, 0.8) 0%, rgba(55, 65, 81, 0.4) 50%, transparent 70%)
              `,
              clipPath: 'ellipse(45% 60% at 50% 45%)'
            }}
          >
            {/* Tentáculos del calamar - RESPONSIVO */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 left-1/2 origin-top transform -translate-x-1/2"
                style={{
                  width: '2px',
                  height: `${Math.random() * 40 + 30}px`,
                  background: 'linear-gradient(to bottom, rgba(75, 85, 99, 0.9), rgba(55, 65, 81, 0.6))',
                  borderRadius: '2px',
                  transform: `translateX(-50%) rotate(${(i * 45) - 157.5}deg) translateY(10px)`,
                  animation: `tentacle-wave-${i} ${3 + Math.random() * 2}s ease-in-out infinite`
                }}
              />
            ))}
            
            {/* Ojos del calamar - RESPONSIVO */}
            <div className="absolute top-1/3 left-1/3 w-2 h-2 sm:w-4 sm:h-4 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 sm:w-4 sm:h-4 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
          </div>
        </div>

        {/* Efecto de tinta que se expande - RESPONSIVO */}
        <div 
          ref={inkRef}
          className="absolute inset-0 z-0 flex items-center justify-center"
        >
          <div 
            className="w-16 h-16 sm:w-32 sm:h-32 rounded-full opacity-0 transform scale-0"
            style={{
              background: 'radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(30, 58, 138, 0.8) 30%, rgba(59, 130, 246, 0.6) 60%, transparent 100%)'
            }}
          ></div>
        </div>

        {/* Contenido principal - ULTRA RESPONSIVO */}
        <div 
          ref={titleRef}
          className="relative z-20 text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Título principal con efectos - RESPONSIVO */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              <span 
                className="inline-block"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c7d2fe 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
                  animation: 'title-glow 3s ease-in-out infinite alternate'
                }}
              >
                Mari Pepa
              </span>
            </h1>
            <div 
              className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light mb-2"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Grupo Topgel
            </div>
            <div className="text-sm sm:text-base lg:text-lg text-blue-300 opacity-90">
              Del mar a tu mesa
            </div>
          </div>

          {/* Descripción - RESPONSIVO */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed opacity-90 px-4">
            Productos del mar de la más alta calidad.
            <span className="block mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg text-blue-200">
              Más de 35 años llevando la excelencia marina a tu negocio.
            </span>
          </p>

          {/* Botones CTA - ULTRA RESPONSIVO Y PERFECTO */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4">
            <motion.div
              whileHover={{ 
                scale: 1.05,
                rotate: [0, 1, -1, 0],
                transition: { 
                  rotate: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
                  scale: { duration: 0.3, type: "spring", stiffness: 400 }
                }
              }}
              whileTap={{ scale: 0.98, rotate: 0 }}
              className="w-full sm:w-auto relative group"
            >
              <Button 
                onClick={scrollToProducts}
                size="lg" 
                className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-500 border border-blue-400/30 w-full sm:w-auto focus-ring"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Efecto de ondas al hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                {/* Partículas brillantes */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-2 left-4 w-1 h-1 bg-white/80 rounded-full animate-ping" />
                  <div className="absolute top-4 right-6 w-1 h-1 bg-white/60 rounded-full animate-ping animation-delay-300" />
                  <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/70 rounded-full animate-ping animation-delay-500" />
                </div>
                
                {/* Contenido del botón */}
                <div className="relative z-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="hidden xs:inline mr-3 group-hover:tracking-wide transition-all duration-300">
                    Descubre nuestros productos
                  </span>
                  <span className="xs:hidden mr-3 group-hover:tracking-wide transition-all duration-300">
                    Ver productos
                  </span>
                  <motion.div
                    animate={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:drop-shadow-lg" />
                  </motion.div>
                </div>

                {/* Borde brillante animado */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 border-2 border-white/30 animate-pulse" />
              </Button>
            </motion.div>
            
            <Link href="/contacto" className="w-full sm:w-auto">
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(255, 255, 255, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative group"
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  className="relative overflow-hidden border-2 border-white/70 text-white hover:bg-white hover:text-slate-900 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl backdrop-blur-md bg-white/10 transition-all duration-500 w-full sm:w-auto focus-ring group-hover:border-white"
                >
                  {/* Efecto de llenado desde abajo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-white scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom rounded-xl" />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  
                  <span className="relative z-10 group-hover:scale-105 transition-transform duration-300 group-hover:font-black">
                    Contacto
                  </span>
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Indicador de scroll animado - PERFECCIONADO */}
          <motion.div 
            className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            <motion.div 
              onClick={scrollToProducts}
              className="cursor-pointer group relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full blur-md bg-white/20 scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex flex-col items-center text-white/70 group-hover:text-white transition-all duration-300 relative z-10">
                <motion.span 
                  className="text-xs sm:text-sm mb-2 font-medium hidden sm:block group-hover:scale-105 transition-transform duration-300"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Explora hacia abajo
                </motion.span>
                
                <div className="relative">
                  {/* Outer ring with pulse */}
                  <motion.div 
                    className="absolute inset-0 w-6 h-8 sm:w-8 sm:h-12 border-2 border-white/30 rounded-full"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      borderColor: ["rgba(255,255,255,0.3)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.3)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Main scroll indicator */}
                  <div className="w-6 h-8 sm:w-8 sm:h-12 border-2 border-white/50 rounded-full flex justify-center group-hover:border-white transition-colors duration-300 bg-white/5 backdrop-blur-sm">
                    <motion.div 
                      className="w-1 h-3 sm:w-1.5 sm:h-6 bg-white/70 rounded-full mt-1 sm:mt-2 group-hover:bg-white transition-colors duration-300"
                      animate={{
                        y: [0, 8, 0],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  {/* Floating particles around indicator */}
                  <motion.div 
                    className="absolute -top-1 -left-1 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, 360] 
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: 0 
                    }}
                  />
                  <motion.div 
                    className="absolute -top-1 -right-1 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [360, 0] 
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: 1 
                    }}
                  />
                </div>
                
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-4 h-4 sm:w-6 sm:h-6 mt-1 sm:mt-2 group-hover:scale-110 transition-transform duration-300" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Burbujas flotantes - RESPONSIVO */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
          {[...Array(window.innerWidth < 640 ? 10 : 20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-sm"
              style={{
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `bubble-float-${i % 3} ${Math.random() * 10 + 10}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
      </section>

      {/* Estilos CSS dinámicos */}
      <style jsx>{`
        @keyframes title-glow {
          0% { text-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
          100% { text-shadow: 0 0 60px rgba(59, 130, 246, 0.8), 0 0 80px rgba(147, 197, 253, 0.3); }
        }

        @keyframes scroll-indicator {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        @keyframes bubble-float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes bubble-float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(10px); }
          66% { transform: translateY(-30px) translateX(-10px); }
        }

        @keyframes bubble-float-2 {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(180deg) translateY(-25px); }
        }

        ${[...Array(8)].map((_, i) => `
          @keyframes tentacle-wave-${i} {
            0%, 100% { transform: translateX(-50%) rotate(${(i * 45) - 157.5}deg) translateY(20px); }
            50% { transform: translateX(-50%) rotate(${(i * 45) - 157.5 + (Math.random() * 20 - 10)}deg) translateY(${20 + Math.random() * 10}px); }
          }
        `).join('\n')}
      `}</style>
    </>
  );
}