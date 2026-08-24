'use client';

type ScrollTriggerLike = {
  refresh?: () => void;
  killAll?: () => void;
};

let initialized = false;

export function initializeGSAP(): boolean {
  if (typeof window === 'undefined' || initialized) {
    return initialized;
  }

  try {
    const gsap = require('gsap');
    const scrollTriggerModule = require('gsap/ScrollTrigger');
    const ScrollTrigger: ScrollTriggerLike =
      scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;

    if (gsap?.gsap && ScrollTrigger) {
      gsap.gsap.registerPlugin(ScrollTrigger);
      initialized = true;
    }
  } catch (error) {
    console.warn('[gsap-config] GSAP not available:', error);
  }

  return initialized;
}

export function cleanupGSAP(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const scrollTriggerModule = require('gsap/ScrollTrigger');
    const ScrollTrigger: ScrollTriggerLike =
      scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
    ScrollTrigger?.killAll?.();
  } catch {
    // No-op when GSAP is unavailable.
  }

  initialized = false;
}
