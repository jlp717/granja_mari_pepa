'use client'

import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ScrollTitleHero } from '@/components/pds/scroll-title-hero'
import { SourceCompanyTimelineMedia } from '@/components/pds/source-video-sequence'
import {
  PDS_ASSETS,
  SourceCompanyTimeline,
  SourceImageBand,
  SourceStatsSection
} from '@/components/pds/source-sections'

const COMPANY_SEQUENCE = [
  'https://cdn.sanity.io/files/h5mp19kq/production/5f8590dd516c7fc724107a44f394679488a72473.mp4',
  'https://cdn.sanity.io/files/h5mp19kq/production/b12e40689c919eea44411a7424d260206e5f5be9.mp4',
  'https://cdn.sanity.io/files/h5mp19kq/production/48a2e0220cde5f7ed39a5ec4bbf986f0f60c4fec.mp4',
  'https://cdn.sanity.io/files/h5mp19kq/production/f4cdc51e04066e6a72cca202d7fdb0a88963fb24.mp4'
]

export default function AboutPage() {
  const t = useTranslations('about_page')
  const locale = useLocale()

  const milestones = [
    { year: '1966', title: t('history.milestones.1966.title'), desc: t('history.milestones.1966.desc') },
    { year: '1980s', title: t('history.milestones.1980s.title'), desc: t('history.milestones.1980s.desc') },
    { year: '2000s', title: t('history.milestones.2000s.title'), desc: t('history.milestones.2000s.desc') },
    { year: '2020', title: t('history.milestones.2020.title'), desc: t('history.milestones.2020.desc') },
    {
      year: locale === 'es' ? 'Actualidad' : 'Today',
      title: t('history.milestones.today.title'),
      desc: t('history.milestones.today.desc')
    }
  ]

  const values = [
    { stat: 'ISO 9001', title: t('values.items.quality.title'), desc: t('values.items.quality.desc'), label: t('values.items.quality.label') },
    { stat: '24-48h', title: t('values.items.service.title'), desc: t('values.items.service.desc'), label: t('values.items.service.label') },
    { stat: '2', title: t('values.items.coverage.title'), desc: t('values.items.coverage.desc'), label: t('values.items.coverage.label') },
    { stat: '+55', title: t('values.items.attention.title'), desc: t('values.items.attention.desc'), label: t('values.items.attention.label') }
  ]

  return (
    <main className="pds-page">
      <ScrollTitleHero
        height={3000}
        tabletHeight={2048}
        mobileHeight={1624}
        eyebrow={`${t('hero.subtitle_1')} ${t('hero.subtitle_highlight')} ${t('hero.subtitle_2')}`}
        title={t('hero.title')}
        description={t('hero.description')}
        actions={
          <>
            <a href="#history-section" className="pds-button pds-button--dark">
              <span>{t('hero.cta_history')}</span>
              <ArrowRight className="pds-button__arrow h-5 w-5" />
            </a>
            <Link href="/contacto" className="pds-button pds-button--ghost">
              <span>{t('hero.cta_contact')}</span>
            </Link>
          </>
        }
      />

      <SourceCompanyTimelineMedia
        heightVh={200}
        tabletHeightVh={250}
        mobileHeightVh={250}
        items={milestones.slice(0, 4).map((item, index) => ({
          label: item.year,
          title: item.title,
          copy: item.desc,
          src: COMPANY_SEQUENCE[index]
        }))}
      />

      <SourceImageBand
        height={12682}
        tabletHeight={12344}
        mobileHeight={8644}
        image={PDS_ASSETS.companyOrigin}
        eyebrow={t('delegations.description')}
        title={
          <>
            <span className="block">{t('history.title_1')}</span>
            <span className="block">{t('history.title_2')}</span>
          </>
        }
        copy={t('history.description')}
      />

      <SourceCompanyTimeline
        height={2099}
        tabletHeight={3989}
        mobileHeight={1949}
        eyebrow={t('history.description')}
        title={
          <>
            <span className="block">{t('history.title_1')}</span>
            <span className="block">{t('history.title_2')}</span>
          </>
        }
        items={milestones.map((item) => ({ year: item.year, title: item.title, copy: item.desc }))}
      />

      <SourceImageBand
        height={1390}
        tabletHeight={1239}
        mobileHeight={933}
        image={PDS_ASSETS.companyWorkshop}
        eyebrow={t('commitment.description')}
        title={
          <>
            <span className="block">{t('commitment.title_1')}</span>
            <span className="block">{t('commitment.title_2')}</span>
          </>
        }
        copy={t('commitment.offer_title')}
      />

      <SourceStatsSection
        height={1048}
        tabletHeight={1163}
        mobileHeight={568}
        eyebrow={t('values.description')}
        title={
          <>
            <span className="block">{t('values.title_1')}</span>
            <span className="block">{t('values.title_2')}</span>
          </>
        }
        stats={values.map((item) => ({ value: item.stat, label: item.title, copy: item.desc }))}
      />
    </main>
  )
}
