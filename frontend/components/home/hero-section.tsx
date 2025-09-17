'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

declare global {
  interface Window {
    ScrollMagic: any;
    gsap: any;
  }
}

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const squidRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [scrollMagicReady, setScrollMagicReady] = useState(false);

  useEffect(() => {
    const checkDependencies = () => {
      if (typeof window !== 'undefined' && window.ScrollMagic && window.gsap) {
        setScrollMagicReady(true);
        initScrollMagic();
      } else {
        setTimeout(checkDependencies, 100);
      }
    };

    checkDependencies();
  }, []);

  const initScrollMagic = () => {
    if (!scrollMagicReady || !window.ScrollMagic || !window.gsap) return;

    const controller = new window.ScrollMagic.Controller();
    const { gsap } = window;

    // Efecto de tinta expandiéndose
    const inkScene = new window.ScrollMagic.Scene({
      triggerElement: heroRef.current,
      triggerHook: 0.8,
      duration: window.innerHeight * 1.5
    })
    .setTween(gsap.timeline()
      .to(inkRef.current, {
        scale: 15,
        opacity: 0.9,
        duration: 1.5,
        ease: "power2.out"
      })
      .to(squidRef.current, {
        scale: 1.2,
        rotation: 10,
        opacity: 0.3,
        duration: 1,
        ease: "power2.out"
      }, 0)
    )
    .addTo(controller);

    // Efecto parallax del título
    const titleScene = new window.ScrollMagic.Scene({
      triggerElement: heroRef.current,
      triggerHook: 1,
      duration: window.innerHeight
    })
    .setTween(gsap.to(titleRef.current, {
      y: -100,
      opacity: 0.5,
      duration: 1,
      ease: "power1.out"
    }))
    .addTo(controller);

    // Rotación continua del calamar
    gsap.to(squidRef.current, {
      rotation: 360,
      duration: 20,
      ease: "none",
      repeat: -1
    });

    // Animación de partículas flotantes
    const createFloatingParticles = () => {
      for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
          position: absolute;
          width: ${Math.random() * 6 + 2}px;
          height: ${Math.random() * 6 + 2}px;
          background: rgba(59, 130, 246, ${Math.random() * 0.5 + 0.2});
          border-radius: 50%;
          pointer-events: none;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
        `;
        heroRef.current?.appendChild(particle);

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          duration: Math.random() * 10 + 10,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        });
      }
    };

    createFloatingParticles();
  };

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
          background: 'radial-gradient(ellipse at center, #1e3a8a 0%, #0f172a 70%)'
        }}
      >
        {/* Overlay con textura */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        
        {/* Efecto de ondas de agua */}
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

        {/* Calamar principal */}
        <div 
          ref={squidRef}
          className="absolute inset-0 flex items-center justify-center z-5 opacity-80"
        >
          <div 
            className="w-96 h-96 relative transform transition-all duration-1000"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 50% 40%, rgba(31, 41, 55, 0.9) 0%, rgba(31, 41, 55, 0.7) 40%, transparent 70%),
                radial-gradient(ellipse 40% 60% at 50% 70%, rgba(55, 65, 81, 0.8) 0%, rgba(55, 65, 81, 0.4) 50%, transparent 70%)
              `,
              clipPath: 'ellipse(45% 60% at 50% 45%)'
            }}
          >
            {/* Tentáculos del calamar */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 left-1/2 origin-top transform -translate-x-1/2"
                style={{
                  width: '3px',
                  height: `${Math.random() * 80 + 60}px`,
                  background: 'linear-gradient(to bottom, rgba(75, 85, 99, 0.9), rgba(55, 65, 81, 0.6))',
                  borderRadius: '2px',
                  transform: `translateX(-50%) rotate(${(i * 45) - 157.5}deg) translateY(20px)`,
                  animation: `tentacle-wave-${i} ${3 + Math.random() * 2}s ease-in-out infinite`
                }}
              />
            ))}
            
            {/* Ojos del calamar */}
            <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-red-400 rounded-full opacity-70 animate-pulse"></div>
          </div>
        </div>

        {/* Efecto de tinta que se expande */}
        <div 
          ref={inkRef}
          className="absolute inset-0 z-0 flex items-center justify-center"
        >
          <div 
            className="w-32 h-32 rounded-full opacity-0 transform scale-0"
            style={{
              background: 'radial-gradient(circle, rgba(0, 0, 0, 0.9) 0%, rgba(30, 58, 138, 0.8) 30%, rgba(59, 130, 246, 0.6) 60%, transparent 100%)'
            }}
          ></div>
        </div>

        {/* Contenido principal */}
        <div 
          ref={titleRef}
          className="relative z-20 text-center max-w-4xl mx-auto px-4"
        >
          {/* Título principal con efectos */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
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
              className="text-2xl md:text-4xl font-light mb-2"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Grupo Topgel
            </div>
            <div className="text-lg text-blue-300 opacity-90">
              Del mar a tu mesa
            </div>
          </div>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed opacity-90">
            Productos del mar de la más alta calidad.
            <span className="block mt-3 text-lg text-blue-200">
              Más de 35 años llevando la excelencia marina a tu negocio.
            </span>
          </p>

          {/* Botones CTA */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              onClick={scrollToProducts}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30 border border-blue-400/30"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              Descubre nuestros productos
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            
            <Link href="/contacto">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/70 text-white hover:bg-white hover:text-slate-900 px-12 py-6 text-xl font-bold rounded-2xl backdrop-blur-md bg-white/10 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                Contacto
              </Button>
            </Link>
          </div>

          {/* Indicador de scroll animado */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div 
              onClick={scrollToProducts}
              className="cursor-pointer group"
            >
              <div className="flex flex-col items-center text-white/70 group-hover:text-white transition-colors">
                <span className="text-sm mb-2 font-medium">Explora hacia abajo</span>
                <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center group-hover:border-white transition-colors">
                  <div 
                    className="w-1.5 h-6 bg-white/70 rounded-full mt-2 group-hover:bg-white transition-colors"
                    style={{
                      animation: 'scroll-indicator 2s ease-in-out infinite'
                    }}
                  ></div>
                </div>
                <ChevronDown className="w-6 h-6 mt-2 animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        {/* Burbujas flotantes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 backdrop-blur-sm"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
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