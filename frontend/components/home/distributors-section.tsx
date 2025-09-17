'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, ShieldCheck, Sparkles } from 'lucide-react';
import { LayoutGrid, GridItem } from '@/components/ui/layout-grid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const distributors = [
  {
    id: 'nestle',
    name: 'Nestlé',
    description: 'Líder mundial en nutrición, salud y bienestar',
    detailedDescription: 'Nestlé es la empresa de alimentos y bebidas más grande del mundo, comprometida con mejorar la calidad de vida y contribuir a un futuro más saludable.',
    image: 'https://images.pexels.com/photos/4109942/pexels-photo-4109942.jpeg?auto=compress&cs=tinysrgb&w=800',
    size: 'large' as const,
    category: 'Premium Partner',
    achievements: ['150+ años de experiencia', 'Presente en 180+ países', 'Líder en innovación alimentaria'],
    specialties: ['Nutrición infantil', 'Café premium', 'Productos lácteos', 'Aguas embotelladas']
  },
  {
    id: 'panamar',
    name: 'Panamar',
    description: 'Especialistas en productos del mar de primera calidad',
    detailedDescription: 'Panamar se dedica a la pesca, transformación y comercialización de productos del mar, garantizando frescura y calidad excepcional en cada producto.',
    image: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=800',
    size: 'large' as const,
    category: 'Seafood Excellence',
    achievements: ['40+ años en el sector', 'Flota propia de embarcaciones', 'Certificación sostenible'],
    specialties: ['Pescado fresco', 'Marisco premium', 'Productos congelados', 'Conservas gourmet']
  },
  {
    id: 'okin',
    name: 'Okin',
    description: 'Productos cárnicos de primera calidad',
    detailedDescription: 'Okin es reconocida por su excelencia en productos cárnicos, manteniendo los más altos estándares de calidad y seguridad alimentaria.',
    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=600',
    size: 'normal' as const,
    category: 'Premium Meat',
    achievements: ['Certificación IFS', 'Trazabilidad 100%', 'Sostenibilidad verificada'],
    specialties: ['Carnes frescas', 'Embutidos artesanales', 'Productos curados', 'Especialidades ibéricas']
  },
  {
    id: 'amparin',
    name: 'Pastelería Amparín',
    description: 'Repostería tradicional y moderna',
    detailedDescription: 'Amparín combina la tradición repostera con técnicas modernas, creando dulces únicos que deleitan paladares exigentes.',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
    size: 'normal' as const,
    category: 'Artisan Pastry',
    achievements: ['Recetas centenarias', 'Ingredientes naturales', 'Elaboración artesanal'],
    specialties: ['Tartas personalizadas', 'Bollería tradicional', 'Dulces navideños', 'Repostería sin gluten']
  }
];

