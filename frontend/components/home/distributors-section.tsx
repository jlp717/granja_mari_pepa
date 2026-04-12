'use client'

import { ArrowRight } from 'lucide-react'
import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'

const partners = [
  {
    id: 'grupo-topgel',
    image: '/images/logo-gtg.png',
    href: 'http://www.grupotopgel.es/',
    visual:
      'https://cdn.sanity.io/images/h5mp19kq/production/08c1cc4c2b2f84e81af5a811a077423dbf1a82d5-1500x1892.jpg?auto=format&w=900&q=85'
  },
  {
    id: 'nestle',
    image: '/images/logo-nestle.png',
    href: 'https://www.helados.nestle.es/',
    visual:
      'https://cdn.sanity.io/images/h5mp19kq/production/63e7e05a6a30a30f436156a8cb269a9bf9462a41-1500x1892.jpg?auto=format&w=900&q=85'
  },
  {
    id: 'panamar',
    image: '/images/logo-panamar.png',
    href: 'http://www.panamar.es/',
    visual:
      'https://cdn.sanity.io/images/h5mp19kq/production/58843994032d8c021e582ce1ce7ce1cd3de3743d-4800x6000.png?auto=format&w=900&q=85'
  }
]

export function DistributorsSection() {
  const t = useTranslations('distributors_section')
  const tBrands = useTranslations('brands')

  return (
    <section className="pds-section pds-dark">
      <div className="pds-grid mb-16">
        <div className="col-span-4 max-md:col-span-full">
          <span className="pds-eyebrow">{t('official_partners')}</span>
        </div>
        <div className="col-span-10 col-start-6 max-md:col-span-full">
          <h2 className="pds-title">
            <span className="block">{t('title_part1')}</span>
            <span className="block">{t('title_part2')}</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative min-h-[34rem] overflow-hidden bg-white text-[#0e1620]"
          >
            <img
              src={partner.visual}
              alt={tBrands(`${partner.id}.name`)}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/70" />
            <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
              <span className="pds-eyebrow text-white">{tBrands(`${partner.id}.category`)}</span>
              <ArrowRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
            </div>
            <div className="absolute inset-x-6 bottom-6 text-white">
              <div className="mb-5 flex h-20 w-36 items-center justify-center bg-white p-4">
                <img src={partner.image} alt={tBrands(`${partner.id}.name`)} className="max-h-full max-w-full object-contain" />
              </div>
              <h3 className="mb-3 text-3xl font-medium leading-none tracking-[-0.03em]">
                {tBrands(`${partner.id}.name`)}
              </h3>
              <p className="max-w-sm text-sm leading-tight text-white/80">{tBrands(`${partner.id}.detailed`)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
        <p className="pds-copy max-w-xl text-white/80">{t('interested_text')}</p>
        <Link href="/contacto" className="pds-button">
          <span>{t('request_info')}</span>
          <ArrowRight className="pds-button__arrow h-5 w-5" />
        </Link>
      </div>
    </section>
  )
}
