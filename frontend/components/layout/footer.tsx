'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowRight, Star, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const [isReduced, setIsReduced] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Professional footer animations
  useEffect(() => {
    if (!footerRef.current || isReduced) return;

    const footer = footerRef.current;

    gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: 'top 90%',
        end: 'top 60%',
        toggleActions: 'play none none reverse'
      }
    })
    .fromTo(footer.children, {
      opacity: 0,
      y: 40,
      scale: 0.95
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isReduced]);

  return (
    <footer 
      ref={footerRef}
      className="relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            #0a0a0a 0%, 
            #1a0a2e 25%, 
            #2a1810 50%, 
            #1a0a2e 75%, 
            #0a0a0a 100%
          )
        `
      }}
    >
      {/* Elegant wave divider */}
      <div className="absolute -top-1 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-20"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 193, 7, 0.8)" />
              <stop offset="30%" stopColor="rgba(255, 152, 0, 0.9)" />
              <stop offset="70%" stopColor="rgba(255, 87, 34, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 193, 7, 0.8)" />
            </linearGradient>
          </defs>
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="url(#waveGradient)"
            style={{
              filter: 'drop-shadow(0 -4px 8px rgba(255, 193, 7, 0.3))'
            }}
          />
        </svg>
      </div>

      {/* Animated secondary wave */}
      <div className="absolute -top-1 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-16 opacity-60"
          data-name="Layer 2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{
            animation: 'wave-flow 8s ease-in-out infinite'
          }}
        >
          <path
            d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z"
            fill="rgba(255, 152, 0, 0.4)"
          />
        </svg>
      </div>

      {/* Professional background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: `rgba(${i % 3 === 0 ? '255, 193, 7' : i % 3 === 1 ? '255, 152, 0' : '255, 87, 34'}, 0.7)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 15px rgba(255, 193, 7, 0.6)',
              animation: `float-footer-${i % 4} ${5 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}

        {/* Glowing orbs */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${40 + Math.random() * 80}px`,
              height: `${40 + Math.random() * 80}px`,
              background: `radial-gradient(circle, rgba(255, 193, 7, 0.6) 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${20 + Math.random() * 60}%`,
              animation: `pulse-glow ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          
          {/* Brand section */}
          <motion.div 
            className="lg:col-span-1 text-center lg:text-left"
            whileHover={{ scale: 1.02 }}
          >
            <div className="mb-6">
              <h3 className="text-3xl md:text-4xl font-black mb-2">
                <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                  GRANJA MARI PEPA
                </span>
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
                <p className="text-amber-300/80 font-medium text-base">
                  Grupo Topgel Company
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400 text-sm">🏭</span>
                <p className="text-orange-300/70 text-sm font-light">
                  Distribución Premium desde 1985
                </p>
              </div>
            </div>

            <p className="text-blue-200/80 text-lg mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              Distribuidores de productos alimentarios premium con 
              <span className="text-cyan-300 font-semibold"> más de 35 años</span> de excelencia.
            </p>

            {/* Professional badges */}
            <div className="flex justify-center lg:justify-start gap-4">
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
              >
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-semibold">ISO 9001</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
              >
                <Star className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-semibold">Eco</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div 
            className="lg:col-span-1 text-center"
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="text-2xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Acceso Rápido
              </span>
            </h4>
            
            <div className="space-y-4">
              {[
                { href: '/productos', label: 'Catálogo', icon: '📦' },
                { href: '/area-clientes', label: 'Portal Cliente', icon: '👤' },
                { href: '/contacto', label: 'Contacto', icon: '📞' }
              ].map((link, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={link.href}
                    className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 group"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="text-white font-medium">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact info */}
          <motion.div 
            className="lg:col-span-1 text-center lg:text-left"
            whileHover={{ scale: 1.02 }}
          >
            <h4 className="text-2xl font-bold text-white mb-8">
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Contacto
              </span>
            </h4>
            
            <div className="space-y-6">
              {/* Main contact */}
              <motion.div 
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Central</span>
                </div>
                <p className="text-cyan-200">+34 968 123 456</p>
              </motion.div>

              <motion.div 
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Email</span>
                </div>
                <p className="text-purple-200">info@grupotopgel.com</p>
              </motion.div>

              <motion.div 
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Horario</span>
                </div>
                <p className="text-blue-200 text-sm">L-V: 8:00-18:00 • S: 9:00-14:00</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div 
          className="border-t border-white/10 pt-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-blue-200/70">
              &copy; 2025 Grupo Topgel. Todos los derechos reservados.
            </p>
            
            <div className="flex items-center gap-6 text-sm">
              <Link href="/politica-privacidad" className="text-purple-300 hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link href="/terminos" className="text-purple-300 hover:text-white transition-colors">
                Términos
              </Link>
              <span className="text-blue-300 font-medium">
                🇪🇸 España
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
        @keyframes wave-flow {
          0%, 100% { 
            transform: translateX(-25px) scaleX(1);
            opacity: 0.6;
          }
          50% { 
            transform: translateX(25px) scaleX(1.05);
            opacity: 0.8;
          }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.3;
          }
        }

        @keyframes float-footer-0 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-15px) translateX(8px);
            opacity: 0.6;
          }
        }

        @keyframes float-footer-1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          30%, 70% { 
            transform: translateY(-8px) translateX(-5px);
            opacity: 0.5;
          }
        }

        @keyframes float-footer-2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          40% { 
            transform: translateY(-12px) translateX(6px);
            opacity: 0.7;
          }
        }

        @keyframes float-footer-3 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          60% { 
            transform: translateY(-10px) translateX(-8px);
            opacity: 0.6;
          }
        }
      `}</style>
    </footer>
  );
}