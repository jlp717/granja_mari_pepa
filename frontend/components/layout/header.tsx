'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingCart, User, Phone, MapPin, ChevronDown, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { LanguageSwitcher } from '@/components/ui/language-switcher'


const NAVIGATION = [
  {
    name: 'Productos',
    href: '/productos',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Grupo Topgel',
        href: '/productos?brand=grupo-topgel',
        logo: 'gtg',
        subcategories: [
          { name: 'Productos del mar', href: '/productos?brand=grupo-topgel&category=mar' },
          { name: 'Carne', href: '/productos?brand=grupo-topgel&category=carne' },
          { name: 'Precocinados', href: '/productos?brand=grupo-topgel&category=precocinados' },
          { name: 'Repostería', href: '/productos?brand=grupo-topgel&category=reposteria' }
        ]
      },
      {
        name: 'Nestlé',
        href: '/productos?brand=nestle',
        logo: 'nestle',
        subcategories: [
          { name: 'Lácteos', href: '/productos?brand=nestle&category=lacteos' },
          { name: 'Cereales', href: '/productos?brand=nestle&category=cereales' },
          { name: 'Chocolate', href: '/productos?brand=nestle&category=chocolate' }
        ]
      },
      {
        name: 'Panamar',
        href: '/productos?brand=panamar',
        logo: 'panamar',
        subcategories: [
          { name: 'Pescado Fresco', href: '/productos?brand=panamar&category=pescado-fresco' },
          { name: 'Mariscos', href: '/productos?brand=panamar&category=mariscos' }
        ]
      },
      /*
      {
        name: 'Okin',
        href: '/productos?brand=okin',
        logo: 'okin',
        subcategories: [
          { name: 'Carne Fresca', href: '/productos?brand=okin&category=carne-fresca' },
          { name: 'Embutidos', href: '/productos?brand=okin&category=embutidos' }
        ]
      },
      {
        name: 'Pastelería Amparín',
        href: '/productos?brand=amparin',
        logo: 'pamparin',
        subcategories: [
          { name: 'Tartas', href: '/productos?brand=amparin&category=tartas' },
          { name: 'Bollería', href: '/productos?brand=amparin&category=bolleria' }
        ]
      }
      */
    ]
  },
  { name: 'Quiénes somos', href: '/acerca' },
  { name: 'Contacto', href: '/contacto' },
  { name: 'Área Clientes', href: '/area-clientes', icon: 'user' }
]

