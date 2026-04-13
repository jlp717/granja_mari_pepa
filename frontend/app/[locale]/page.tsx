'use client'

import { CinematicHero } from '@/components/home/cinematic-hero'
import {
  PDS_ASSETS,
  SourceCtaLink,
  SourceDreamGallery,
  SourceFeatureMosaic,
  SourceFooterBridge,
  SourceImageBand,
  SourceNewsSection,
  SourcePartnersSection
} from '@/components/pds/source-sections'
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
        sectionId="experience-highlights"
        height={7408}
        tabletHeight={4574}
        mobileHeight={2233}
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
        sectionId="app"
        height={893}
        tabletHeight={1472}
        mobileHeight={719}
        image={PDS_ASSETS.homeApp}
        eyebrow={tHero('since')}
        title={tHero('subtitle')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/contacto">{tHero('contact_us')}</SourceCtaLink>}
      />
      <SourceImageBand
        sectionId="technology"
        height={1390}
        tabletHeight={1239}
        mobileHeight={933}
        image={PDS_ASSETS.homeTech}
        eyebrow={tCategories('featured')}
        title={tCategories('description')}
        copy={tHero('description')}
        action={<SourceCtaLink href="/productos">{tHero('explore_products')}</SourceCtaLink>}
      />
      <SourceNewsSection
        tabletHeight={2457}
        mobileHeight={1200}
        eyebrow={tCategories('featured')}
        title={tCategories('premium_catalog')}
        items={[
          { label: tHero('since'), copy: tHero('description') },
          { label: tDistributors('official_partners'), copy: tDistributors('interested_text') },
          { label: tCategories('premium_catalog'), copy: tCategories('description') }
        ]}
        action={<SourceCtaLink href="/productos">{tCategories('view_catalog_topgel')}</SourceCtaLink>}
      />
      <SourcePartnersSection
        tabletHeight={3178}
        mobileHeight={2394}
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
        sectionId="story"
        height={1390}
        tabletHeight={1239}
        mobileHeight={933}
        image={PDS_ASSETS.homeStory}
        eyebrow={tAbout('subtitle_highlight')}
        title={tAbout('title')}
        copy={tAbout('description')}
        action={<SourceCtaLink href="/acerca">{tAbout('cta_history')}</SourceCtaLink>}
      />
      <SourceDreamGallery title={tHero('title')} copy={tHero('scroll_down')} tabletHeight={5671} mobileHeight={3081} />
      <SourceFooterBridge title={tHero('title')} copy={tHero('description')} tabletHeight={1163} mobileHeight={568} />
    </main>
  )
}
