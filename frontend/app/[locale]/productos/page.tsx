'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Clock, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollScrubHero } from '@/components/pds/scroll-scrub-hero'
import { SourceAircraftSequence } from '@/components/pds/source-video-sequence'
import {
  PDS_ASSETS,
  SourceCtaLink,
  SourceFooterBridge,
  SourceImageBand,
  SourceStatsSection,
  SourceTechBlock
} from '@/components/pds/source-sections'

const TECHNOLOGY_VIDEO =
  'https://pub-c3f399360b0b4437b233f8cc0505582a.r2.dev/videos/compressed-technology-intro-desktop.mp4'
const TECHNOLOGY_SCRUB_TRACE = [
  [0, 0],
  [0.05, 0.36],
  [0.1, 0.62],
  [0.15, 0.985],
  [0.2, 0.995],
  [1, 0.995]
] as const
const TECHNOLOGY_SEQUENCE = [
  '/pds-source-assets/videos/aircraft-sequence-vertical.webm',
  '/pds-source-assets/videos/aircraft-sequence-cruise.webm',
  '/pds-source-assets/videos/aircraft-sequence-transition.webm',
  '/pds-source-assets/videos/aircraft-sequence-transition-reverse.webm',
  '/pds-source-assets/videos/aircraft-sequence-duo.webm',
  'https://cdn.sanity.io/files/h5mp19kq/production/40d1946052e15f7e3fa6d5ed49834a78d332056a.mp4',
  ''
]

export default function ProductsPage() {
  const t = useTranslations('products_page')
  const tHero = useTranslations('hero')
  const tCategories = useTranslations('categories_section')
  const tAbout = useTranslations('about_page')
  const router = useRouter()

  return (
    <main className="pds-page">
      <ScrollScrubHero
        videoSrc={TECHNOLOGY_VIDEO}
        scrollVh={500}
        tabletScrollVh={600}
        mobileScrollVh={600}
        scrubProgressMap={TECHNOLOGY_SCRUB_TRACE}
        eyebrow={<span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" />{t('badge')}</span>}
        title={t('title')}
        subtitle={t('subtitle_1')}
        description={t('subtitle_2')}
        actions={
          <>
            <button type="button" onClick={() => router.push('/')} className="pds-button pds-button--dark">
              <span>{t('cta_home')}</span>
              <ArrowRight className="pds-button__arrow h-5 w-5" />
            </button>
            <button type="button" onClick={() => router.push('/area-clientes')} className="pds-button pds-button--ghost">
              <span>{t('cta_clients')}</span>
            </button>
          </>
        }
      />

      <SourceAircraftSequence
        specs={[
          { label: tAbout('values.items.quality.label'), value: 'ISO 9001' },
          { label: tAbout('values.items.service.label'), value: '24-48h' },
          { label: tAbout('commitment.stats.temps_label'), value: '3' }
        ]}
        title={tCategories('description')}
        heightVh={575}
        tabletHeightVh={667}
        mobileHeightVh={603}
        items={[
          {
            label: '01',
            title: tAbout('values.items.quality.title'),
            copy: tAbout('values.items.quality.desc'),
            src: TECHNOLOGY_SEQUENCE[0]
          },
          {
            label: '02',
            title: tAbout('values.items.service.title'),
            copy: tAbout('values.items.service.desc'),
            src: TECHNOLOGY_SEQUENCE[1]
          },
          {
            label: '03',
            title: tAbout('values.items.coverage.title'),
            copy: tAbout('values.items.coverage.desc'),
            src: TECHNOLOGY_SEQUENCE[2]
          },
          {
            label: '04',
            title: tAbout('commitment.title_1'),
            copy: tAbout('commitment.description'),
            src: TECHNOLOGY_SEQUENCE[3]
          },
          {
            label: '05',
            title: tAbout('commitment.title_2'),
            copy: tAbout('commitment.offer_title'),
            src: TECHNOLOGY_SEQUENCE[4]
          },
          {
            label: '06',
            title: tHero('subtitle'),
            copy: tHero('description'),
            src: TECHNOLOGY_SEQUENCE[5]
          },
          {
            label: '07',
            title: tAbout('values.title_1'),
            copy: tAbout('values.description'),
            src: TECHNOLOGY_SEQUENCE[6]
          }
        ]}
      />

      <SourceTechBlock
        index="1"
        eyebrow={t('badge')}
        title={tCategories('our_products_1')}
        copy={tCategories('description')}
        image={PDS_ASSETS.homeTech}
        height={1390}
        tabletHeight={1188}
        mobileHeight={892}
      />
      <SourceImageBand
        height={10300}
        tabletHeight={8786}
        mobileHeight={6942}
        image={PDS_ASSETS.technologySafety}
        eyebrow={<span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{t('badge')}</span>}
        title={t('subtitle_1')}
        copy={t('subtitle_2')}
        action={<SourceCtaLink href="/area-clientes">{t('cta_clients')}</SourceCtaLink>}
      />
      <SourceTechBlock
        index="2"
        eyebrow={tAbout('values.description')}
        title={tAbout('values.title_1')}
        copy={tAbout('values.items.quality.desc')}
        image={PDS_ASSETS.technologyTesting}
        dark
        height={6080}
        tabletHeight={5145}
        mobileHeight={4072}
      />
      <SourceTechBlock
        index="3"
        eyebrow={tAbout('commitment.title_1')}
        title={tAbout('commitment.title_2')}
        copy={tAbout('commitment.description')}
        image={PDS_ASSETS.technologyEngineering}
        height={5260}
        tabletHeight={8252}
        mobileHeight={4591}
      />
      <SourceStatsSection
        height={765}
        tabletHeight={1036}
        mobileHeight={506}
        eyebrow={tAbout('commitment.stats.title')}
        title={tAbout('commitment.title_1')}
        stats={[
          { value: '1966', label: tAbout('commitment.stats.founded_label'), copy: tAbout('history.milestones.1966.desc') },
          { value: '+1500', label: tAbout('commitment.stats.references_label'), copy: tCategories('description') },
          { value: '5000m3', label: tAbout('commitment.stats.capacity_label'), copy: tAbout('commitment.items.capacity') },
          { value: '3', label: tAbout('commitment.stats.temps_label'), copy: tAbout('commitment.items.delivery') }
        ]}
      />
      <SourceImageBand
        height={3859}
        tabletHeight={4279}
        mobileHeight={2090}
        image={PDS_ASSETS.technologySustainability}
        eyebrow={tHero('since')}
        title={tAbout('values.items.service.title')}
        copy={tAbout('values.items.service.desc')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
      <SourceTechBlock
        index="4"
        eyebrow={tAbout('commitment.stats.title')}
        title={tAbout('commitment.offer_title')}
        copy={tAbout('commitment.items.capacity')}
        image={PDS_ASSETS.technologyCommute}
        dark
        height={7995}
        tabletHeight={7297}
        mobileHeight={5435}
      />
      <SourceImageBand
        height={1390}
        tabletHeight={1239}
        mobileHeight={933}
        image={PDS_ASSETS.technologyCommute}
        title={tHero('subtitle')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
      <SourceFooterBridge title={t('title')} copy={t('subtitle_2')} tabletHeight={1163} mobileHeight={568} />
    </main>
  )
}
