'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

const SOURCE_HERO_VIDEO =
  'https://pub-c3f399360b0b4437b233f8cc0505582a.r2.dev/videos/compressed-home-intro-desktop-r3.mp4'

export function CinematicHero() {
  const t = useTranslations('hero')
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const scrollToProducts = () => {
    document.getElementById('productos-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

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

  return (
    <section
      ref={sectionRef}
      className="pds-hero pds-hero--scrub"
      style={{ '--pds-hero-progress': 0, '--pds-hero-scroll-height': '1800svh' } as React.CSSProperties}
    >
      <div className="pds-hero__sticky">
        <div className="pds-hero__media">
          <video ref={videoRef} muted playsInline preload="auto" aria-hidden="true">
            <source src={SOURCE_HERO_VIDEO} type="video/mp4" />
          </video>

          <div className="pds-hero__title">
            <h1 className="pds-title-lg">
              <span className="block">{t('title')}</span>
            </h1>
          </div>

          <p className="pds-hero__subtitle">{t('subtitle')}</p>

          <div className="pds-hero__text-slide">
            <p>{t('description')}</p>
          </div>

          <div className="pds-hero__actions">
            <button type="button" onClick={scrollToProducts} className="pds-button pds-button--dark">
              <span>{t('explore_products')}</span>
              <ArrowRight className="pds-button__arrow h-5 w-5" />
            </button>
            <Link href="/contacto" className="pds-button pds-button--ghost">
              <span>{t('contact_us')}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
