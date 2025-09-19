'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function CinematicHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const [isReduced, setIsReduced] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize spectacular scroll animations
  useEffect(() => {
    if (!heroRef.current || isReduced) return;

    const hero = heroRef.current;
    const video = videoRef.current;
    const logo = logoRef.current;
    const title = titleRef.current;
    const cta = ctaRef.current;
    const overlay = overlayRef.current;

    // Create the main spectacular timeline - Even shorter for impact (120%)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=120%', // Very concise for maximum impact
        scrub: 0.5, // Very responsive scrubbing
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // Removed video sync with scroll to prevent restart on scroll
        // onUpdate: (self) => {
        //   // Sync video with scroll progress for dramatic effect
        //   if (video && videoLoaded) {
        //     const progress = self.progress;
        //     const videoDuration = video.duration;
        //     video.currentTime = progress * videoDuration;
        //   }
        // }
      }
    });

    // Spectacular intro (0% → 20%) - Video dramatic entrance
    tl.fromTo(video, 
      { scale: 1.3, opacity: 0 },
      { scale: 1.0, opacity: 1, duration: 0.2, ease: 'power3.out' },
      0
    );

    tl.fromTo(overlay,
      { opacity: 1 },
      { opacity: 0.3, duration: 0.2, ease: 'power2.out' },
      0.1
    );

    // Logo spectacular entrance (20% → 50%)
    tl.fromTo(logo,
      { scale: 0.3, opacity: 0, rotationY: 90, y: -100 },
      { 
        scale: 1.2, 
        opacity: 1, 
        rotationY: 0, 
        y: 0,
        duration: 0.3,
        ease: 'back.out(2)'
      },
      0.2
    );

    // Title dramatic reveal (50% → 70%)
    tl.fromTo(title,
      { scale: 0.7, opacity: 0, y: 80, rotationX: 45 },
      { 
        scale: 1.0, 
        opacity: 1, 
        y: 0, 
        rotationX: 0,
        duration: 0.2,
        ease: 'power3.out'
      },
      0.5
    );

    // Final CTA explosion (70% → 100%)
    tl.fromTo(cta,
      { scale: 0.5, opacity: 0, y: 60 },
      { 
        scale: 1.0, 
        opacity: 1, 
        y: 0,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)'
      },
      0.7
    );

    // Video scaling for dramatic effect throughout
    tl.to(video,
      {
        scale: 1.1,
        duration: 1,
        ease: 'power1.inOut'
      },
      0.3
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isReduced, videoLoaded]);

  // Reduced motion fallback
  useEffect(() => {
    if (!isReduced) return;

    const video = videoRef.current;
    const logo = logoRef.current;
    const title = titleRef.current;
    const cta = ctaRef.current;

    // Simple elegant fade-in for reduced motion
    gsap.timeline()
      .set([video, logo, title, cta], { opacity: 0 })
      .to(video, { opacity: 1, duration: 1, ease: 'power2.out' })
      .to(logo, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.3)
      .to(title, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.5)
      .to(cta, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.7);

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

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  return (
    <>
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Spectacular Video Background - FULL PROTAGONIST */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transform-gpu"
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={handleVideoLoad}
          style={{
            filter: 'contrast(1.2) saturate(1.1) brightness(0.9)',
          }}
        >
          <source src="/images/squid-3d.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dynamic overlay for text readability */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50 z-10"
        />

        {/* Spectacular Content Container */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-6xl mx-auto">
          
          {/* Professional Logo with spectacular entrance */}
          <div 
            ref={logoRef}
            className="mb-8 transform-gpu"
          >
            <div className="relative">
              <Image
                src="/images/logo-gtg.png"
                alt="Grupo Topgel Logo"
                width={200}
                height={120}
                className="drop-shadow-2xl"
                style={{
                  width: 'auto',
                  height: 'auto',
                  filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.3))'
                }}
                priority
              />
              
              {/* Logo glow effect */}
              <div 
                className="absolute inset-0 rounded-lg opacity-50"
                style={{
                  background: 'radial-gradient(ellipse 150% 100% at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                  filter: 'blur(20px)'
                }}
              />
            </div>
          </div>

          {/* Spectacular Title */}
          <div 
            ref={titleRef}
            className="mb-12 transform-gpu"
          >
            <h1 className="text-6xl lg:text-8xl xl:text-9xl font-black leading-tight">
              <span 
                className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
                style={{
                  textShadow: '0 0 60px rgba(255,255,255,0.5)',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))'
                }}
              >
                GRUPO
              </span>
              <span 
                className="block bg-gradient-to-r from-blue-200 via-blue-400 to-cyan-300 bg-clip-text text-transparent mt-2"
                style={{
                  textShadow: '0 0 80px rgba(59, 130, 246, 0.8)',
                  filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.9))'
                }}
              >
                TOPGEL
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-white/90 font-medium mt-6 max-w-2xl mx-auto leading-relaxed">
              <span 
                className="bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent"
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                }}
              >
                Del mar a tu mesa - Productos marinos de excelencia
              </span>
            </p>
          </div>

          {/* Spectacular CTAs */}
          <div 
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-6 transform-gpu"
          >
            <Button 
              onClick={scrollToProducts}
              size="lg" 
              className="px-12 py-6 text-xl font-bold rounded-2xl transform transition-all duration-300 hover:scale-110 group"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                Explorar Productos
              </span>
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
            
            <Link href="/contacto">
              <Button 
                variant="outline" 
                size="lg"
                className="px-12 py-6 text-xl font-bold rounded-2xl transform transition-all duration-300 hover:scale-110 group"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.2)',
                }}
              >
                <span className="group-hover:scale-110 transition-transform duration-300">
                  Contactar
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Elegant scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div 
            onClick={scrollToProducts}
            className="cursor-pointer group flex flex-col items-center text-white/80 hover:text-white transition-all duration-300"
          >
            <span className="text-sm mb-3 font-semibold opacity-90 group-hover:opacity-100">
              Continúa explorando
            </span>
            <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center group-hover:border-white transition-all duration-300 group-hover:scale-110">
              <div 
                className="w-1 h-3 bg-white/70 rounded-full mt-2 group-hover:bg-white transition-all duration-300"
                style={{
                  animation: 'scroll-pulse 2s ease-in-out infinite'
                }}
              />
            </div>
            <ChevronDown className="w-5 h-5 mt-2 animate-bounce group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </section>

      {/* Professional CSS animations */}
      <style jsx>{`
        @keyframes scroll-pulse {
          0%, 100% { 
            transform: translateY(0px);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(8px);
            opacity: 1;
          }
        }

        /* Enhanced video performance */
        video {
          will-change: transform;
        }

        /* Spectacular glow effects */
        .spectacular-glow {
          animation: spectacular-glow 3s ease-in-out infinite alternate;
        }

        @keyframes spectacular-glow {
          0% { 
            filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6));
          }
          100% { 
            filter: drop-shadow(0 0 40px rgba(59, 130, 246, 0.9));
          }
        }
      `}</style>
    </>
  );
}