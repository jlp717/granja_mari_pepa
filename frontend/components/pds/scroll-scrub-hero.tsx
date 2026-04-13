'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

type ScrollScrubPoint = readonly [number, number]

type ScrollScrubHeroProps = {
  videoSrc: string
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  scrollVh?: number
  tabletScrollVh?: number
  mobileScrollVh?: number
  scrubProgressMap?: ReadonlyArray<ScrollScrubPoint>
  tabletScrubProgressMap?: ReadonlyArray<ScrollScrubPoint>
  mobileScrubProgressMap?: ReadonlyArray<ScrollScrubPoint>
}

export function ScrollScrubHero({
  videoSrc,
  title,
  eyebrow,
  subtitle,
  description,
  actions,
  scrollVh = 1200,
  tabletScrollVh,
  mobileScrollVh,
  scrubProgressMap,
  tabletScrubProgressMap,
  mobileScrubProgressMap
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
    video.load()

    let frame = 0
    const clamp = (value: number) => Math.max(0, Math.min(1, value))

    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollable)
      const documentScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const documentProgress = clamp(window.scrollY / documentScrollable)
      const activeScrubMap = window.innerWidth <= 480
        ? mobileScrubProgressMap ?? scrubProgressMap
        : window.innerWidth <= 900
          ? tabletScrubProgressMap ?? scrubProgressMap
          : scrubProgressMap
      const scrubProgress = activeScrubMap?.length
        ? interpolateScrubProgress(activeScrubMap, documentProgress)
        : progress

      section.style.setProperty('--pds-hero-progress', scrubProgress.toFixed(4))

      if (video.duration && Number.isFinite(video.duration)) {
        const targetTime = scrubProgress * video.duration
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
  }, [mobileScrubProgressMap, scrubProgressMap, tabletScrubProgressMap])

  const style = {
    '--pds-hero-progress': 0,
    '--pds-hero-scroll-height': `${scrollVh}svh`,
    '--pds-hero-scroll-height-tablet': tabletScrollVh ? `${tabletScrollVh}svh` : undefined,
    '--pds-hero-scroll-height-mobile': mobileScrollVh ? `${mobileScrollVh}svh` : undefined
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

function interpolateScrubProgress(points: ReadonlyArray<ScrollScrubPoint>, value: number) {
  if (!points.length) return value
  const clamp = (input: number) => Math.max(0, Math.min(1, input))
  const first = points[0]
  const last = points[points.length - 1]

  if (value <= first[0]) return clamp(first[1])
  if (value >= last[0]) return clamp(last[1])

  for (let index = 1; index < points.length; index += 1) {
    const end = points[index]
    if (value > end[0]) continue

    const start = points[index - 1]
    const span = Math.max(0.0001, end[0] - start[0])
    const localProgress = (value - start[0]) / span
    return clamp(start[1] + (end[1] - start[1]) * localProgress)
  }

  return clamp(value)
}
