'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { useIntersectionObserver } from './use-intersection-observer';

interface UseReAnimatedSectionOptions {
  threshold?: number;
  rootMargin?: string;
  animationDelay?: number;
  stagger?: number;
  retriggerOnNavigation?: boolean;
}

export function useReAnimatedSection(options: UseReAnimatedSectionOptions = {}) {
  const [isReduced, setIsReduced] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pathname = usePathname();
  
  const {
    threshold = 0.2,
    rootMargin = '50px',
    animationDelay = 100,
    stagger = 0.15,
    retriggerOnNavigation = true
  } = options;

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Use intersection observer WITHOUT freeze
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible: false // Allow re-triggering
  });

  // Set the same ref for both section and intersection observer
  useEffect(() => {
    if (sectionRef.current && targetRef) {
      // @ts-ignore
      targetRef.current = sectionRef.current;
    }
  }, [targetRef]);

  // Reset animations when navigating to/from page
  useEffect(() => {
    if (retriggerOnNavigation) {
      const timer = setTimeout(() => {
        setAnimationKey(prev => prev + 1);
      }, 100); // Small delay to ensure page transition is complete
      
      return () => clearTimeout(timer);
    }
  }, [pathname, retriggerOnNavigation]);

  // Trigger animations when element becomes visible
  useEffect(() => {
    if (!sectionRef.current || !hasIntersected || isReduced) return;

    const section = sectionRef.current;
    
    // Small delay to ensure DOM is stable
    const timer = setTimeout(() => {
      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Reset elements to initial state
      const allElements = section.querySelectorAll('[data-animate]');
      gsap.set(allElements, {
        opacity: 0,
        y: 60,
        scale: 0.9,
        rotationX: 0,
        rotationY: 0
      });

      // Create new timeline
      timelineRef.current = gsap.timeline();

      // Find animated elements
      const titles = section.querySelectorAll('[data-animate="title"]');
      const cards = section.querySelectorAll('[data-animate="card"]');
      const content = section.querySelectorAll('[data-animate="content"]');

      // Animate titles with enhanced effects
      if (titles.length > 0) {
        timelineRef.current.fromTo(titles, {
          opacity: 0,
          y: 80,
          scale: 0.8,
          rotationX: 30
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 1.2,
          ease: 'power3.out',
          stagger: stagger * 0.5
        });
      }

      // Animate content
      if (content.length > 0) {
        timelineRef.current.fromTo(content, {
          opacity: 0,
          y: 60,
          scale: 0.9
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          stagger: stagger * 0.3
        }, "-=0.6");
      }

      // Animate cards with 3D effects
      if (cards.length > 0) {
        timelineRef.current.fromTo(cards, {
          opacity: 0,
          y: 120,
          scale: 0.7,
          rotationY: 45,
          rotationX: 20
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationY: 0,
          rotationX: 0,
          duration: 1,
          ease: 'power2.out',
          stagger: stagger
        }, "-=0.4");
      }
    }, animationDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [hasIntersected, isReduced, animationDelay, stagger, animationKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return {
    sectionRef,
    isIntersecting: hasIntersected,
    isReduced,
    animationKey
  };
}