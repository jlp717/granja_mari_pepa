'use client'

import { Link } from '@/lib/navigation'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  const linkGroups = [
    {
      title: t('quick_access'),
      links: [
        { href: '/productos', label: tNav('products') },
        { href: '/acerca', label: tNav('about') },
        { href: '/contacto', label: tNav('contact') },
        { href: '/area-clientes', label: tNav('customerArea') }
      ]
    },
    {
      title: t('contact'),
      links: [
        { href: 'tel:968467514', label: '968 46 75 14' },
        { href: 'mailto:pedidos@granjamaripepa.com', label: 'pedidos@granjamaripepa.com' },
        { href: '/lorca', label: t('location_lorca') }
      ]
    },
    {
      title: 'Legal',
      links: [
        { href: '/legal/privacidad', label: t('privacy') },
        { href: '/legal/terminos', label: t('terms') }
      ]
    }
  ]

  return (
    <footer className="pds-footer">
      <div className="pds-footer__grid">
        <div className="pds-footer__brand">
          <Link href="/" className="mb-8 inline-flex">
            <img
              src="/pds-source-assets/images/logo-animated-256.webp"
              alt="Granja Mari Pepa"
              className="pds-footer__source-logo"
            />
          </Link>
          <p className="pds-copy mb-8 max-w-sm text-white/80">{t('description_long')}</p>
          <Link href="/contacto" className="pds-button pds-button--ghost">
            <span>{t('contact')}</span>
            <ArrowRight className="pds-button__arrow h-5 w-5" />
          </Link>
        </div>

        <div className="pds-footer__links">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="pds-eyebrow mb-5 text-white/55">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}`}>
                    <Link href={link.href} className="text-lg leading-tight text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20 flex flex-col gap-4 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
        <p>&copy; 2025 Granja Maripepa, S.L. {t('rights_reserved')}</p>
        <p>{t('nestle_distributor')}</p>
      </div>
    </footer>
  )
}
