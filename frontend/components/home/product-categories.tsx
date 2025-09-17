'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { productCategories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { GlareCard } from '@/components/ui/glare-card';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ProductCategories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [isReduced, setIsReduced] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // GSAP Scroll-triggered animations
  useEffect(() => {
    if (!sectionRef.current || isReduced) return;

    const section = sectionRef.current;
    const title = titleRef.current;
    const cards = cardsRef.current;

    // Professional title reveal animation
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'top 30%',
        toggleActions: 'play none none reverse'
      }
    })
    .fromTo(title, {
      opacity: 0,
      y: 60,
      scale: 0.9,
      rotationX: 45
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      duration: 1,
      ease: 'power3.out'
    });

    // Staggered cards animation with professional timing
    if (cards) {
      const cardElements = cards.children;
      gsap.timeline({
        scrollTrigger: {
          trigger: cards,
          start: 'top 85%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      })
      .fromTo(cardElements, {
        opacity: 0,
        y: 100,
        scale: 0.8,
        rotationY: 45
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out'
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isReduced]);

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
      style={{
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
      {/* Professional background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'grid-move 20s linear infinite'
          }}
        />
        
        {/* Floating orbs */}
        {[
          { width: 80, height: 90, left: 15, top: 20, animation: 'float-0', duration: 10, delay: 1 },
          { width: 65, height: 75, left: 85, top: 60, animation: 'float-1', duration: 12, delay: 2 },
          { width: 95, height: 85, left: 45, top: 80, animation: 'float-2', duration: 9, delay: 0.5 },
          { width: 70, height: 95, left: 75, top: 15, animation: 'float-0', duration: 11, delay: 3 },
          { width: 85, height: 70, left: 25, top: 45, animation: 'float-1', duration: 8.5, delay: 1.5 },
          { width: 75, height: 80, left: 60, top: 35, animation: 'float-2', duration: 10.5, delay: 2.5 }
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${orb.width}px`,
              height: `${orb.height}px`,
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

      <div className="container mx-auto px-4 relative z-10">
        {/* Professional title section */}
        <div 
          ref={titleRef}
          className="text-center mb-20"
        >
          <motion.div 
            className="inline-flex items-center mb-6 px-6 py-3 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-semibold text-sm">CATÁLOGO PREMIUM</span>
            <Zap className="w-5 h-5 text-blue-400 ml-2" />
          </motion.div>

          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span 
              className="block bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent"
              style={{
                textShadow: '0 0 80px rgba(59, 130, 246, 0.6)',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
              }}
            >
              NUESTROS
            </span>
            <span 
              className="block bg-gradient-to-r from-blue-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent mt-2"
              style={{
                textShadow: '0 0 100px rgba(59, 130, 246, 0.8)',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.9))'
              }}
            >
              PRODUCTOS
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-blue-200/90 font-medium max-w-4xl mx-auto leading-relaxed">
            <span 
              className="bg-gradient-to-r from-blue-200 to-cyan-300 bg-clip-text text-transparent"
              style={{
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'
              }}
            >
              Descubre nuestra selección premium de productos alimentarios, 
              cuidadosamente elegidos para satisfacer los más altos estándares de calidad
            </span>
          </p>
        </div>

        {/* Professional cards grid */}
        <div 
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {productCategories.map((category, index) => (
            <Link key={category.id} href={`/productos?categoria=${category.id}`} className="block">
              <GlareCard
                className="h-full group cursor-pointer transform transition-all duration-500 hover:scale-105"
                glareColor="rgba(59, 130, 246, 0.4)"
                glareIntensity={0.6}
                rotateIntensity={12}
                scaleOnHover={1.03}
              >
                <div className="relative h-full bg-gradient-to-br from-slate-800/50 to-slate-900/80 backdrop-blur-sm border border-blue-400/20 rounded-xl overflow-hidden">
                  
                  {/* Professional image with overlay */}
                  <div className="h-56 relative overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      style={{
                        filter: 'contrast(1.1) saturate(1.2) brightness(0.9)'
                      }}
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

                    {/* Floating category icon */}
                    <div className="absolute top-4 right-4">
                      <div 
                        className="w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 flex items-center justify-center"
                        style={{
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <span className="text-2xl filter drop-shadow-lg">
                          {category.icon}
                        </span>
                      </div>
                    </div>

                    {/* Premium badge */}
                    <div className="absolute bottom-4 left-4">
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 197, 253, 0.9))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        PREMIUM
                      </div>
                    </div>
                  </div>

                  {/* Professional content */}
                  <div className="p-6 relative">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                      {category.name}
                    </h3>
                    
                    <p className="text-blue-200/80 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Professional CTA */}
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto text-blue-300 hover:text-blue-200 group-hover:text-white transition-all duration-300"
                      >
                        <span className="font-semibold">Explorar</span>
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>

                      {/* Hover indicator */}
                      <div className="w-2 h-2 rounded-full bg-blue-400/60 group-hover:bg-blue-300 group-hover:scale-150 transition-all duration-300" />
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

        {/* Professional CTA section */}
        <motion.div
          className="text-center"
          whileHover={{ scale: 1.02 }}
        >
          <Link href="/productos">
            <Button 
              size="lg" 
              className="px-12 py-6 text-xl font-bold rounded-2xl transform transition-all duration-300 hover:scale-110 group"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                boxShadow: '0 15px 35px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                Ver Catálogo Completo
              </span>
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
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