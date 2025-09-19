'use client';

import { useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useScrollTrigger() {
  // Force ScrollTrigger refresh after navigation
  const refreshScrollTrigger = useCallback(() => {
    if (typeof window !== 'undefined' && ScrollTrigger) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    }
  }, []);

  // Cleanup function
  const cleanupScrollTrigger = useCallback(() => {
    if (typeof window !== 'undefined' && ScrollTrigger) {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
  }, []);

  // Auto-refresh on route changes and window resize
  useEffect(() => {
    const handleRouteChange = () => {
      refreshScrollTrigger();
    };

    const handleResize = () => {
      refreshScrollTrigger();
    };

    // Listen for Next.js route changes
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('resize', handleResize);

    // Initial refresh
    refreshScrollTrigger();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [refreshScrollTrigger]);

  return {
    refreshScrollTrigger,
    cleanupScrollTrigger
  };
}