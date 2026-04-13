'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'

type ScrollTitleHeroProps = {
  title: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}

export function ScrollTitleHero({ title, eyebrow, description, actions, height, tabletHeight, mobileHeight }: ScrollTitleHeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const charsRef = useRef<HTMLSpanElement[]>([])
  const chars = useMemo(() => Array.from(title), [title])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let frame = 0
    const clamp = (value: number) => Math.max(0, Math.min(1, value))

    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollable)
      section.style.setProperty('--pds-title-progress', progress.toFixed(4))

      const total = Math.max(1, charsRef.current.length - 1)
      charsRef.current.forEach((char, index) => {
        if (!char) return
        const local = clamp((progress * 1.35 - index / total) * 3.2)
        char.style.opacity = String(0.18 + local * 0.82)
        char.style.transform = `translateY(${(1 - local) * 0.55}em)`
      })
    }

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="pds-scroll-title"
      style={{
        '--pds-title-progress': 0,
        '--pds-scroll-title-height': height ? `${height}px` : undefined,
        '--pds-scroll-title-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-scroll-title-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as CSSProperties}
    >
      <div className="pds-scroll-title__sticky">
        <div className="pds-scroll-title__content">
          {eyebrow ? <p className="pds-eyebrow pds-scroll-title__eyebrow">{eyebrow}</p> : null}
          <h1 className="pds-scroll-title__heading" aria-label={title}>
            {chars.map((char, index) => (
              <span
                key={`${char}-${index}`}
                ref={(node) => {
                  if (node) charsRef.current[index] = node
                }}
                className={char === ' ' ? 'pds-scroll-title__space' : 'pds-scroll-title__char'}
                aria-hidden="true"
              >
                {char === ' ' ? '\u00a0' : char}
              </span>
            ))}
          </h1>
          {description ? <p className="pds-scroll-title__description">{description}</p> : null}
          {actions ? <div className="pds-scroll-title__actions">{actions}</div> : null}
        </div>
      </div>
    </section>
  )
}
