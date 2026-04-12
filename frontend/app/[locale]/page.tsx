'use client'

import { CinematicHero } from '@/components/home/cinematic-hero'
import {
  PDS_ASSETS,
  SourceCtaLink,
  SourceDreamGallery,
  SourceFeatureMosaic,
  SourceImageBand,
  SourcePartnersSection
} from '@/components/pds/joby-sections'
import { productCategories } from '@/lib/data'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const tHero = useTranslations('hero')
  const tCategories = useTranslations('categories_section')
  const tCategory = useTranslations('categories')
  const tDistributors = useTranslations('distributors_section')
  const tBrands = useTranslations('brands')
  const tAbout = useTranslations('about_page.hero')

  const features = productCategories.slice(0, 3).map((category, index) => ({
    title: tCategory(`${category.id}.name`),
    copy: tCategory(`${category.id}.description`),
    image: [PDS_ASSETS.experienceViews, PDS_ASSETS.experienceComfort, PDS_ASSETS.experienceJourney][index]
  }))

  return (
    <main className="pds-page">
      <CinematicHero />
      <div id="productos-section" />
      <SourceFeatureMosaic
        eyebrow={tCategories('premium_catalog')}
        title={
          <>
            <span className="block">{tCategories('our_products_1')}</span>
            <span className="block">{tCategories('our_products_2')}</span>
          </>
        }
        copy={tCategories('description')}
        features={features}
        action={<SourceCtaLink href="/productos">{tCategories('view_catalog_topgel')}</SourceCtaLink>}
      />
      <SourceImageBand
        image={PDS_ASSETS.homeApp}
        eyebrow={tHero('since')}
        title={tHero('subtitle')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
      <SourceImageBand
        image={PDS_ASSETS.homeTech}
        eyebrow={tCategories('featured')}
        title={tCategories('description')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/productos">{tHero('explore_products')}</SourceCtaLink>}
      />
      <SourcePartnersSection
        eyebrow={tDistributors('official_partners')}
        title={
          <>
            <span className="block">{tDistributors('title_part1')}</span>
            <span className="block">{tDistributors('title_part2')}</span>
          </>
        }
        copy={tDistributors('interested_text')}
        labels={['grupo-topgel', 'nestle', 'panamar'].map((id) => tBrands(`${id}.name`))}
        action={<SourceCtaLink href="/contacto">{tDistributors('request_info')}</SourceCtaLink>}
      />
      <SourceImageBand
        image={PDS_ASSETS.homeStory}
        eyebrow={tAbout('subtitle_highlight')}
        title={tAbout('title')}
        copy={tAbout('description')}
        action={<SourceCtaLink href="/acerca">{tAbout('cta_history')}</SourceCtaLink>}
      />
      <SourceDreamGallery title={tHero('title')} copy={tHero('scroll_down')} />
    </main>
  )
}
