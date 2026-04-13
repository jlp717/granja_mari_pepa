import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/navigation'

export const PDS_ASSETS = {
  homeApp: 'https://cdn.sanity.io/images/h5mp19kq/production/896d4d7e05eb68acd3a49e98a0ff6f9804601e84-2248x1450.jpg?fm=webp&q=90',
  homeTech: 'https://cdn.sanity.io/images/h5mp19kq/production/fe892333d4c9a9934032f2ee33da32ac0f61211f-3200x1800.jpg?w=2000&fm=webp&q=90',
  homeStory: 'https://cdn.sanity.io/images/h5mp19kq/production/de462f3594507f8d71cc7820510d8b5493830083-2520x1580.png?w=2000&fm=webp&q=90',
  experienceViews: 'https://cdn.sanity.io/images/h5mp19kq/production/c3e51f6df54314b3643821c76520a1c69b7fde5d-2172x1800.jpg?w=1600&fm=webp&q=90',
  experienceComfort: 'https://cdn.sanity.io/images/h5mp19kq/production/232cbec3fcbf9b5b78748e36d354288e7caf27ee-2172x1800.jpg?w=1600&fm=webp&q=90',
  experienceJourney: 'https://cdn.sanity.io/images/h5mp19kq/production/10d341acdbdbf468f02058345e80c29d3b5e5e40-2172x1800.jpg?w=1600&fm=webp&q=90',
  partnerCar: 'https://cdn.sanity.io/images/h5mp19kq/production/08c1cc4c2b2f84e81af5a811a077423dbf1a82d5-1500x1892.jpg?w=1600&fm=webp&q=90',
  partnerAir: 'https://cdn.sanity.io/images/h5mp19kq/production/63e7e05a6a30a30f436156a8cb269a9bf9462a41-1500x1892.jpg?w=1600&fm=webp&q=90',
  partnerInfrastructure: 'https://cdn.sanity.io/images/h5mp19kq/production/58843994032d8c021e582ce1ce7ce1cd3de3743d-4800x6000.png?w=1600&fm=webp&q=90',
  technologySafety: 'https://cdn.sanity.io/images/h5mp19kq/production/efdaf237ec499c9731dd89205127792fbb20bf8f-2122x1194.png?w=2000&fm=webp&q=90',
  technologyTesting: 'https://cdn.sanity.io/images/h5mp19kq/production/4cdce047e61c99dde940e537e57ce1a3ecd7590e-2001x2003.jpg?w=1600&fm=webp&q=90',
  technologyRedundancy: 'https://cdn.sanity.io/images/h5mp19kq/production/a0c8080aa19771444f92d41cd87410246c548fce-2048x2048.jpg?w=1600&fm=webp&q=90',
  technologyEngineering: 'https://cdn.sanity.io/images/h5mp19kq/production/c5428bf864f113e61212b8860974f0a73f672cf4-2048x1366.jpg?w=1600&fm=webp&q=90',
  technologySustainability: 'https://cdn.sanity.io/images/h5mp19kq/production/aa0a93fdc1c9737c4fc33c3238c4d066ecb303d9-2500x5938.jpg',
  technologyCommute: 'https://cdn.sanity.io/images/h5mp19kq/production/2b619d49bbf13550af464d85d2e077135d9a33c9-3200x1800.jpg?w=2000&fm=webp&q=90',
  dreamOne: 'https://cdn.sanity.io/images/h5mp19kq/production/c87e7474a50bc61d572909da05aee1647cd8f082-2400x6045.webp?w=1600&fm=webp&q=80',
  dreamTwo: 'https://cdn.sanity.io/images/h5mp19kq/production/e5d6f302a057dc33abc3047e611edd9b8c74bcf0-2400x1518.webp?w=1600&fm=webp&q=80',
  dreamThree: 'https://cdn.sanity.io/images/h5mp19kq/production/f534edec7bf7bc54afc1ece9f54f507eed0dcff1-2400x1616.webp?w=1600&fm=webp&q=80',
  companyOrigin: 'https://cdn.sanity.io/images/h5mp19kq/production/c761953ab8eee09507d04579152c234cb6686c80-1440x991.jpg?w=1600&fm=webp&q=80',
  companyWorkshop: 'https://cdn.sanity.io/images/h5mp19kq/production/a6838b0d5dcabc0825980b496f84e53f7efcb1f2-1920x1321.jpg?w=1600&fm=webp&q=80'
}

type SourceBandProps = {
  image: string
  eyebrow?: ReactNode
  title: ReactNode
  copy?: ReactNode
  action?: ReactNode
  dark?: boolean
  height?: number
  tabletHeight?: number
  mobileHeight?: number
  sectionId?: string
}

