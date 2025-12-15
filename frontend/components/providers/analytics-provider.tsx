'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, trackNavigation } from '@/lib/analytics';

/**
 * Provider que inicializa el sistema de Analytics
 * y trackea automáticamente los cambios de ruta
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Inicializar analytics una vez
  useEffect(() => {
    initAnalytics();
  }, []);

  // Trackear cambios de página
  useEffect(() => {
    if (pathname) {
      trackNavigation(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}

export default AnalyticsProvider;
