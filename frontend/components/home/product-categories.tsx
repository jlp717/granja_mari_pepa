'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { productCategories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { GlareCard } from '@/components/ui/glare-card';
import ResponsiveImage from '@/components/ui/responsive-image';
import { useAnimatedSection } from '@/hooks/use-animated-section';
import { useReAnimatedSection } from '@/hooks/use-re-animated-section';

export function ProductCategories() {
  const [windowWidth, setWindowWidth] = useState(0);
  
  // Use the new re-animated section hook for navigation persistence
  const { sectionRef, isReduced } = useReAnimatedSection({
    threshold: 0.2,
    rootMargin: '100px',
    animationDelay: 50,
    stagger: 0.15,
    retriggerOnNavigation: true
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    // Set initial width
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-24 lg:py-32 overflow-hidden"
      style={{
        position: 'relative', // Fix for ScrollTrigger positioning warning
        background: `
          linear-gradient(135deg, 
            #0f172a 0%, 
            #1e293b 25%, 
            #334155 50%, 
            #1e293b 75%, 
            #0f172a 100%
          )
        `
      }}
    >
      {/* Professional background elements - RESPONSIVO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated grid pattern - OCULTO EN MÓVIL */}
        <div 
          className="absolute inset-0 opacity-5 sm:opacity-10 hidden sm:block"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            animation: 'grid-move 20s linear infinite'
          }}
        />
        
        {/* Floating orbs - REDUCIDOS EN MÓVIL */}
        {[
          { width: 40, height: 45, left: 15, top: 20, animation: 'float-0', duration: 10, delay: 1 },
          { width: 35, height: 40, left: 85, top: 60, animation: 'float-1', duration: 12, delay: 2 },
          { width: 45, height: 40, left: 45, top: 80, animation: 'float-2', duration: 9, delay: 0.5 },
          { width: 40, height: 50, left: 75, top: 15, animation: 'float-0', duration: 11, delay: 3 }
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10 sm:opacity-20"
            style={{
              width: `${windowWidth < 640 ? orb.width : orb.width * 2}px`,
              height: `${windowWidth < 640 ? orb.height : orb.height * 2}px`,
              background: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              filter: 'blur(2px)',
              animation: `${orb.animation} ${orb.duration}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Professional title section - ULTRA RESPONSIVO */}
        <div 
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          data-animate="title"
        >
          <motion.div 
            className="inline-flex items-center mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-semibold text-xs sm:text-sm">CATÁLOGO PREMIUM</span>
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 ml-2" />
          </motion.div>

          <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 leading-tight">
            <span 
              className="block bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent"
              style={{
                textShadow: '0 0 40px rgba(59, 130, 246, 0.6)',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))'
              }}
            >
              NUESTROS
            </span>
            <span 
              className="block bg-gradient-to-r from-blue-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent mt-1 sm:mt-2"
              style={{
                textShadow: '0 0 50px rgba(59, 130, 246, 0.8)',
                filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.9))'
              }}
            >
              PRODUCTOS
            </span>
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-blue-200/90 font-medium max-w-5xl mx-auto leading-relaxed px-2">
            <span 
              className="bg-gradient-to-r from-blue-200 to-cyan-300 bg-clip-text text-transparent"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'
              }}
            >
              Descubre nuestra selección premium de productos alimentarios, 
              cuidadosamente elegidos para satisfacer los más altos estándares de calidad
            </span>
          </p>
        </div>

        {/* Professional cards grid - COMPLETAMENTE RESPONSIVO */}
        <div 
          className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16"
          data-animate="content"
        >
          {productCategories.slice(0, 4).map((category, index) => (
            <Link 
              key={category.id} 
              href={`/productos?brand=${category.brandId}&category=${category.id}`} 
              className="block"
            >
              <GlareCard
                className="h-full group cursor-pointer transform transition-all duration-500 hover:scale-105"
                glareColor="rgba(59, 130, 246, 0.4)"
                glareIntensity={0.6}
                rotateIntensity={windowWidth < 768 ? 6 : 12}
                scaleOnHover={1.03}
                data-animate="card"
              >
                <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm border border-blue-400/20 rounded-lg sm:rounded-xl overflow-hidden">
                  
                  {/* Professional image with overlay - RESPONSIVO */}
                  <div className="h-40 sm:h-48 lg:h-56 relative overflow-hidden">
                    <ResponsiveImage
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full group-hover:scale-110 transition-transform duration-700"
                      priority={index < 2} // Priorizar primeras 2 imágenes
                      objectFit="cover"
                      sizes="(max-width: 475px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      placeholder="blur"
                    />
                    
                    {/* Professional gradient overlay */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `
                          linear-gradient(135deg,
                            rgba(59, 130, 246, 0.2) 0%,
                            transparent 50%,
                            rgba(0, 0, 0, 0.6) 100%
                          )
                        `
                      }}
                    />

                    {/* Floating category icon - RESPONSIVO */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <div 
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 flex items-center justify-center"
                        style={{
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <span className="text-lg sm:text-2xl filter drop-shadow-lg">
                          {category.icon}
                        </span>
                      </div>
                    </div>

                    {/* Premium badge - RESPONSIVO */}
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4">
                      <div 
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 197, 253, 0.9))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        PREMIUM
                      </div>
                    </div>
                  </div>

                  {/* Professional content - RESPONSIVO */}
                  <div className="p-4 sm:p-6 relative">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 group-hover:text-blue-300 transition-colors duration-300 line-clamp-2">
                      {category.name}
                    </h3>
                    
                    <p className="text-blue-200/80 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Professional CTA - RESPONSIVO */}
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-blue-300 hover:text-blue-200 group-hover:text-white transition-all duration-300"
                      >
                        <span className="font-semibold text-sm sm:text-base">Explorar</span>
                        <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>

                      {/* Hover indicator */}
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400/60 group-hover:bg-blue-300 group-hover:scale-150 transition-all duration-300" />
                    </div>
                  </div>

                  {/* Professional shine effect */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1/3 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent)',
                      filter: 'blur(1px)'
                    }}
                  />
                </div>
              </GlareCard>
            </Link>
          ))}
        </div>

        {/* Professional CTA section - RESPONSIVO */}
        <motion.div
          className="text-center"
          whileHover={{ scale: 1.02 }}
        >
          <Link href="/productos?brand=grupo-topgel">
            <Button 
              size="lg" 
              className="px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-xl sm:rounded-2xl transform transition-all duration-300 hover:scale-105 sm:hover:scale-110 group"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                <span className="hidden sm:inline">Ver Catálogo Grupo Topgel</span>
                <span className="sm:hidden">Ver Catálogo</span>
              </span>
              <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 sm:group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes float-0 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) translateX(10px) rotate(180deg);
            opacity: 0.4;
          }
        }

        @keyframes float-1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.2;
          }
          33% { 
            transform: translateY(-15px) translateX(-8px) rotate(120deg);
            opacity: 0.3;
          }
          66% { 
            transform: translateY(10px) translateX(12px) rotate(240deg);
            opacity: 0.4;
          }
        }

        @keyframes float-2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(15px) translateX(-10px) rotate(-180deg);
            opacity: 0.35;
          }
        }
      `}</style>
    </section>
  );
}