export function DistributorsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isReduced, setIsReduced] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Professional GSAP animations
  useEffect(() => {
    if (!sectionRef.current || isReduced) return;

    const section = sectionRef.current;
    const title = titleRef.current;
    const grid = gridRef.current;

    // Professional title entrance
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'top 50%',
        toggleActions: 'play none none reverse'
      }
    })
    .fromTo(title, {
      opacity: 0,
      y: 80,
      scale: 0.8
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out'
    });

    // Grid animation
    if (grid) {
      gsap.timeline({
        scrollTrigger: {
          trigger: grid,
          start: 'top 90%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      })
      .fromTo(grid.children, {
        opacity: 0,
        y: 60,
        scale: 0.9
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)'
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isReduced]);

  const gridItems = distributors.map((distributor, index) => {
    const isLarge = distributor.size === 'large';
    
    return {
      id: distributor.id,
      title: distributor.name,
      description: distributor.description,
      image: distributor.image,
      featured: isLarge,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 197, 253, 0.9))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
            >
              {distributor.category}
            </div>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          
          <p className="text-blue-200/80 leading-relaxed text-lg">
            {distributor.detailedDescription}
          </p>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Logros Destacados
              </h4>
              <ul className="space-y-2">
                {distributor.achievements.map((achievement, idx) => (
                  <li key={idx} className="text-blue-200/70 flex items-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Especialidades
              </h4>
              <div className="flex flex-wrap gap-2">
                {distributor.specialties.map((specialty, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    } as GridItem;
  });

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
      {/* Professional background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Professional twinkling stars - FIXED VALUES */}
        <div className="absolute inset-0">
          {[
            { left: 15, top: 25, animation: 'twinkle-0', duration: 4.2, delay: 1.5 },
            { left: 85, top: 60, animation: 'twinkle-1', duration: 3.8, delay: 2.1 },
            { left: 45, top: 80, animation: 'twinkle-2', duration: 4.5, delay: 0.8 },
            { left: 75, top: 15, animation: 'twinkle-3', duration: 3.5, delay: 2.8 },
            { left: 25, top: 45, animation: 'twinkle-0', duration: 4.1, delay: 1.2 },
            { left: 65, top: 35, animation: 'twinkle-1', duration: 3.9, delay: 2.5 },
            { left: 35, top: 70, animation: 'twinkle-2', duration: 4.3, delay: 0.5 },
            { left: 90, top: 40, animation: 'twinkle-3', duration: 3.7, delay: 1.8 },
            { left: 10, top: 55, animation: 'twinkle-0', duration: 4.4, delay: 2.3 },
            { left: 55, top: 20, animation: 'twinkle-1', duration: 3.6, delay: 1.1 }
          ].map((star, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: '2px',
                height: '2px',
                background: 'rgba(59, 130, 246, 0.6)',
                borderRadius: '50%',
                left: `${star.left}%`,
                top: `${star.top}%`,
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
                animation: `${star.animation} ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`
              }}
            />
          ))}
        </div>

        {/* Professional gradient orbs - FIXED VALUES */}
        {[
          { width: 120, height: 140, left: 10, top: 20, animation: 'float-professional-0', duration: 12, delay: 2, color: '59, 130, 246' },
          { width: 110, height: 130, left: 80, top: 70, animation: 'float-professional-1', duration: 14, delay: 4, color: '147, 51, 234' },
          { width: 130, height: 120, left: 60, top: 30, animation: 'float-professional-2', duration: 11, delay: 1, color: '59, 130, 246' },
          { width: 115, height: 135, left: 30, top: 60, animation: 'float-professional-0', duration: 13, delay: 3, color: '147, 51, 234' }
        ].map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${orb.width}px`,
              height: `${orb.height}px`,
              background: `radial-gradient(circle, rgba(${orb.color}, 0.3) 0%, transparent 70%)`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              filter: 'blur(3px)',
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
            className="inline-flex items-center mb-6 px-6 py-3 rounded-full border border-purple-400/30 bg-purple-500/10 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
            <span className="text-purple-300 font-semibold text-sm">PARTNERS PREMIUM</span>
            <Award className="w-5 h-5 text-purple-400 ml-2" />
          </motion.div>

          <h2 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span 
              className="block bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent"
              style={{
                textShadow: '0 0 80px rgba(147, 51, 234, 0.6)',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
              }}
            >
              NUESTROS
            </span>
            <span 
              className="block bg-gradient-to-r from-purple-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent mt-2"
              style={{
                textShadow: '0 0 100px rgba(147, 51, 234, 0.8)',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.9))'
              }}
            >
              DISTRIBUIDORES
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-purple-200/90 font-medium max-w-4xl mx-auto leading-relaxed">
            <span 
              className="bg-gradient-to-r from-purple-200 to-cyan-300 bg-clip-text text-transparent"
              style={{
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'
              }}
            >
              Colaboramos con los líderes del sector alimentario para ofrecerte 
              productos de la máxima calidad y prestigio internacional
            </span>
          </p>
        </div>

        {/* Professional distributors grid */}
        <div ref={gridRef}>
          <LayoutGrid cards={gridItems} className="mx-auto" />
        </div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
        @keyframes twinkle-0 {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes twinkle-1 {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          25% { 
            opacity: 0.8;
            transform: scale(1.2) rotate(90deg);
          }
          75% { 
            opacity: 0.6;
            transform: scale(1.3) rotate(180deg);
          }
        }

        @keyframes twinkle-2 {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          33% { 
            opacity: 0.9;
            transform: scale(1.4);
          }
          66% { 
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        @keyframes twinkle-3 {
          0%, 100% { 
            opacity: 0.4;
            transform: scale(1) rotate(0deg);
          }
          40% { 
            opacity: 1;
            transform: scale(1.6) rotate(120deg);
          }
          80% { 
            opacity: 0.7;
            transform: scale(1.2) rotate(240deg);
          }
        }

        @keyframes float-professional-0 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-30px) translateX(15px) scale(1.1);
            opacity: 0.4;
          }
        }

        @keyframes float-professional-1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.2;
          }
          33% { 
            transform: translateY(-20px) translateX(-10px) scale(1.05);
            opacity: 0.3;
          }
          66% { 
            transform: translateY(20px) translateX(18px) scale(1.15);
            opacity: 0.5;
          }
        }

        @keyframes float-professional-2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(25px) translateX(-15px) scale(1.08);
            opacity: 0.35;
          }
        }
      `}</style>
    </section>
  );
}