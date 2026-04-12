'use client'

import type { CSSProperties, MutableRefObject, ReactNode, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type SourceVideoSequenceItem = {
  label: string
  title: ReactNode
  copy: ReactNode
  src: string
  loop?: boolean
}

type SourceVideoSequenceProps = {
  eyebrow?: ReactNode
  title: ReactNode
  copy?: ReactNode
  items: SourceVideoSequenceItem[]
  dark?: boolean
  heightVh?: number
}

export function SourceVideoSequence({
  eyebrow,
  title,
  copy,
  items,
  dark = true,
  heightVh = 520
}: SourceVideoSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

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
      const nextIndex = Math.min(items.length - 1, Math.floor(progress * items.length))
      section.style.setProperty('--pds-sequence-progress', progress.toFixed(4))

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
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items.length])

  return (
    <section
      ref={sectionRef}
      className={`pds-video-sequence ${dark ? 'pds-video-sequence--dark' : 'pds-video-sequence--cream'}`}
      style={{ '--pds-sequence-height': `${heightVh}vh`, '--pds-sequence-progress': 0 } as CSSProperties}
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
              autoPlay
              loop={item.loop ?? true}
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
}

export function SourceAircraftSequence({ specs, title, items, heightVh = 620 }: SourceAircraftSequenceProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useSequenceProgress(sectionRef, items.length, activeRef, setActiveIndex)

  return (
    <section
      ref={sectionRef}
      className="pds-aircraft-sequence"
      style={{ '--pds-sequence-height': `${heightVh}vh`, '--pds-sequence-progress': 0 } as CSSProperties}
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
              src={item.src}
              muted
              playsInline
              preload="auto"
              autoPlay
              loop={item.loop ?? true}
              data-active={activeIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type SourceCompanyTimelineMediaProps = {
  items: SourceVideoSequenceItem[]
  heightVh?: number
}

export function SourceCompanyTimelineMedia({ items, heightVh = 540 }: SourceCompanyTimelineMediaProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useSequenceProgress(sectionRef, items.length, activeRef, setActiveIndex)

  return (
    <section
      ref={sectionRef}
      className="pds-company-media-sequence"
      style={{ '--pds-sequence-height': `${heightVh}vh`, '--pds-sequence-progress': 0 } as CSSProperties}
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
              autoPlay
              loop={item.loop ?? true}
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
  setActiveIndex: (value: number) => void
) {
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
      const nextIndex = Math.min(itemCount - 1, Math.floor(progress * itemCount))
      section.style.setProperty('--pds-sequence-progress', progress.toFixed(4))

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
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sectionRef, itemCount, activeRef, setActiveIndex])
}
