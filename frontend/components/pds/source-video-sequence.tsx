'use client'

import type { CSSProperties, MutableRefObject, ReactNode, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type SourceVideoSequenceItem = {
  label: string
  title: ReactNode
  copy: ReactNode
  src?: string
}

type SequenceProgressMode = 'standard' | 'company-timeline'

type SourceVideoSequenceProps = {
  eyebrow?: ReactNode
  title: ReactNode
  copy?: ReactNode
  items: SourceVideoSequenceItem[]
  dark?: boolean
  heightVh?: number
  tabletHeightVh?: number
  mobileHeightVh?: number
}

export function SourceVideoSequence({
  eyebrow,
  title,
  copy,
  items,
  dark = true,
  heightVh = 520,
  tabletHeightVh,
  mobileHeightVh
}: SourceVideoSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useSequenceProgress(sectionRef, items.length, activeRef, setActiveIndex, videoRefs)

  return (
    <section
      ref={sectionRef}
      className={`pds-video-sequence ${dark ? 'pds-video-sequence--dark' : 'pds-video-sequence--cream'}`}
      style={{
        '--pds-sequence-height': `${heightVh}vh`,
        '--pds-sequence-height-tablet': tabletHeightVh ? `${tabletHeightVh}vh` : undefined,
        '--pds-sequence-height-mobile': mobileHeightVh ? `${mobileHeightVh}vh` : undefined,
        '--pds-sequence-progress': 0
      } as CSSProperties}
    >
      <div className="pds-video-sequence__sticky">
        <div className="pds-video-sequence__media" aria-hidden="true">
          {items.map((item, index) => (
            <video
              key={`${item.src}-${index}`}
              src={item.src}
              muted
              playsInline
              preload="auto"
              ref={(node) => {
                videoRefs.current[index] = node
              }}
              data-active={activeIndex === index}
            />
          ))}
        </div>
        <div className="pds-video-sequence__shade" />

        <div className="pds-video-sequence__copy">
          {eyebrow ? <span className="pds-eyebrow">{eyebrow}</span> : null}
          <h2 className="pds-title">{title}</h2>
          {copy ? <p className="pds-copy">{copy}</p> : null}
        </div>

        <div className="pds-video-sequence__items">
          {items.map((item, index) => (
            <article key={`${item.label}-${index}`} data-active={activeIndex === index}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

type SourceAircraftSequenceProps = {
  specs: { label: ReactNode; value: ReactNode }[]
  title: ReactNode
  items: SourceVideoSequenceItem[]
  heightVh?: number
  tabletHeightVh?: number
  mobileHeightVh?: number
}

export function SourceAircraftSequence({
  specs,
  title,
  items,
  heightVh = 620,
  tabletHeightVh,
  mobileHeightVh
}: SourceAircraftSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([])
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useSequenceProgress(sectionRef, items.length, activeRef, setActiveIndex, videoRefs)
  useAircraftCanvasOverlay(sectionRef, canvasRefs)

  return (
    <section
      ref={sectionRef}
      className="pds-aircraft-sequence"
      style={{
        '--pds-sequence-height': `${heightVh}vh`,
        '--pds-sequence-height-tablet': tabletHeightVh ? `${tabletHeightVh}vh` : undefined,
        '--pds-sequence-height-mobile': mobileHeightVh ? `${mobileHeightVh}vh` : undefined,
        '--pds-sequence-progress': 0
      } as CSSProperties}
    >
      <div className="pds-aircraft-sequence__sticky">
        <div className="pds-aircraft-sequence__specs">
          {specs.map((spec) => (
            <div key={`${spec.label}-${spec.value}`}>
              <span>{spec.label}</span>
              <strong>{spec.value}</strong>
            </div>
          ))}
        </div>
        <h2>{title}</h2>

        <div className="pds-aircraft-sequence__media" aria-hidden="true">
          {items.map((item, index) => (
            <video
              key={`${item.src}-${index}`}
              src={item.src || undefined}
              muted
              playsInline
              preload="auto"
              ref={(node) => {
                videoRefs.current[index] = node
              }}
              data-active={activeIndex === index}
            />
          ))}
          <div className="pds-aircraft-sequence__canvases">
            {Array.from({ length: 5 }, (_, index) => (
              <canvas
                key={`aircraft-canvas-${index}`}
                ref={(node) => {
                  canvasRefs.current[index] = node
                }}
                data-active={activeIndex === index || (activeIndex > 4 && index === 4)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type SourceCompanyTimelineMediaProps = {
  items: SourceVideoSequenceItem[]
  heightVh?: number
  tabletHeightVh?: number
  mobileHeightVh?: number
}

export function SourceCompanyTimelineMedia({
  items,
  heightVh = 540,
  tabletHeightVh,
  mobileHeightVh
}: SourceCompanyTimelineMediaProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useSequenceProgress(sectionRef, items.length, activeRef, setActiveIndex, videoRefs, 'company-timeline')

  return (
    <section
      ref={sectionRef}
      className="pds-company-media-sequence"
      style={{
        '--pds-sequence-height': `${heightVh}vh`,
        '--pds-sequence-height-tablet': tabletHeightVh ? `${tabletHeightVh}vh` : undefined,
        '--pds-sequence-height-mobile': mobileHeightVh ? `${mobileHeightVh}vh` : undefined,
        '--pds-sequence-progress': 0
      } as CSSProperties}
    >
      <div className="pds-company-media-sequence__sticky">
        <div className="pds-company-media-sequence__frame" aria-hidden="true">
          {items.map((item, index) => (
            <video
              key={`${item.src}-${index}`}
              src={item.src}
              muted
              playsInline
              preload="auto"
              ref={(node) => {
                videoRefs.current[index] = node
              }}
              data-active={activeIndex === index}
            />
          ))}
        </div>
        <div className="pds-company-media-sequence__line">
          <span>{items[activeIndex]?.title}</span>
        </div>
      </div>
    </section>
  )
}

function useSequenceProgress(
  sectionRef: RefObject<HTMLElement>,
  itemCount: number,
  activeRef: MutableRefObject<number>,
  setActiveIndex: (value: number) => void,
  videoRefs?: MutableRefObject<Array<HTMLVideoElement | null>>,
  mode: SequenceProgressMode = 'standard'
) {
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let frame = 0
    const clamp = (value: number) => Math.max(0, Math.min(1, value))
    const safeItemCount = Math.max(1, itemCount)

    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollable)
      const documentScrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const documentProgress = clamp(window.scrollY / documentScrollable)
      const segment = progress * safeItemCount
      const nextIndex = Math.min(safeItemCount - 1, Math.floor(segment))
      const localProgress = nextIndex === safeItemCount - 1 ? 1 : clamp(segment - nextIndex)
      section.style.setProperty('--pds-sequence-progress', progress.toFixed(4))

      videoRefs?.current.forEach((video, index) => {
        if (!video) return
        video.pause()
        video.autoplay = false
        video.loop = false

        if (!video.duration || !Number.isFinite(video.duration)) return

        const companyTimelineTime = window.innerWidth <= 480
          ? 0
          : clamp((documentProgress - 0.15) / 0.25) * video.duration * 0.22
        const targetTime = mode === 'company-timeline' && index === 0
          ? companyTimelineTime
          : index === nextIndex
          ? localProgress * video.duration
          : index < nextIndex
            ? video.duration
            : 0

        if (Math.abs(video.currentTime - targetTime) > 0.04) {
          try {
            video.currentTime = targetTime
          } catch {
            // Some remote videos briefly reject seeks until metadata is ready.
          }
        }
      })

      if (nextIndex !== activeRef.current) {
        activeRef.current = nextIndex
        setActiveIndex(nextIndex)
      }
    }

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    const videos = videoRefs?.current.filter(Boolean) ?? []
    videos.forEach((video) => video?.addEventListener('loadedmetadata', requestUpdate))
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      videos.forEach((video) => video?.removeEventListener('loadedmetadata', requestUpdate))
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sectionRef, itemCount, activeRef, setActiveIndex, videoRefs, mode])
}

function useAircraftCanvasOverlay(
  sectionRef: RefObject<HTMLElement>,
  canvasRefs: MutableRefObject<Array<HTMLCanvasElement | null>>
) {
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let frame = 0
    const clamp = (value: number) => Math.max(0, Math.min(1, value))

    const draw = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = clamp(-rect.top / scrollable)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      canvasRefs.current.forEach((canvas, index) => {
        if (!canvas) return

        const bounds = canvas.getBoundingClientRect()
        const width = Math.max(1, Math.round(bounds.width * pixelRatio))
        const height = Math.max(1, Math.round(bounds.height * pixelRatio))
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
        }

        const context = canvas.getContext('2d')
        if (!context) return

        context.clearRect(0, 0, width, height)
        context.save()
        context.scale(pixelRatio, pixelRatio)
        context.globalAlpha = 0.18 + index * 0.035
        context.strokeStyle = index % 2 === 0 ? '#007ae5' : '#0e1620'
        context.lineWidth = 1 + index * 0.35

        const phase = progress * Math.PI * 2 + index * 0.82
        const centerX = bounds.width * (0.46 + Math.sin(phase) * 0.08)
        const centerY = bounds.height * (0.58 + Math.cos(phase * 0.7) * 0.08)
        const radius = Math.min(bounds.width, bounds.height) * (0.18 + index * 0.035)

        context.beginPath()
        context.ellipse(centerX, centerY, radius * 1.8, radius, phase * 0.15, 0, Math.PI * 2)
        context.stroke()

        context.beginPath()
        context.moveTo(bounds.width * 0.08, centerY)
        context.bezierCurveTo(
          bounds.width * 0.32,
          centerY - radius,
          bounds.width * 0.66,
          centerY + radius * 0.55,
          bounds.width * 0.92,
          centerY - radius * 0.18
        )
        context.stroke()
        context.restore()
      })
    }

    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }

    window.addEventListener('scroll', requestDraw, { passive: true })
    window.addEventListener('resize', requestDraw)
    draw()

    return () => {
      window.removeEventListener('scroll', requestDraw)
      window.removeEventListener('resize', requestDraw)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sectionRef, canvasRefs])
}
