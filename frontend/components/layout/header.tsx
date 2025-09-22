'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingCart, User, Phone, MapPin, ChevronDown, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { CartDrawer } from '@/components/cart/cart-drawer'

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
    ]
  },
  { name: 'Quiénes somos', href: '/acerca' },
  { name: 'Contacto', href: '/contacto' }
]

const NAV_STYLES = {
  scrolled: {
    header: 'bg-slate-900/95 backdrop-blur-xl shadow-2xl',
    text: 'text-slate-300',
    activeText: 'text-white bg-gradient-to-r from-blue-600 to-blue-700',
    hoverText: 'hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600'
  },
  normal: {
    header: 'bg-white/95 backdrop-blur-xl shadow-xl',
    text: 'text-slate-700',
    activeText: 'text-white bg-gradient-to-r from-blue-600 to-blue-700',
    hoverText: 'hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700'
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
    const isActive = pathname === item.href || (item.hasSubmenu && pathname.startsWith('/productos'))

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
                ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-l-4 border-blue-300'
                : 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-800/60 hover:to-slate-700/60'
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
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-r-full"
              />
            )}

            {/* Ripple Effect Background */}
            <motion.div
              className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100"
              initial={false}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />

            {/* Content with micro-animation */}
            <span className="relative z-10 flex items-center gap-3">
              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
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
                  <ArrowRight className="w-4 h-4 text-blue-300" />
                </motion.div>
              )}
            </span>
          </Link>
        </motion.div>
      )
    }

    // Desktop version
    const baseClass = `px-4 py-3 xl:px-6 text-sm font-semibold transition-all duration-300 rounded-lg ${
      isActive ? styles.activeText : `${styles.text} ${styles.hoverText}`
    } hover:scale-105 focus-ring`

    return (
      <Link
        href={item.href}
        className={baseClass}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.name}
      </Link>
    )
  }

  const BrandLogo = ({ brand }: { brand: typeof NAVIGATION[0]['submenu'][0] }) => (
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
      {/* Top Utility Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs py-3 z-[60] h-12">
        <div className="absolute inset-0 bg-blue-700/95 backdrop-blur-md" />
        <div className="container mx-auto px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-200" />
              <span className="text-blue-50 font-semibold">Murcia • Almería</span>
            </div>
            <div className="flex items-center space-x-2 hidden sm:flex">
              <Phone className="w-4 h-4 text-blue-200" />
              <span className="text-blue-50 font-semibold">968 123 456</span>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
              <span className="text-white font-bold">✨ Distribución especializada desde 1985 ✨</span>
            </div>
          </div>
          <div className="hidden lg:block text-blue-100 font-medium opacity-90">
            Calidad Premium
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed top-12 left-0 right-0 z-50 transition-all duration-500 ${styles.header}`}>
        <div className={`absolute inset-0 ${isScrolled ? 'bg-slate-900/99' : 'bg-white/99'}`} />
        <nav className="container mx-auto px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="flex justify-between items-center h-20 sm:h-24 md:h-28 lg:h-32">
            {/* Logo */}
            <Link href="/" className="flex items-center focus-ring rounded-xl p-3 hover:scale-105 transition-transform">
              <Image
                src="/images/logo.jpeg"
                alt="Granja Mari Pepa"
                width={200}
                height={150}
                className="object-contain w-20 h-15 sm:w-24 sm:h-18 md:w-32 md:h-24 lg:w-40 lg:h-30 xl:w-48 xl:h-36"
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
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                            activeSubmenu === item.name ? 'rotate-180' : ''
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
                              className="absolute top-full right-0 mt-2 w-80 max-h-96 bg-white backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
                              onMouseEnter={() => setActiveSubmenu(item.name)}
                              onMouseLeave={() => setActiveSubmenu(null)}
                            >
                              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800">Nuestras Marcas</h3>
                              </div>

                              <div className="overflow-y-auto max-h-80 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                  {item.submenu.map((brand) => (
                                    <div key={brand.name} className="space-y-1">
                                      <Link
                                        href={brand.href}
                                        onClick={() => setActiveSubmenu(null)}
                                        className="flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 group border border-gray-100 hover:border-gray-200"
                                      >
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3 overflow-hidden group-hover:scale-110 transition-transform">
                                          <BrandLogo brand={brand} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
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
                                              className="block px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                            >
                                              • {subcat.name}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-200">
                                  <Link
                                    href="/productos"
                                    onClick={() => setActiveSubmenu(null)}
                                    className="flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
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
              {/* Cart Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCartClick}
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 ${
                    isScrolled ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-700 hover:text-white hover:bg-blue-600'
                  }`}
                  aria-label={`Carrito ${cartItemCount > 0 ? `con ${cartItemCount} productos` : 'vacío'}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>

                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[22px] h-[22px] flex items-center justify-center font-bold border-2 border-white shadow-lg animate-bounce-custom z-50 transform hover:scale-110 transition-all duration-300">
                    <span className="animate-pulse-custom">{cartItemCount}</span>
                  </span>
                )}
              </div>

              {/* User Button */}
              <Link href="/area-clientes" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 ${
                    isScrolled ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-700 hover:text-white hover:bg-blue-600'
                  }`}
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 ${
                  isScrolled ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-700 hover:text-white hover:bg-blue-600'
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <motion.div animate={{ rotate: isMobileMenuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              className="lg:hidden fixed inset-0 top-0 left-0 right-0 bottom-0 bg-slate-900 z-[9999] overflow-y-auto"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999
              }}
            >
              {/* Enhanced Header with Context */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/" onClick={closeMobileMenu}>
                    <Image
                      src="/images/logo.jpeg"
                      alt="Mari Pepa"
                      width={80}
                      height={60}
                      className="object-contain rounded-lg w-20 h-15"
                    />
                  </Link>
                  <motion.button
                    onClick={closeMobileMenu}
                    className="w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>

                {/* Current Page Context */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
                >
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium opacity-80">Estás en:</span>
                    <span className="text-base font-semibold">
                      {(() => {
                        // Handle specific routes first
                        if (pathname === '/') return 'Inicio';
                        if (pathname === '/productos') {
                          // Check for query parameters to show filtered results
                          if (typeof window !== 'undefined') {
                            const urlParams = new URLSearchParams(window.location.search);
                            const brand = urlParams.get('brand');
                            const category = urlParams.get('category');
                            if (brand && category) return `${brand} - ${category}`;
                            if (brand) return `Productos ${brand}`;
                            if (category) return `Categoría ${category}`;
                          }
                          return 'Productos';
                        }
                        if (pathname === '/acerca/') return 'Quiénes somos';
                        if (pathname === '/contacto/') return 'Contacto';
                        if (pathname === '/area-clientes/') return 'Área de clientes';
                        if (pathname === '/checkout/') return 'Checkout';
                        if (pathname.startsWith('/productos/')) return 'Detalle de producto';

                        // Handle other cases
                        if (pathname.startsWith('/admin')) return 'Panel de administración';
                        if (pathname.includes('404') || pathname.includes('error')) return 'Página de error';

                        // Fallback for unknown routes
                        const segments = pathname.split('/').filter(Boolean);
                        if (segments.length > 0) {
                          const lastSegment = segments[segments.length - 1];
                          return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
                        }

                        return 'Navegando...';
                      })()}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Navigation Items */}
              <div className="px-6 py-6 space-y-3 relative z-10">
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
                            className="w-14 py-4 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 border-l border-slate-700"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform ${
                              activeMobileSubmenu === item.name ? 'rotate-180' : ''
                            }`} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {activeMobileSubmenu === item.name && item.submenu && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden mt-2 ml-6 space-y-2 bg-slate-800/50 rounded-lg p-4"
                            >
                              {item.submenu.map((brand) => (
                                <div key={brand.name}>
                                  <Link
                                    href={brand.href}
                                    onClick={() => {
                                      closeMobileMenu()
                                      setActiveMobileSubmenu(null)
                                    }}
                                    className="flex items-center py-3 px-4 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                                  >
                                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center mr-3">
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
                                          className="block px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/30 rounded"
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
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
                  <div className="text-center">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Phone className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-white font-bold text-lg mb-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                      ¿Necesitas ayuda?
                    </h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      Contacta con nosotros para consultas sobre productos o pedidos
                    </p>

                    <div className="grid grid-cols-1 gap-3 mb-6">
                      <motion.div
                        className="flex items-center justify-center space-x-3 p-4 bg-slate-700/40 rounded-xl border border-slate-600/30 backdrop-blur-sm"
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(71, 85, 105, 0.6)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <Phone className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="text-white text-sm font-semibold">968 123 456</div>
                          <div className="text-slate-400 text-xs">Llamadas y WhatsApp</div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="flex items-center justify-center space-x-3 p-4 bg-slate-700/40 rounded-xl border border-slate-600/30 backdrop-blur-sm"
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(71, 85, 105, 0.6)" }}
                        transition={{ duration: 0.2 }}
                      >
                        <MapPin className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="text-white text-sm font-semibold">Murcia • Almería</div>
                          <div className="text-slate-400 text-xs">Distribución especializada</div>
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
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          Contactar ahora
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </motion.div>

                    <div className="mt-6 pt-4 border-t border-slate-600/30">
                      <motion.p
                        className="text-slate-400 text-xs leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        ✨ Más de 35 años de excelencia marina ✨
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