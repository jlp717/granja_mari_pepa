'use client'

import { ReactNode, useEffect } from 'react'

interface PerformanceProviderProps {
  children: ReactNode
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement

              if (element.dataset.src) {
                const img = element as HTMLImageElement
                img.src = img.dataset.src
                img.onload = () => {
                  img.classList.add('loaded')
                  observer.unobserve(img)
                }
              }

              if (element.dataset.background) {
                element.style.backgroundImage = `url(${element.dataset.background})`
                element.classList.add('loaded')
                observer.unobserve(element)
              }
            }
          })
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      )

      const lazyElements = document.querySelectorAll('[data-src], [data-background]')
      lazyElements.forEach((el) => observer.observe(el))

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          const fonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
          ]

          fonts.forEach((font) => {
            const link = document.createElement('link')
            link.rel = 'preload'
            link.as = 'style'
            link.href = font
            document.head.appendChild(link)

            link.onload = () => {
              link.rel = 'stylesheet'
            }
          })
        })
      }

      const connection = (navigator as any).connection
      if (connection) {
        if (connection.effectiveType === '4g' || connection.downlink > 2) {
          document.documentElement.classList.add('fast-connection')
        } else {
          document.documentElement.classList.add('slow-connection')
        }
      }

      return () => {
        observer.disconnect()
      }
    }
  }, [])

  return <>{children}</>
}