'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente de imagen responsiva optimizada
 * Genera automáticamente srcset para múltiples resoluciones
 * Optimizado para dispositivos móviles y desktop
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  objectFit = 'cover',
  sizes = '(max-width: 475px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  placeholder = 'empty',
  loading,
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Generar URLs optimizadas para Pexels
  const generateSrcSet = (baseSrc: string) => {
    // Si es una imagen de Pexels, generar múltiples resoluciones
    if (baseSrc.includes('pexels.com')) {
      const baseUrl = baseSrc.split('?')[0];
      return [
        `${baseUrl}?auto=compress&cs=tinysrgb&w=400 400w`,
        `${baseUrl}?auto=compress&cs=tinysrgb&w=600 600w`,
        `${baseUrl}?auto=compress&cs=tinysrgb&w=800 800w`,
        `${baseUrl}?auto=compress&cs=tinysrgb&w=1200 1200w`,
        `${baseUrl}?auto=compress&cs=tinysrgb&w=1600 1600w`
      ].join(', ');
    }
    
    // Para imágenes locales u otras fuentes, usar la imagen original
    return `${baseSrc} 1x`;
  };

  // Generar URL optimizada para móviles (menor resolución)
  const getMobileSrc = (baseSrc: string) => {
    if (baseSrc.includes('pexels.com')) {
      const baseUrl = baseSrc.split('?')[0];
      return `${baseUrl}?auto=compress&cs=tinysrgb&w=600`;
    }
    return baseSrc;
  };

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder mientras carga la imagen */}
      {!imageLoaded && placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}

      {/* Imagen principal */}
      <img
        src={getMobileSrc(src)}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : loading || 'lazy'}
        decoding="async"
        className={cn(
          'w-full h-full transition-opacity duration-300',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          imageError && 'opacity-50'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Imagen de error fallback */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="text-xs">Imagen no disponible</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook para optimizar imágenes según el dispositivo
 */
export const useOptimizedImage = (src: string, width?: number) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (src.includes('pexels.com')) {
    const baseUrl = src.split('?')[0];
    const optimalWidth = isMobile ? 600 : width || 800;
    return `${baseUrl}?auto=compress&cs=tinysrgb&w=${optimalWidth}`;
  }
  
  return src;
};

/**
 * Preload críticas imágenes para mejor performance
 */
export const preloadImage = (src: string, priority: 'high' | 'low' = 'low') => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', priority);
    document.head.appendChild(link);
  }
};

export default ResponsiveImage;