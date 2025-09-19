/**
 * Utilidades para mejorar la experiencia táctil en dispositivos móviles
 * Incluye feedback háptico, gestos y animaciones optimizadas
 */

// Hook para feedback háptico
export const useHapticFeedback = () => {
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Vibration API para Android
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50],
          selection: [5, 5, 5]
        };
        navigator.vibrate(patterns[type]);
      }
      
      // iOS Haptic Feedback (si está disponible)
      if ('hapticFeedback' in navigator) {
        (navigator as any).hapticFeedback?.[type]?.();
      }
    }
  };

  return { triggerHaptic };
};

// Hook para detectar gestos táctiles
export const useTouchGestures = () => {
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  
  const createTouchHandler = (onTap: () => void, onLongPress?: () => void) => {
    let touchStartTime = 0;
    let touchTimeout: NodeJS.Timeout;

    return {
      onTouchStart: (e: React.TouchEvent) => {
        touchStartTime = Date.now();
        if (onLongPress) {
          touchTimeout = setTimeout(() => {
            onLongPress();
          }, 500); // Long press after 500ms
        }
      },
      onTouchEnd: (e: React.TouchEvent) => {
        const touchDuration = Date.now() - touchStartTime;
        clearTimeout(touchTimeout);
        
        if (touchDuration < 500) {
          onTap();
        }
      },
      onTouchCancel: () => {
        clearTimeout(touchTimeout);
      }
    };
  };

  return { isTouchDevice, createTouchHandler };
};

// Configuración de animaciones optimizada para móviles
export const mobileAnimationConfig = {
  // Reduce motion si el usuario lo prefiere
  respectsReducedMotion: true,
  
  // Animaciones más suaves para móviles
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1
  },
  
  // Transiciones rápidas
  fast: {
    duration: 0.2,
    ease: "easeOut"
  },
  
  // Transiciones normales
  normal: {
    duration: 0.3,
    ease: "easeInOut"
  },
  
  // Animaciones de entrada
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  },
  
  // Animaciones de escala para botones
  scaleOnTap: {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  }
};

// Tamaños de botones optimizados para móvil (mínimo 44px según Apple HIG)
export const touchTargetSizes = {
  small: {
    mobile: 'min-h-[44px] min-w-[44px] px-4 py-2',
    desktop: 'px-3 py-1.5'
  },
  medium: {
    mobile: 'min-h-[48px] min-w-[48px] px-6 py-3',
    desktop: 'px-4 py-2'
  },
  large: {
    mobile: 'min-h-[52px] min-w-[52px] px-8 py-4',
    desktop: 'px-6 py-3'
  }
};

// Espaciado optimizado para touch
export const touchSpacing = {
  // Espaciado entre elementos táctiles (mínimo 8px)
  between: 'gap-2 sm:gap-3',
  betweenButtons: 'space-x-3 sm:space-x-4',
  
  // Padding interno de contenedores
  container: 'p-4 sm:p-6',
  card: 'p-3 sm:p-4',
  
  // Márgenes para elementos táctiles
  touchMargin: 'm-1 sm:m-2'
};

// Utilidad para agregar clases táctiles
export const getTouchClasses = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobile ? touchTargetSizes[size].mobile : touchTargetSizes[size].desktop;
};

// Configuración de scroll optimizada para móviles
export const mobileScrollConfig = {
  // Smooth scroll nativo
  scrollBehavior: 'smooth' as const,
  
  // Configuración para bibliotecas de scroll
  scrollSettings: {
    duration: 800,
    smooth: true,
    offset: -80, // Para header fijo
  },
  
  // Configuración de IntersectionObserver optimizada
  intersectionConfig: {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '0px 0px -100px 0px'
  }
};

// Detectar capacidades del dispositivo
export const deviceCapabilities = {
  isTouchDevice: () => typeof window !== 'undefined' && 'ontouchstart' in window,
  supportsHover: () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
  prefersReducedMotion: () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isLowPowerMode: () => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      return (navigator as any).getBattery().then((battery: any) => battery.level < 0.2);
    }
    return Promise.resolve(false);
  }
};

// CSS personalizado para mejorar touch
export const touchStyles = `
  /* Eliminar highlight en iOS */
  .touch-optimized {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  /* Mejorar scroll en móviles */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Mejorar rendering en móviles */
  .mobile-optimized {
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform;
  }
  
  /* Touch feedback */
  .touch-feedback:active {
    transform: scale(0.98);
    transition: transform 0.1s ease-out;
  }
`;

// Polyfill para requestIdleCallback en dispositivos que no lo soportan
export const scheduleWork = (callback: () => void, priority: 'high' | 'low' = 'low') => {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window && priority === 'low') {
      (window as any).requestIdleCallback(callback);
    } else {
      requestAnimationFrame(callback);
    }
  }
};