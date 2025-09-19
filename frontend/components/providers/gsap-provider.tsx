'use client';

import { useEffect } from 'react';
import { initializeGSAP, cleanupGSAP } from '@/lib/gsap-config';
import { usePathname } from 'next/navigation';

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize GSAP globally
  useEffect(() => {
    const initialized = initializeGSAP();
    
    if (initialized) {
      console.log('✅ GSAP initialized with optimized scroll configuration');
    }

    // Cleanup on unmount (app-level cleanup)
    return () => {
      cleanupGSAP();
    };
  }, []);

  // Refresh ScrollTrigger on route changes
  useEffect(() => {
    // Small delay to ensure new page content is rendered
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const { ScrollTrigger } = require('gsap/ScrollTrigger');
        if (ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}