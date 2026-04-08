'use client';

import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from '@/lib/navigation';
import ResponsiveImage from '@/components/ui/responsive-image';
import { useTranslations } from 'next-intl';

const distributors = [
  {
    id: 'grupo-topgel',
    image: '/images/logo-gtg.png',
    externalUrl: 'http://www.grupotopgel.es/',
  },
  {
    id: 'nestle',
    image: '/images/logo-nestle.png',
    externalUrl: 'https://www.helados.nestle.es/',
  },
  {
    id: 'panamar',
    image: '/images/logo-panamar.png',
    externalUrl: 'http://www.panamar.es/',
  },
];

export function DistributorsSection() {
  const t = useTranslations('distributors_section');
  const tBrands = useTranslations('brands');

  return (
    <section className="px-6 py-20 md:px-10 md:py-28" style={{ backgroundColor: 'var(--color-navy)' }}>
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-14 text-center">
          <p
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(245,244,223,0.65)',
              marginBottom: '0.8rem',
            }}
          >
            {t('official_partners')}
          </p>
          <h2 style={{ color: 'var(--color-beige)' }}>
            {t('title_part1')} <br /> {t('title_part2')}
          </h2>
          <p
            className="mx-auto mt-6 max-w-3xl"
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: '1.05rem',
              lineHeight: 1.45,
              color: 'rgba(245,244,223,0.84)',
            }}
          >
            {t('interested_text')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {distributors.map((item) => (
            <a
              key={item.id}
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-[28px] border p-7 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: 'rgba(245,244,223,0.2)',
                backgroundColor: 'rgba(245,244,223,0.04)',
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: 'rgba(245,244,223,0.1)' }}
                >
                  <ResponsiveImage
                    src={item.image}
                    alt={tBrands(`${item.id}.name`)}
                    className="h-12 w-20 object-contain"
                    sizes="120px"
                  />
                </div>
                <ExternalLink className="h-4 w-4 text-white/70" />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.7rem',
                  fontWeight: 550,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-beige)',
                  marginBottom: '0.55rem',
                }}
              >
                {tBrands(`${item.id}.name`)}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-text)',
                  fontSize: '0.95rem',
                  lineHeight: 1.45,
                  color: 'rgba(245,244,223,0.74)',
                }}
              >
                {tBrands(`${item.id}.detailed`)}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/contacto"
            className="joby-button blue inline-flex px-8 py-4"
          >
            <span className="inline-flex items-center gap-2">
              {t('request_info')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
