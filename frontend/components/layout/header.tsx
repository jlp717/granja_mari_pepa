'use client'

import { useEffect, useState } from 'react'
import { Link, usePathname } from '@/lib/navigation'
import { ArrowRight, BookOpen, Phone, ShoppingCart, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/lib/store'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { CatalogModal } from '@/components/catalog/catalog-modal'

type Magazine = {
  title: string
  edition: string
  fullEdition: string
  url: string
}

const MAGAZINES: Magazine[] = [
  {
    title: 'Revista TopGel',
    edition: 'Febrero 2026',
    fullEdition: 'Edicion Febrero 2026',
    url: '/catalogs/topgel-febrero-2026.pdf'
  },
  {
    title: 'Revista TopGel',
    edition: 'Marzo 2026',
    fullEdition: 'Edicion Marzo 2026',
    url: '/catalogs/gmp-marzo-2026.pdf'
  }
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [activeCatalog, setActiveCatalog] = useState<{ url: string; edition: string }>({
    url: MAGAZINES[1].url,
    edition: MAGAZINES[1].fullEdition
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDarkScrollZone, setIsDarkScrollZone] = useState(false)
  const pathname = usePathname()
  const { getTotalItems, toggleCart } = useCartStore()
  const t = useTranslations('header')
  const tNav = useTranslations('nav')
  const tPrivacy = useTranslations('legal.privacy')
  const tTerms = useTranslations('legal.terms')

  const cartItemCount = isHydrated ? getTotalItems() : 0

  const navigation = [
    { name: tNav('home'), href: '/' },
    { name: tNav('products'), href: '/productos' },
    { name: tNav('about'), href: '/acerca' },
    { name: tNav('contact'), href: '/contacto' },
    { name: tNav('customerArea'), href: '/area-clientes' }
  ]
  const creamNavRoutes = ['/acerca', '/legal', '/area-clientes', '/checkout', '/login-secure-example', '/lorca', '/offline']
  const isCreamNav =
    creamNavRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) && !isDarkScrollZone
  const currentPageLabel =
    pathname === '/'
      ? null
      : pathname.startsWith('/legal/privacidad')
        ? tPrivacy('title')
        : pathname.startsWith('/legal/terminos')
          ? tTerms('title')
          : navigation.find((item) => item.href !== '/' && pathname.startsWith(item.href))?.name

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!pathname.startsWith('/acerca')) {
      setIsDarkScrollZone(false)
      return
    }

    let frame = 0
    const update = () => {
      frame = 0
      setIsDarkScrollZone(window.scrollY > window.innerHeight * 2.15)
    }
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    update()

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMenuOpen)
    return () => document.body.classList.remove('mobile-menu-open')
  }, [isMenuOpen])

  const openCatalog = (magazine: Magazine) => {
    setActiveCatalog({ url: magazine.url, edition: magazine.fullEdition })
    setIsCatalogOpen(true)
    setIsMenuOpen(false)
  }

  return (
    <>
      <nav
        className={`pds-nav pds-source-nav ${isCreamNav ? 'pds-source-nav--cream' : ''}`}
        aria-label="Navegacion principal"
      >
        <div className="pds-nav__inner">
          <div className="pds-nav__left">
            <button
              type="button"
              className="pds-menu-button"
              data-open={isMenuOpen}
              aria-label={isMenuOpen ? t('close_menu') : t('open_menu')}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
            {currentPageLabel ? (
              <span className="pds-current-page" aria-hidden="true">
                {currentPageLabel}
              </span>
            ) : null}
          </div>

          <Link href="/" className="pds-logo" aria-label="Granja Mari Pepa">
            <span className="pds-logo__mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="pds-logo__text">Mari Pepa</span>
          </Link>

          <Link href="/area-clientes" className="pds-nav-link">
            {tNav('customerArea')} <span aria-hidden="true">{'\u2197'}</span>
          </Link>
        </div>
      </nav>

      <div className="pds-menu-panel" data-open={isMenuOpen} aria-hidden={!isMenuOpen}>
        <div className="pds-menu-panel__grid">
          <div className="pds-menu-list" aria-label="Rutas principales">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          <aside className="pds-menu-aside">
            <div>
              <span className="pds-eyebrow">{t('brands_title')}</span>
              <div className="pds-menu-catalogs">
                {MAGAZINES.map((magazine) => (
                  <button key={magazine.url} type="button" onClick={() => openCatalog(magazine)}>
                    <span>
                      {magazine.title} <small>{magazine.edition}</small>
                    </span>
                    <BookOpen className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pds-menu-contact">
              <div>
                <a href="tel:968467514">
                  <Phone className="h-5 w-5" />
                  968 46 75 14
                </a>
                <p>{t('top_bar.location')}</p>
              </div>
              <LanguageSwitcher variant="minimal" className="text-white" />

              <button
                type="button"
                onClick={() => {
                  toggleCart()
                  setIsMenuOpen(false)
                }}
                className="pds-button pds-button--ghost"
                aria-label={t('cart_label', { count: cartItemCount })}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{cartItemCount}</span>
              </button>
              <Link href="/area-clientes" className="pds-button" onClick={() => setIsMenuOpen(false)}>
                <User className="h-5 w-5" />
                <span>{tNav('customerArea')}</span>
                <ArrowRight className="pds-button__arrow h-5 w-5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        pdfUrl={activeCatalog.url}
        edition={activeCatalog.edition}
      />
      <CartDrawer />
    </>
  )
}
