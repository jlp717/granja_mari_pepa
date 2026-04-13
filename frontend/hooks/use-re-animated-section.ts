'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { usePathname } from 'next/navigation'
import { useIntersectionObserver } from './use-intersection-observer'

interface UseReAnimatedSectionOptions {
  threshold?: number
  rootMargin?: string
  animationDelay?: number
  stagger?: number
  retriggerOnNavigation?: boolean
}

export function useReAnimatedSection(options: UseReAnimatedSectionOptions = {}) {
  const [isReduced, setIsReduced] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const {
    threshold = 0.2,
    rootMargin = '50px',
    animationDelay = 100,
    stagger = 0.15,
    retriggerOnNavigation = true
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
    freezeOnceVisible: false
  })

  useEffect(() => {
    if (sectionRef.current && targetRef) {
      ;(targetRef as MutableRefObject<Element | null>).current = sectionRef.current
    }
  }, [targetRef])

  useEffect(() => {
    if (!retriggerOnNavigation) return

    const timer = setTimeout(() => setAnimationKey((current) => current + 1), 100)
    return () => clearTimeout(timer)
  }, [pathname, retriggerOnNavigation])

  useEffect(() => {
    if (!sectionRef.current || !hasIntersected) return

    const elements = Array.from(sectionRef.current.querySelectorAll<HTMLElement>('[data-animate]'))
    const timers: Array<ReturnType<typeof setTimeout>> = []

    elements.forEach((element, index) => {
      if (isReduced) {
        element.style.opacity = '1'
        element.style.transform = 'none'
        return
      }

      element.style.opacity = '0'
      element.style.transform = 'translate3d(0, 3.5rem, 0) scale(.96)'
      element.style.transition = 'opacity .9s cubic-bezier(.165,.84,.44,1), transform .9s cubic-bezier(.165,.84,.44,1)'

      timers.push(setTimeout(() => {
        element.style.opacity = '1'
        element.style.transform = 'translate3d(0, 0, 0) scale(1)'
      }, animationDelay + index * stagger * 1000))
    })

    return () => timers.forEach(clearTimeout)
  }, [hasIntersected, isReduced, animationDelay, stagger, animationKey])

  return {
    sectionRef,
    isIntersecting: hasIntersected,
    isReduced,
    animationKey
  }
}
