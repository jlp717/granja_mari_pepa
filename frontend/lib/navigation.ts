/**
 * Navegación internacionalizada para Next.js + next-intl v4
 * 
 * Este módulo proporciona componentes y utilidades para mantener
 * el locale activo en todas las navegaciones.
 * 
 * @example
 * // En componentes cliente:
 * import { Link, useRouter, usePathname } from '@/lib/navigation';
 * 
 * // En lugar de:
 * import Link from 'next/link';
 * import { useRouter, usePathname } from 'next/navigation';
 */

import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from '@/i18n';

/**
 * Configuración de navegación localizada (next-intl v4)
 * 
 * - Link: Componente que automáticamente añade el prefijo de locale
 * - redirect: Función de redirección server-side con locale
 * - usePathname: Hook que retorna el pathname sin el prefijo de locale
 * - useRouter: Hook de router con métodos localizados (push, replace, etc.)
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

/**
 * Genera una URL localizada manualmente
 * Útil cuando necesitas construir URLs fuera de componentes React
 * 
 * @param path - Ruta sin locale (ej: '/productos')
 * @param locale - Locale deseado (ej: 'es', 'en')
 * @returns URL con locale (ej: '/es/productos')
 */
export function getLocalizedPath(path: string, locale: string): string {
  // Limpiar path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Si ya tiene un locale, reemplazarlo
  const localePattern = new RegExp(`^/(${locales.join('|')})`);
  const pathWithoutLocale = cleanPath.replace(localePattern, '');
  
  return `/${locale}${pathWithoutLocale || ''}`;
}

/**
 * Extrae el locale actual de un pathname
 * 
 * @param pathname - Pathname completo (ej: '/es/productos')
 * @returns Locale encontrado o el default
 */
export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && locales.includes(firstSegment as any)) {
    return firstSegment;
  }
  
  return defaultLocale;
}

/**
 * Obtiene el pathname sin el prefijo de locale
 * 
 * @param pathname - Pathname completo (ej: '/es/productos')
 * @returns Pathname sin locale (ej: '/productos')
 */
export function getPathnameWithoutLocale(pathname: string): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})`);
  return pathname.replace(localePattern, '') || '/';
}
