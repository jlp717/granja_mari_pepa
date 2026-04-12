'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

type ScrollScrubHeroProps = {
  videoSrc: string
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  scrollVh?: number
}

export function ScrollScrubHero({
  videoSrc,
  title,
  eyebrow,
  subtitle,
  description,
  actions,
  scrollVh = 1200
}: ScrollScrubHeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.pause()

    let frame = 0
    const clamp = (value: number) => Math.max(0, Math.min(1, value))

    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollable)

      section.style.setProperty('--pds-hero-progress', progress.toFixed(4))

      if (video.duration && Number.isFinite(video.duration)) {
        const targetTime = progress * video.duration
        if (Math.abs(video.currentTime - targetTime) > 0.04) {
          video.currentTime = targetTime
        }
      }
    }

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    video.addEventListener('loadedmetadata', update)
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      video.removeEventListener('loadedmetadata', update)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const style = {
    '--pds-hero-progress': 0,
    '--pds-hero-scroll-height': `${scrollVh}svh`
  } as CSSProperties

  return (
    <section ref={sectionRef} className="pds-hero pds-hero--scrub" style={style}>
      <div className="pds-hero__sticky">
        <div className="pds-hero__media">
          <video ref={videoRef} muted playsInline preload="auto" aria-hidden="true">
            <source src={videoSrc} type="video/mp4" />
          </video>

          <div className="pds-hero__title">
            {eyebrow ? <span className="pds-eyebrow mb-5 block">{eyebrow}</span> : null}
            <h1 className="pds-title-lg">{title}</h1>
          </div>

          {subtitle ? <p className="pds-hero__subtitle">{subtitle}</p> : null}
          {description ? <div className="pds-hero__text-slide"><p>{description}</p></div> : null}
          {actions ? <div className="pds-hero__actions">{actions}</div> : null}
        </div>
      </div>
    </section>
  )
}
