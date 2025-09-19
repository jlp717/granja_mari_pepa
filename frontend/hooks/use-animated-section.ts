'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useIntersectionObserver } from './use-intersection-observer';

interface UseAnimatedSectionOptions {
  threshold?: number;
  rootMargin?: string;
  animationDelay?: number;
  stagger?: number;
  freezeOnceVisible?: boolean;
}

export function useAnimatedSection(options: UseAnimatedSectionOptions = {}) {
  const [isReduced, setIsReduced] = useState(false);
  const [animationsReady, setAnimationsReady] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const {
    threshold = 0.2,
    rootMargin = '50px',
    animationDelay = 100,
    stagger = 0.15,
    freezeOnceVisible = true
  } = options;

  // Check for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Use intersection observer
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible
  });

  // Set the same ref for both section and intersection observer
  useEffect(() => {
    if (sectionRef.current && targetRef) {
      // @ts-ignore
      targetRef.current = sectionRef.current;
    }
  }, [targetRef]);

  // Trigger animations when element becomes visible
  useEffect(() => {
    if (!sectionRef.current || !hasIntersected || isReduced || animationsReady) return;

    const section = sectionRef.current;
    
    // Small delay to ensure DOM is stable
    const timer = setTimeout(() => {
      // Kill any existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill();
      }

      // Create new timeline
      timelineRef.current = gsap.timeline({
        onComplete: () => setAnimationsReady(true)
      });

      // Find animated elements
      const titles = section.querySelectorAll('[data-animate="title"]');
      const cards = section.querySelectorAll('[data-animate="card"]');
      const content = section.querySelectorAll('[data-animate="content"]');

      // Animate titles
      if (titles.length > 0) {
        timelineRef.current.fromTo(titles, {
          opacity: 0,
          y: 60,
          scale: 0.9,
          rotationX: 45
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: stagger * 0.5
        });
      }

      // Animate content
      if (content.length > 0) {
        timelineRef.current.fromTo(content, {
          opacity: 0,
          y: 40,
          scale: 0.95
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          stagger: stagger * 0.3
        }, "-=0.5");
      }

      // Animate cards
      if (cards.length > 0) {
        timelineRef.current.fromTo(cards, {
          opacity: 0,
          y: 100,
          scale: 0.8,
          rotationY: 45
        }, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: stagger
        }, "-=0.3");
      }
    }, animationDelay);

    return () => {
      clearTimeout(timer);
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [hasIntersected, isReduced, animationDelay, stagger, animationsReady]);

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
    animationsReady
  };
}