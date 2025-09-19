'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  const { threshold = 0.1, rootMargin = '50px', freezeOnceVisible = false } = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
          
          // If freezeOnceVisible is true, disconnect after first intersection
          if (freezeOnceVisible) {
            observer.unobserve(node);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, freezeOnceVisible, hasIntersected]);

  return { targetRef, isIntersecting, hasIntersected };
}