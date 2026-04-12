'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Clock, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollScrubHero } from '@/components/pds/scroll-scrub-hero'
import { SourceAircraftSequence } from '@/components/pds/source-video-sequence'
import {
  PDS_ASSETS,
  SourceCtaLink,
  SourceImageBand,
  SourceStatsSection,
  SourceTechBlock
} from '@/components/pds/joby-sections'

const TECHNOLOGY_VIDEO =
  'https://pub-c3f399360b0b4437b233f8cc0505582a.r2.dev/videos/compressed-technology-intro-desktop.mp4'
const TECHNOLOGY_SEQUENCE = [
  'https://www.jobyaviation.com/videos/vertical-v2.webm',
  'https://www.jobyaviation.com/videos/cruise-v2.webm',
  'https://www.jobyaviation.com/videos/transition-v2.webm',
  'https://www.jobyaviation.com/videos/technology/duo-120-new.webm',
  'https://cdn.sanity.io/files/h5mp19kq/production/40d1946052e15f7e3fa6d5ed49834a78d332056a.mp4'
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
        heightVh={620}
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
            src: TECHNOLOGY_SEQUENCE[2],
            loop: false
          },
          {
            label: '04',
            title: tAbout('commitment.title_1'),
            copy: tAbout('commitment.description'),
            src: TECHNOLOGY_SEQUENCE[3]
          },
          {
            label: '05',
            title: tHero('subtitle'),
            copy: tHero('description'),
            src: TECHNOLOGY_SEQUENCE[4]
          }
        ]}
      />

      <SourceTechBlock
        index="1"
        eyebrow={t('badge')}
        title={tCategories('our_products_1')}
        copy={tCategories('description')}
        image={PDS_ASSETS.homeTech}
        height={6900}
      />
      <SourceImageBand
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
        height={5200}
      />
      <SourceTechBlock
        index="3"
        eyebrow={tAbout('commitment.title_1')}
        title={tAbout('commitment.title_2')}
        copy={tAbout('commitment.description')}
        image={PDS_ASSETS.technologyEngineering}
        height={5200}
      />
      <SourceImageBand
        image={PDS_ASSETS.technologySustainability}
        eyebrow={tHero('since')}
        title={tAbout('values.items.service.title')}
        copy={tAbout('values.items.service.desc')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
      <SourceStatsSection
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
        image={PDS_ASSETS.technologyCommute}
        title={tHero('subtitle')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
    </main>
  )
}
