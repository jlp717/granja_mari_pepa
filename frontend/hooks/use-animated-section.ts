'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { useIntersectionObserver } from './use-intersection-observer'

interface UseAnimatedSectionOptions {
  threshold?: number
  rootMargin?: string
  animationDelay?: number
  stagger?: number
  freezeOnceVisible?: boolean
}

export function useAnimatedSection(options: UseAnimatedSectionOptions = {}) {
  const [isReduced, setIsReduced] = useState(false)
  const [animationsReady, setAnimationsReady] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const {
    threshold = 0.2,
    rootMargin = '50px',
    animationDelay = 100,
    stagger = 0.15,
    freezeOnceVisible = true
  } = options

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReduced(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => setIsReduced(event.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
    freezeOnceVisible
  })

  useEffect(() => {
    if (sectionRef.current && targetRef) {
      ;(targetRef as MutableRefObject<Element | null>).current = sectionRef.current
    }
  }, [targetRef])

  useEffect(() => {
    if (!sectionRef.current || !hasIntersected || animationsReady) return

    const section = sectionRef.current
    const elements = Array.from(section.querySelectorAll<HTMLElement>('[data-animate]'))
    const timers: Array<ReturnType<typeof setTimeout>> = []

    elements.forEach((element, index) => {
      if (isReduced) {
        element.style.opacity = '1'
        element.style.transform = 'none'
        return
      }

      element.style.opacity = '0'
      element.style.transform = 'translate3d(0, 3rem, 0)'
      element.style.transition = 'opacity .8s cubic-bezier(.165,.84,.44,1), transform .8s cubic-bezier(.165,.84,.44,1)'

      timers.push(setTimeout(() => {
        element.style.opacity = '1'
        element.style.transform = 'translate3d(0, 0, 0)'
      }, animationDelay + index * stagger * 1000))
    })

    timers.push(setTimeout(() => setAnimationsReady(true), animationDelay + elements.length * stagger * 1000 + 800))

    return () => timers.forEach(clearTimeout)
  }, [hasIntersected, isReduced, animationDelay, stagger, animationsReady])

  return {
    sectionRef,
    isIntersecting: hasIntersected,
    isReduced,
    animationsReady
  }
}