const NAV_STYLES = {
  scrolled: {
    header: 'bg-card shadow-2xl shadow-slate-900/20 border-b border-border',
    text: 'text-muted-foreground',
    activeText: 'text-primary-foreground bg-primary shadow-lg',
    hoverText: 'hover:text-foreground hover:bg-secondary'
  },
  normal: {
    header: 'bg-card shadow-xl border-b border-border',
    text: 'text-muted-foreground',
    activeText: 'text-primary-foreground bg-primary shadow-lg',
    hoverText: 'hover:text-primary hover:bg-primary-soft'
  }
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null)

  const pathname = usePathname()
  const { getTotalItems, toggleCart } = useCartStore()
  const locale = useLocale()

  const isHomePage = pathname === '/'
  const styles = isScrolled ? NAV_STYLES.scrolled : NAV_STYLES.normal

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileMenuOpen)
    return () => document.body.classList.remove('mobile-menu-open')
  }, [isMobileMenuOpen])

  const handleCartClick = useCallback(() => toggleCart(), [toggleCart])
  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), [])

  const NavLink = ({ item, isMobile = false }: { item: typeof NAVIGATION[0], isMobile?: boolean }) => {
    const isActive = pathname === item.href ||
      (item.hasSubmenu && pathname.startsWith('/productos')) ||
      (item.href === '/area-clientes' && pathname.startsWith('/area-clientes'))

    if (isMobile) {
      return (
        <motion.div
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden"
        >
          <Link
            href={item.href}
            className={`
              relative block py-4 px-6 text-base font-semibold rounded-xl transition-all duration-300 group
              ${isActive
                ? 'text-primary-foreground bg-primary shadow-lg border-l-4 border-primary/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
            onClick={closeMobileMenu}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active Page Indicator */}
            {isActive && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '4px' }}
                className="absolute left-0 top-0 bottom-0 bg-warning rounded-r-full"
              />
            )}

            {/* Ripple Effect Background */}
            <motion.div
              className="absolute inset-0 bg-secondary rounded-xl opacity-0 group-hover:opacity-100"
              initial={false}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />

            {/* Content with micro-animation */}
            <span className="relative z-10 flex items-center gap-3">
              {/* Icon for user/area clientes */}
              {(item as any).icon === 'user' && (
                <User className="w-5 h-5" />
              )}
              {/* Active indicator dot */}
              {isActive && !(item as any).icon && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-warning rounded-full animate-pulse"
                />
              )}
              {item.name}
              {/* Arrow indicator for active */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <ArrowRight className="w-4 h-4 text-primary-foreground/70" />
                </motion.div>
              )}
            </span>
          </Link>
        </motion.div>
      )
    }

    // Desktop version
    const baseClass = `px-4 py-3 xl:px-6 text-sm font-semibold transition-all duration-300 rounded-lg ${isActive ? styles.activeText : `${styles.text} ${styles.hoverText}`
      } hover:scale-105 focus-ring flex items-center gap-2`

    return (
      <Link
        href={item.href}
        className={baseClass}
        aria-current={isActive ? 'page' : undefined}
      >
        {(item as any).icon === 'user' && (
          <User className="w-4 h-4" />
        )}
        {item.name}
      </Link>
    )
  }

  // Define tipo para brand
  type BrandType = {
    name: string;
    href: string;
    logo: string;
    subcategories?: { name: string; href: string; }[];
  }

  const BrandLogo = ({ brand }: { brand: BrandType }) => (
    <Image
      src={`/images/logo-${brand.logo}.png`}
      alt={brand.name}
      width={28}
      height={28}
      className="object-contain max-w-full max-h-full"
    />
  )

  // Fix: Direct store subscription for immediate updates
  const cartItemCount = isHydrated ? getTotalItems() : 0

  return (
    <div className="relative">
      {/* Top Utility Bar - Premium Solid */}
      <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground text-xs z-[60] h-12 flex items-center overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_3s_infinite]" />
        <div className="absolute inset-0 bg-primary" />

        <div className="container mx-auto px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 group cursor-default">
              <div className="p-1.5 rounded-full bg-primary-foreground/10 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <MapPin className="w-3.5 h-3.5 text-primary-foreground/80" />
              </div>
              <span className="text-primary-foreground/90 font-medium tracking-wide">Murcia • Almería</span>
            </div>
            <a href="tel:968123456" className="hidden sm:flex items-center space-x-2 group hover:scale-105 transition-transform duration-300">
              <div className="p-1.5 rounded-full bg-primary-foreground/10 group-hover:bg-primary-foreground/20 transition-colors duration-300">
                <Phone className="w-3.5 h-3.5 text-primary-foreground/80" />
              </div>
              <span className="text-primary-foreground/90 font-medium tracking-wide group-hover:text-primary-foreground transition-colors">968 46 75 14</span>
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher variant="default" />
            <div className="bg-primary-foreground/10 px-5 py-1.5 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-all duration-300">
              <span className="text-primary-foreground font-semibold text-[13px] tracking-wide">
                {locale === 'es' ? 'Distribución especializada desde 1966' : 'Specialized distribution since 1966'}
              </span>
            </div>
          </div>
          <div className="hidden lg:flex items-center space-x-2 text-primary-foreground/80 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[13px]">{locale === 'es' ? 'Calidad Premium' : 'Premium Quality'}</span>
          </div>
        </div>
      </div>


      {/* Main Header - Solid Background */}
      <header className={`fixed top-12 left-0 right-0 z-50 transition-all duration-700 ease-out ${styles.header}`}>
        <div className="absolute inset-0 bg-card" />
        <nav className="container mx-auto px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="flex justify-between items-center h-20 sm:h-24 md:h-28 lg:h-32">
            {/* Logo - Premium hover effect */}
            <Link href="/" className="flex items-center focus-ring rounded-xl p-2 group relative">
              <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/5 transition-all duration-500" />
              <Image
                src="/images/logo.jpeg"
                alt="Granja Mari Pepa"
                width={220}
                height={165}
                className="object-contain w-28 h-20 sm:w-36 sm:h-26 md:w-44 md:h-32 lg:w-52 lg:h-38 xl:w-56 xl:h-42 transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {NAVIGATION.map((item) => (
                <div key={item.name} className="relative">
                  {item.hasSubmenu ? (
                    <div className="flex items-center">
                      <NavLink item={item} />
                      <div
                        className="relative"
                        onMouseEnter={() => setActiveSubmenu(item.name)}
                        onMouseLeave={() => setActiveSubmenu(null)}
                      >
                        <button
                          className={`p-2 ml-1 transition-all duration-300 rounded-lg ${styles.text}`}
                          aria-expanded={activeSubmenu === item.name}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeSubmenu === item.name ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {/* Submenu Dropdown */}
                        <AnimatePresence>
                          {activeSubmenu === item.name && item.submenu && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full right-0 mt-2 w-80 max-h-96 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-[9999]"
                              onMouseEnter={() => setActiveSubmenu(item.name)}
                              onMouseLeave={() => setActiveSubmenu(null)}
                            >
                              <div className="p-4 bg-secondary border-b border-border">
                                <h3 className="text-lg font-bold text-foreground">Nuestras Marcas</h3>
                              </div>

                              <div className="overflow-y-auto max-h-80 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                  {item.submenu.map((brand) => (
                                    <div key={brand.name} className="space-y-1">
                                      <Link
                                        href={brand.href}
                                        onClick={() => setActiveSubmenu(null)}
                                        className="flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-secondary group border border-border hover:border-primary/30"
                                      >
                                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mr-3 overflow-hidden group-hover:scale-110 transition-transform">
                                          <BrandLogo brand={brand} />
                                        </div>
                                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                          {brand.name}
                                        </span>
                                      </Link>

                                      {brand.subcategories && (
                                        <div className="ml-2 space-y-0.5">
                                          {brand.subcategories.map((subcat) => (
                                            <Link
                                              key={subcat.name}
                                              href={subcat.href}
                                              onClick={() => setActiveSubmenu(null)}
                                              className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary-soft rounded transition-all"
                                            >
                                              • {subcat.name}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-border">
                                  <Link
                                    href="/productos"
                                    onClick={() => setActiveSubmenu(null)}
                                    className="flex items-center justify-center p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all font-medium"
                                  >
                                    Ver todos los productos
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </Link>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <NavLink item={item} />
                  )}
                </div>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Cart Button - Premium Solid Style */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCartClick}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 relative overflow-hidden text-muted-foreground hover:text-foreground hover:bg-secondary"
                  aria-label={`Carrito ${cartItemCount > 0 ? `con ${cartItemCount} productos` : 'vacío'}`}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/10 rounded-xl" />
                  <ShoppingCart className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </Button>

                {cartItemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[11px] rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold border-2 border-card shadow-lg z-50"
                  >
                    <span>{cartItemCount}</span>
                  </motion.span>
                )}
              </div>

              {/* Mobile Menu Button - Enhanced Visibility */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-12 w-12 sm:h-14 sm:w-14 rounded-xl transition-all duration-300 bg-primary text-white hover:bg-primary/90 shadow-lg"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <motion.div animate={{ rotate: isMobileMenuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  {isMobileMenuOpen ? <X className="w-7 h-7" strokeWidth={2.5} /> : <Menu className="w-7 h-7" strokeWidth={2.5} />}
                </motion.div>
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-0 bg-white z-[10000] overflow-y-auto"
            >
              {/* Header del menú móvil - Con safe area */}
              <div className="bg-primary pt-14 sm:pt-16">
                <div className="flex items-center justify-between px-5 py-4">
                  {/* Logo - Sin fondo blanco, directamente */}
                  <Link href="/" onClick={closeMobileMenu} className="flex-shrink-0">
                    <Image
                      src="/images/logo.jpeg"
                      alt="Mari Pepa"
                      width={160}
                      height={120}
                      className="w-[140px] sm:w-[160px] h-auto object-contain rounded-xl"
                    />
                  </Link>

                  {/* Botón cerrar */}
                  <button
                    onClick={closeMobileMenu}
                    className="flex-shrink-0 w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-xl"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-7 h-7 text-primary" strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Current Page Context */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-slate-500">Estás en:</span>
                  <span className="font-semibold text-slate-800">
                    {(() => {
                      if (pathname === '/') return 'Inicio';
                      if (pathname === '/productos') return 'Productos';
                      if (pathname === '/acerca' || pathname === '/acerca/') return 'Quiénes somos';
                      if (pathname === '/contacto' || pathname === '/contacto/') return 'Contacto';
                      if (pathname === '/area-clientes' || pathname === '/area-clientes/') return 'Área Clientes';
                      if (pathname.startsWith('/productos/')) return 'Producto';
                      return 'Navegando';
                    })()}
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="px-4 py-6 space-y-2">
                {NAVIGATION.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.hasSubmenu ? (
                      <div>
                        <div className="flex rounded-lg overflow-hidden">
                          <NavLink item={item} isMobile />
                          <button
                            onClick={() => setActiveMobileSubmenu(
                              activeMobileSubmenu === item.name ? null : item.name
                            )}
                            className="w-14 py-4 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border-l border-border"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${activeMobileSubmenu === item.name ? 'rotate-180' : ''
                              }`} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {activeMobileSubmenu === item.name && item.submenu && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2 ml-6 space-y-2 bg-secondary rounded-lg p-4"
                            >
                              {item.submenu.map((brand) => (
                                <div key={brand.name}>
                                  <Link
                                    href={brand.href}
                                    onClick={() => {
                                      closeMobileMenu()
                                      setActiveMobileSubmenu(null)
                                    }}
                                    className="flex items-center py-3 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-all"
                                  >
                                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center mr-3">
                                      <BrandLogo brand={brand} />
                                    </div>
                                    <span className="font-medium">{brand.name}</span>
                                  </Link>

                                  {brand.subcategories && (
                                    <div className="ml-12 space-y-1">
                                      {brand.subcategories.map((subcat) => (
                                        <Link
                                          key={subcat.name}
                                          href={subcat.href}
                                          onClick={() => {
                                            closeMobileMenu()
                                            setActiveMobileSubmenu(null)
                                          }}
                                          className="block px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
                                        >
                                          • {subcat.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <NavLink item={item} isMobile />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 px-6 pb-8 relative z-10"
              >
                <div className="bg-surface-raised rounded-2xl p-6 border border-border shadow-xl">
                  <div className="text-center">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Phone className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-foreground font-bold text-lg mb-2">
                      ¿Necesitas ayuda?
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                      Contacta con nosotros para consultas sobre productos o pedidos
                    </p>

                    <div className="grid grid-cols-1 gap-3 mb-6">
                      <motion.div
                        className="flex items-center justify-center space-x-3 p-4 bg-secondary rounded-xl border border-border"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-foreground text-sm font-semibold">968 46 75 146</div>
                          <div className="text-muted-foreground text-xs">Llamadas y WhatsApp</div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="flex items-center justify-center space-x-3 p-4 bg-secondary rounded-xl border border-border"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MapPin className="w-5 h-5 text-success" />
                        <div>
                          <div className="text-foreground text-sm font-semibold">Murcia • Almería</div>
                          <div className="text-muted-foreground text-xs">Distribución especializada</div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/contacto"
                        onClick={closeMobileMenu}
                        className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          Contactar ahora
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </motion.div>

                    <div className="mt-6 pt-4 border-t border-border">
                      <motion.p
                        className="text-muted-foreground text-xs leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        Más de 35 años de excelencia marina
                      </motion.p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
    </div>
  )
}