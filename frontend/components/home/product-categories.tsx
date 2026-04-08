'use client';

import { ArrowRight } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { productCategories } from '@/lib/data';
import { useTranslations } from 'next-intl';
import ResponsiveImage from '@/components/ui/responsive-image';

export function ProductCategories() {
  const t = useTranslations('categories_section');
  const tCats = useTranslations('categories');
  const tCommon = useTranslations('common');

  return (
    <section className="relative overflow-hidden px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: 'var(--color-beige)' }}>
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-14 text-center">
          <p
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(14,22,32,0.65)',
              marginBottom: '0.8rem',
            }}
          >
            {t('premium_catalog')}
          </p>
          <h2 style={{ color: 'var(--color-black)' }}>
            {t('our_products_1')} <br /> {t('our_products_2')}
          </h2>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.1rem',
              lineHeight: 1.45,
              color: 'rgba(14,22,32,0.8)',
            }}
          >
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productCategories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/productos?brand=${category.brandId}&category=${category.id}`}
              className="group overflow-hidden rounded-[28px] border transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: '#ffffff',
                borderColor: 'rgba(14,22,32,0.1)',
                boxShadow: '0 10px 24px rgba(14,22,32,0.08)',
              }}
            >
              <div className="relative h-52 overflow-hidden">
                <ResponsiveImage
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>

              <div className="p-5">
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.55rem',
                    fontWeight: 550,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-black)',
                    marginBottom: '0.55rem',
                    lineHeight: 1.15,
                  }}
                >
                  {tCats(`${category.id}.name`)}
                </h3>

                <p
                  style={{
                    fontFamily: 'var(--font-text)',
                    fontSize: '0.95rem',
                    lineHeight: 1.45,
                    color: 'rgba(14,22,32,0.72)',
                    marginBottom: '1rem',
                  }}
                >
                  {tCats(`${category.id}.description`)}
                </p>

                <span
                  className="inline-flex items-center gap-2"
                  style={{
                    fontFamily: 'var(--font-text)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: 'var(--color-blue)',
                  }}
                >
                  {tCommon('explore')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/productos?brand=grupo-topgel"
            className="joby-button blue inline-flex px-8 py-4"
            style={{ fontFamily: 'var(--font-text)', fontSize: '1rem' }}
          >
            <span className="inline-flex items-center gap-2">
              {t('view_catalog_topgel')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
