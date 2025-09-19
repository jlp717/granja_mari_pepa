'use client';

import { useEffect, useState } from 'react';
import { deviceCapabilities } from '@/lib/mobile-utils';

/**
 * Hook para optimizar rendimiento en dispositivos móviles
 * Detecta capacidades del dispositivo y ajusta el comportamiento
 */
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowPower, setIsLowPower] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    
    // Detectar preferencias de movimiento
    setPrefersReducedMotion(deviceCapabilities.prefersReducedMotion());
    
    // Detectar soporte hover
    setSupportsHover(deviceCapabilities.supportsHover());
    
    // Detectar modo de bajo consumo
    deviceCapabilities.isLowPowerMode().then(setIsLowPower);

    // Listeners para cambios
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hoverQuery = window.matchMedia('(hover: hover)');

    const handleResize = () => checkMobile();
    const handleMotionChange = () => setPrefersReducedMotion(motionQuery.matches);
    const handleHoverChange = () => setSupportsHover(hoverQuery.matches);

    window.addEventListener('resize', handleResize);
    motionQuery.addEventListener('change', handleMotionChange);
    hoverQuery.addEventListener('change', handleHoverChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      motionQuery.removeEventListener('change', handleMotionChange);
      hoverQuery.removeEventListener('change', handleHoverChange);
    };
  }, []);

  // Configuración de animaciones optimizada
  const getAnimationConfig = () => ({
    shouldAnimate: !prefersReducedMotion && !isLowPower,
    reducedDuration: isLowPower || isMobile ? 0.2 : 0.3,
    disableParallax: isMobile || isLowPower,
    simplifyAnimations: isMobile || prefersReducedMotion,
    maxAnimations: isMobile ? 3 : 10, // Limitar animaciones simultáneas en móvil
  });

  // Configuración de imágenes optimizada
  const getImageConfig = () => {
    let webpSupport = false;
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      webpSupport = context !== null && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) {
      webpSupport = false;
    }

    return {
      lazyLoading: true,
      lowQuality: isLowPower,
      maxWidth: isMobile ? 800 : 1920,
      webpSupport,
    };
  };

  return {
    isMobile,
    isLowPower,
    prefersReducedMotion,
    supportsHover,
    isTouchDevice: deviceCapabilities.isTouchDevice(),
    animationConfig: getAnimationConfig(),
    imageConfig: getImageConfig(),
  };
};

/**
 * Hook para manejar scroll optimizado en móviles
 */
export const useMobileScroll = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { isMobile } = useMobileOptimization();

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setIsScrolling(true);
      setScrollPosition(window.scrollY);
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    // Throttle scroll en móviles para mejor rendimiento
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: isMobile ? 'auto' : 'smooth' // Scroll inmediato en móvil
    });
  };

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const offset = isMobile ? 80 : 100; // Offset para header
      const top = element.offsetTop - offset;
      
      window.scrollTo({
        top,
        behavior: isMobile ? 'auto' : 'smooth'
      });
    }
  };

  return {
    isScrolling,
    scrollPosition,
    scrollToTop,
    scrollToElement,
  };
};

/**
 * Hook para manejar intersection observer optimizado
 */
export const useMobileIntersection = (options?: IntersectionObserverInit) => {
  const [isVisible, setIsVisible] = useState(false);
  const { isMobile } = useMobileOptimization();

  const defaultOptions: IntersectionObserverInit = {
    threshold: isMobile ? 0.1 : 0.3, // Threshold menor en móvil
    rootMargin: isMobile ? '0px 0px -50px 0px' : '0px 0px -100px 0px',
    ...options,
  };

  const ref = (node: Element | null) => {
    if (node) {
      const observer = new IntersectionObserver(
        ([entry]) => setIsVisible(entry.isIntersecting),
        defaultOptions
      );
      observer.observe(node);
      return () => observer.disconnect();
    }
  };

  return [ref, isVisible] as const;
};

export default useMobileOptimization;