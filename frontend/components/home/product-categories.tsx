'use client'

import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { productCategories } from '@/lib/data'
import { useTranslations } from 'next-intl'

const FEATURE_IMAGE =
  'https://cdn.sanity.io/images/h5mp19kq/production/896d4d7e05eb68acd3a49e98a0ff6f9804601e84-2248x1450.jpg?auto=format&w=2200&q=85'

export function ProductCategories() {
  const t = useTranslations('categories_section')
  const tCats = useTranslations('categories')
  const tCommon = useTranslations('common')

  const featured = productCategories.slice(0, 3)

  return (
    <section className="pds-section pds-editorial">
      <div className="pds-grid">
        <div className="pds-editorial__label">
          <span className="pds-eyebrow">{t('premium_catalog')}</span>
        </div>

        <div className="pds-editorial__content">
          <h2 className="pds-title mb-7">
            <span className="block">{t('our_products_1')}</span>
            <span className="block">{t('our_products_2')}</span>
          </h2>
          <p className="pds-copy mb-8 max-w-2xl text-white/85">{t('description')}</p>
          <Link href="/productos?brand=grupo-topgel" className="pds-button pds-button--dark">
            <span>{t('view_catalog_topgel')}</span>
            <ArrowRight className="pds-button__arrow h-5 w-5" />
          </Link>
        </div>

        <div className="pds-editorial__media pds-media-card">
          <img src={FEATURE_IMAGE} alt={t('description')} loading="lazy" />
        </div>
      </div>

      <div className="pds-card-strip mt-6">
        {featured.map((category, index) => (
          <Link
            key={`${category.brandId}-${category.id}`}
            href={`/productos?brand=${category.brandId}&category=${category.id}`}
            className="pds-card"
          >
            <img src={category.image} alt={tCats(`${category.id}.name`)} loading={index === 0 ? 'eager' : 'lazy'} />
            <div className="pds-card__content">
              <span className="pds-eyebrow mb-3">{tCommon('premium')}</span>
              <h3 className="font-display mb-3 text-3xl font-medium leading-none tracking-[-0.03em]">
                {tCats(`${category.id}.name`)}
              </h3>
              <p className="max-w-sm text-sm leading-tight text-white/80">{tCats(`${category.id}.description`)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