export function SourceImageBand({
  image,
  eyebrow,
  title,
  copy,
  action,
  dark = true,
  height,
  tabletHeight,
  mobileHeight,
  sectionId
}: SourceBandProps) {
  return (
    <section
      id={sectionId}
      className={`pds-source-band ${dark ? 'pds-dark' : 'pds-cream'}`}
      style={{
        '--pds-band-height': height ? `${height}px` : undefined,
        '--pds-band-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-band-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <img src={image} alt="" loading="lazy" />
      <div className="pds-source-band__content">
        <div>
          {eyebrow ? <span className="pds-eyebrow mb-5">{eyebrow}</span> : null}
          <h2 className="pds-title">{title}</h2>
        </div>
        <div>
          {copy ? <p className="pds-copy mb-6">{copy}</p> : null}
          {action}
        </div>
      </div>
    </section>
  )
}

type Feature = {
  title: string
  copy: string
  image: string
}

export function SourceFeatureMosaic({
  eyebrow,
  title,
  copy,
  features,
  action,
  height,
  tabletHeight,
  mobileHeight,
  sectionId
}: {
  eyebrow: string
  title: ReactNode
  copy: string
  features: Feature[]
  action?: ReactNode
  height?: number
  tabletHeight?: number
  mobileHeight?: number
  sectionId?: string
}) {
  return (
    <section
      id={sectionId}
      className="pds-editorial"
      style={{
        '--pds-editorial-height': height ? `${height}px` : undefined,
        '--pds-editorial-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-editorial-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-grid">
        <div className="pds-editorial__label">
          <span className="pds-eyebrow">{eyebrow}</span>
        </div>
        <div className="pds-editorial__content">
          <h2 className="pds-title mb-7">{title}</h2>
          <p className="pds-copy mb-8">{copy}</p>
          {action}
        </div>
        <div className="pds-editorial__media pds-media-card">
          <img src={features[0]?.image} alt="" loading="lazy" />
        </div>
      </div>
      <div className="pds-card-strip mt-10">
        {features.map((feature) => (
          <article className="pds-card" key={feature.title}>
            <img src={feature.image} alt="" loading="lazy" />
            <div className="pds-card__content">
              <span className="pds-eyebrow mb-4">01</span>
              <h3 className="mb-4 text-4xl font-semibold leading-none tracking-[-0.03em]">{feature.title}</h3>
              <p className="text-base leading-tight text-white/80">{feature.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SourcePartnersSection({
  eyebrow,
  title,
  copy,
  labels,
  action,
  height,
  tabletHeight,
  mobileHeight
}: {
  eyebrow: string
  title: ReactNode
  copy: string
  labels: string[]
  action?: ReactNode
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  const visuals = [PDS_ASSETS.partnerCar, PDS_ASSETS.partnerAir, PDS_ASSETS.partnerInfrastructure]

  return (
    <section
      className="pds-partners"
      style={{
        '--pds-partners-height': height ? `${height}px` : undefined,
        '--pds-partners-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-partners-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-partners__sticky">
        <div>
          <span className="pds-eyebrow mb-8">{eyebrow}</span>
          <h2 className="pds-title">{title}</h2>
        </div>
        <div className="pds-partners__visual">
          <img src={visuals[0]} alt="" loading="lazy" />
        </div>
        <div className="pds-partners__copy">
          <div className="pds-partners__list mb-10">
            {labels.map((label, index) => (
              <span key={label} style={{ opacity: index === 0 ? 1 : .35 }}>{label}</span>
            ))}
          </div>
          <p className="pds-copy mb-8">{copy}</p>
          {action}
        </div>
      </div>
    </section>
  )
}

export function SourceDreamGallery({
  title,
  copy,
  height,
  tabletHeight,
  mobileHeight
}: {
  title: ReactNode
  copy: string
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      className="pds-dream-gallery"
      style={{
        '--pds-dream-height': height ? `${height}px` : undefined,
        '--pds-dream-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-dream-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-grid mb-12">
        <div className="col-span-5 max-md:col-span-full">
          <span className="pds-eyebrow">{copy}</span>
        </div>
        <div className="col-span-9 col-start-7 max-md:col-span-full">
          <h2 className="pds-title">{title}</h2>
        </div>
      </div>
      <div className="pds-dream-gallery__sticky">
        <div className="pds-dream-gallery__track">
          <img src={PDS_ASSETS.dreamOne} alt="" loading="lazy" />
          <img src={PDS_ASSETS.dreamTwo} alt="" loading="lazy" />
          <img src={PDS_ASSETS.dreamThree} alt="" loading="lazy" />
        </div>
      </div>
    </section>
  )
}

export function SourceNewsSection({
  eyebrow,
  title,
  items,
  action,
  height = 905,
  tabletHeight,
  mobileHeight
}: {
  eyebrow: string
  title: ReactNode
  items: { label: string; copy: string }[]
  action?: ReactNode
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      id="news"
      className="pds-news-section"
      style={{
        '--pds-news-height': `${height}px`,
        '--pds-news-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-news-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-grid">
        <div className="col-span-4 max-md:col-span-full">
          <span className="pds-eyebrow">{eyebrow}</span>
        </div>
        <div className="col-span-7 col-start-7 max-md:col-span-full">
          <h2 className="pds-title">{title}</h2>
        </div>
      </div>
      <div className="pds-news-section__items">
        {items.map((item) => (
          <article key={item.label}>
            <span className="pds-eyebrow">{item.label}</span>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>
      {action ? <div className="pds-news-section__action">{action}</div> : null}
    </section>
  )
}

export function SourceFooterBridge({
  title,
  copy,
  height = 1048,
  tabletHeight,
  mobileHeight
}: {
  title: ReactNode
  copy: string
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      id="footer"
      className="pds-footer-bridge"
      style={{
        '--pds-footer-bridge-height': `${height}px`,
        '--pds-footer-bridge-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-footer-bridge-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-footer-bridge__mark" aria-hidden="true" />
      <div className="pds-footer-bridge__copy">
        <h2 className="pds-title">{title}</h2>
        <p className="pds-copy">{copy}</p>
      </div>
    </section>
  )
}

export function SourceTechBlock({
  index,
  eyebrow,
  title,
  copy,
  image,
  dark,
  height,
  tabletHeight,
  mobileHeight
}: {
  index: string
  eyebrow: string
  title: ReactNode
  copy: string
  image: string
  dark?: boolean
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      className={`pds-tech-section ${dark ? 'pds-tech-section--dark' : ''}`}
      style={{
        '--pds-tech-height': `${height ?? 5200}px`,
        '--pds-tech-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-tech-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-tech-sticky">
        <span className="pds-tech-index">{index}</span>
        <div className="pds-tech-copy">
          <span className="pds-eyebrow">{eyebrow}</span>
          <h2 className="pds-title mb-7">{title}</h2>
          <p className="pds-copy">{copy}</p>
        </div>
        <div className="pds-tech-media">
          <img src={image} alt="" loading="lazy" />
        </div>
      </div>
    </section>
  )
}

export function SourceStatsSection({
  eyebrow,
  title,
  stats,
  height,
  tabletHeight,
  mobileHeight
}: {
  eyebrow: string
  title: ReactNode
  stats: { value: string; label: string; copy: string }[]
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      className="pds-section pds-cream pds-stats-section"
      style={{
        '--pds-stats-height': height ? `${height}px` : undefined,
        '--pds-stats-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-stats-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-grid mb-16">
        <div className="col-span-4 max-md:col-span-full">
          <span className="pds-eyebrow">{eyebrow}</span>
        </div>
        <div className="col-span-9 col-start-7 max-md:col-span-full">
          <h2 className="pds-title">{title}</h2>
        </div>
      </div>
      <div className="pds-spec-grid mx-16 max-md:mx-6">
        {stats.map((item) => (
          <article className="pds-spec-item" key={item.label}>
            <strong>{item.value}</strong>
            <span className="pds-eyebrow mb-4 mt-6">{item.label}</span>
            <p className="text-base leading-tight text-[#0e1620]/70">{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SourceCompanyTimeline({
  eyebrow,
  title,
  items,
  height,
  tabletHeight,
  mobileHeight
}: {
  eyebrow: string
  title: ReactNode
  items: { year: string; title: string; copy: string }[]
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      className="pds-section pds-dark pds-company-timeline"
      style={{
        '--pds-company-timeline-height': height ? `${height}px` : undefined,
        '--pds-company-timeline-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-company-timeline-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-grid mb-20">
        <div className="col-span-4 max-md:col-span-full">
          <span className="pds-eyebrow">{eyebrow}</span>
        </div>
        <div className="col-span-10 col-start-6 max-md:col-span-full">
          <h2 className="pds-title">{title}</h2>
        </div>
      </div>
      <div className="px-16 max-md:px-6">
        <div className="divide-y divide-white/20 border-y border-white/20">
          {items.map((item) => (
            <article key={item.year} className="grid gap-8 py-10 md:grid-cols-[16rem_1fr_1fr]">
              <span className="pds-title text-[clamp(3rem,6vw,7rem)]">{item.year}</span>
              <h3 className="text-4xl font-semibold leading-none tracking-[-0.03em]">{item.title}</h3>
              <p className="pds-copy text-white/76">{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SourceUtilityPage({
  eyebrow,
  title,
  copy,
  children,
  height,
  tabletHeight,
  mobileHeight
}: {
  eyebrow: string
  title: ReactNode
  copy: string
  children?: ReactNode
  height?: number
  tabletHeight?: number
  mobileHeight?: number
}) {
  return (
    <section
      className="pds-legal-source pds-cream"
      style={{
        '--pds-legal-height': height ? `${height}px` : undefined,
        '--pds-legal-height-tablet': tabletHeight ? `${tabletHeight}px` : undefined,
        '--pds-legal-height-mobile': mobileHeight ? `${mobileHeight}px` : undefined
      } as React.CSSProperties}
    >
      <div className="pds-legal-source__title">
        <span className="pds-eyebrow">{eyebrow}</span>
        <h1 className="pds-title">{title}</h1>
      </div>
      <div className="pds-legal-source__body">
        <p className="pds-copy mb-10">{copy}</p>
        {children}
      </div>
    </section>
  )
}

export function SourceCtaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="pds-button">
      <span>{children}</span>
      <ArrowRight className="pds-button__arrow h-5 w-5" />
    </Link>
  )
}
