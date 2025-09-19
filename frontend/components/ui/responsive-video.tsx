'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveVideoProps {
  src: string | { mobile: string; desktop: string };
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

/**
 * Componente de video responsivo optimizado
 * Cambia la fuente del video según el dispositivo
 * Optimizado para móviles con menor resolución
 */
export const ResponsiveVideo: React.FC<ResponsiveVideoProps> = ({
  src,
  poster,
  className,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  playsInline = true,
  preload = 'metadata',
  onLoad,
  onError,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determinar la fuente del video según el dispositivo
  useEffect(() => {
    const updateVideoSrc = () => {
      const isMobile = window.innerWidth < 768;
      
      if (typeof src === 'string') {
        setCurrentSrc(src);
      } else {
        setCurrentSrc(isMobile ? src.mobile : src.desktop);
      }
    };

    updateVideoSrc();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', updateVideoSrc);
    return () => window.removeEventListener('resize', updateVideoSrc);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Pausar video en móviles para ahorrar batería cuando no está visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (autoPlay) video.play().catch(() => {});
          } else {
            // Solo pausar en móviles para ahorrar batería
            if (window.innerWidth < 768) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Video principal */}
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        autoPlay={autoPlay && !hasError}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline={playsInline}
        preload={preload}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoadedData={handleLoad}
        onError={handleError}
      />

      {/* Placeholder mientras carga */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" />
            </svg>
            <p className="text-sm">Cargando video...</p>
          </div>
        </div>
      )}

      {/* Error fallback con imagen de poster */}
      {hasError && (
        <div className="absolute inset-0">
          {poster ? (
            <img
              src={poster}
              alt="Video preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm">Video no disponible</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay de reproducción para móviles */}
      {window.innerWidth < 768 && !autoPlay && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          onClick={() => videoRef.current?.play()}
        >
          <svg className="w-20 h-20 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Hook para optimizar videos según el dispositivo
 */
export const useOptimizedVideo = (src: string) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    shouldAutoPlay: !isMobile || window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
    optimizedSrc: src,
    shouldMute: true,
    shouldLoop: !isMobile
  };
};

export default ResponsiveVideo;