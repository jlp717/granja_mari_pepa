'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShoppingCart, User, Phone, Mail, ChevronDown, ShoppingBag, MapPin, Home, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { brands } from '@/lib/data';

// Estructura de navegación con subsecciones
const navigation = [
  { 
    name: 'Productos', 
    href: '/productos',
    hasSubmenu: true,
    submenu: [
      {
        name: 'Grupo Topgel',
        brandId: 'grupo-topgel',
        href: '/productos?brand=grupo-topgel',
        color: 'blue',
        subcategories: [
          { name: 'Productos del mar', href: '/productos?brand=grupo-topgel&category=mar', categoryId: 'mar' },
          { name: 'Carne', href: '/productos?brand=grupo-topgel&category=carne', categoryId: 'carne' },
          { name: 'Precocinados', href: '/productos?brand=grupo-topgel&category=precocinados', categoryId: 'precocinados' },
          { name: 'Repostería', href: '/productos?brand=grupo-topgel&category=reposteria', categoryId: 'reposteria' }
        ]
      },
      {
        name: 'Nestlé',
        brandId: 'nestle',
        href: '/productos?brand=nestle',
        color: 'red',
        subcategories: [
          { name: 'Lácteos', href: '/productos?brand=nestle&category=lacteos', categoryId: 'lacteos' },
          { name: 'Cereales', href: '/productos?brand=nestle&category=cereales', categoryId: 'cereales' },
          { name: 'Chocolate', href: '/productos?brand=nestle&category=chocolate', categoryId: 'chocolate' }
        ]
      },
      {
        name: 'Panamar',
        brandId: 'panamar',
        href: '/productos?brand=panamar',
        color: 'cyan',
        subcategories: [
          { name: 'Pescado Fresco', href: '/productos?brand=panamar&category=pescado-fresco', categoryId: 'pescado-fresco' },
          { name: 'Mariscos', href: '/productos?brand=panamar&category=mariscos', categoryId: 'mariscos' }
        ]
      },
      {
        name: 'Okin',
        brandId: 'okin',
        href: '/productos?brand=okin',
        color: 'amber',
        subcategories: [
          { name: 'Carne Fresca', href: '/productos?brand=okin&category=carne-fresca', categoryId: 'carne-fresca' },
          { name: 'Embutidos', href: '/productos?brand=okin&category=embutidos', categoryId: 'embutidos' }
        ]
      },
      {
        name: 'Pastelería Amparín',
        brandId: 'amparin',
        href: '/productos?brand=amparin',
        color: 'pink',
        subcategories: [
          { name: 'Tartas', href: '/productos?brand=amparin&category=tartas', categoryId: 'tartas' },
          { name: 'Bollería', href: '/productos?brand=amparin&category=bolleria', categoryId: 'bolleria' }
        ]
      }
    ]
  },
  { name: 'Quiénes somos', href: '/acerca' },
  { name: 'Contacto', href: '/contacto' }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalItems, toggleCart } = useCartStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Efecto para manejar el scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  const handleCartClick = () => {
    toggleCart();
  };

  const isHomePage = pathname === '/';

  return (
    <div className="relative">
      {/* Top Utility Bar - Fixed with proper margins and padding */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 text-white text-xs py-3 z-[60] transition-all duration-300 shadow-xl shadow-blue-900/30 border-b border-blue-500/20">
        <div className="container mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-200 drop-shadow-lg" />
              <span className="text-blue-50 font-semibold tracking-wide">Murcia • Almería</span>
            </div>
            <div className="flex items-center space-x-2 hidden sm:flex">
              <Phone className="w-4 h-4 text-blue-200 drop-shadow-lg" />
              <span className="text-blue-50 font-semibold tracking-wide">968 123 456</span>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
              <span className="text-white font-bold tracking-wide drop-shadow-lg">✨ Distribución especializada desde 1985 ✨</span>
            </div>
          </div>
          <div className="hidden lg:block text-blue-100 font-medium">
            <span className="opacity-90">Calidad Premium</span>
          </div>
        </div>
      </div>

      {/* Main Header - Fixed and positioned below utility bar with enhanced shadow */}
      <header
        className={`fixed top-12 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/40 border-b border-slate-700/50'
            : isHomePage
            ? 'bg-white/95 backdrop-blur-xl shadow-xl shadow-black/10 border-b border-gray-200/50'
            : 'bg-white/95 backdrop-blur-xl shadow-xl shadow-black/15 border-b border-gray-200/60'
        }`}
      >
        <nav className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36">
            {/* Logo and Brand */}
            <Link 
              href="/" 
              className="flex items-center space-x-4 focus-ring rounded-xl p-3 transition-all duration-300 hover:scale-105 group"
            >
              {/* Logo - SÚPER PROMINENTE RESPONSIVO */}
              <div className="relative flex-shrink-0 transition-all duration-300 group-hover:scale-110">
                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400/60 rounded-full hidden sm:block"
                      animate={{
                        x: [0, 20, -10, 15, 0],
                        y: [0, -15, 10, -20, 0],
                        opacity: [0.6, 1, 0.4, 1, 0.6],
                        scale: [1, 1.5, 0.8, 1.2, 1]
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.8
                      }}
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`
                      }}
                    />
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                  {/* Breathing effect background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-400/10 to-blue-600/10 rounded-xl hidden sm:block"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Responsive logo - OPTIMIZADO PARA MÓVILES */}
                  <Image
                    src="/images/logo.jpeg"
                    alt="Granja Mari Pepa - Logo oficial de distribución alimentaria"
                    width={240}
                    height={180}
                    className="object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-2xl relative z-10 
                               w-16 h-12 xs:w-20 xs:h-15 sm:w-24 sm:h-18 md:w-32 md:h-24 lg:w-40 lg:h-30 xl:w-48 xl:h-36"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />

                  {/* Fallback logo - OPTIMIZADO PARA MÓVILES */}
                  <div className="hidden w-16 h-12 xs:w-20 xs:h-15 sm:w-24 sm:h-18 md:w-32 md:h-24 lg:w-40 lg:h-30 xl:w-48 xl:h-36 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center" role="img" aria-label="Granja Mari Pepa - Logotipo alternativo">
                    <span className="text-white font-bold text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl drop-shadow-lg" aria-hidden="true">G</span>
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl blur-md" />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - MEJORADA RESPONSIVIDAD */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 relative">
              {navigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.hasSubmenu ? (
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={`relative px-3 py-2 lg:px-4 lg:py-3 xl:px-6 xl:py-3 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-lg group overflow-hidden ${
                          pathname === item.href || (item.hasSubmenu && pathname.startsWith('/productos'))
                            ? isScrolled
                              ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl shadow-blue-500/30 scale-105'
                              : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl shadow-blue-500/30 scale-105'
                            : isScrolled
                            ? 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:scale-105'
                            : 'text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30'
                        } focus-ring`}
                        aria-current={pathname === item.href ? 'page' : undefined}
                      >
                        <span className="relative z-10 transition-all duration-300">
                          {item.name}
                        </span>
                      </Link>
                      
                      {/* Flecha separada solo para el hover del dropdown */}
                      <div
                        className="relative"
                        onMouseEnter={() => setActiveSubmenu(item.name)}
                        onMouseLeave={() => setActiveSubmenu(null)}
                      >
                        <button
                          className={`p-1.5 lg:p-2 ml-1 transition-all duration-300 rounded-lg ${
                            isScrolled ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-blue-600'
                          }`}
                          aria-label="Abrir menú de productos"
                          aria-expanded={activeSubmenu === item.name}
                          aria-haspopup="true"
                        >
                          <ChevronDown 
                            className={`w-3 h-3 lg:w-4 lg:h-4 transition-transform duration-300 ${
                              activeSubmenu === item.name ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Submenu Dropdown - Más compacto y con scroll interno */}
                        {item.hasSubmenu && item.submenu && (
                          <AnimatePresence>
                            {activeSubmenu === item.name && (
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full right-0 mt-2 w-80 max-h-96 bg-white backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
                                onMouseEnter={() => setActiveSubmenu(item.name)}
                                onMouseLeave={() => setActiveSubmenu(null)}
                              >
                                {/* Header del dropdown */}
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-800">
                                      Nuestras Marcas
                                    </h3>
                                    <button
                                      onClick={() => setActiveSubmenu(null)}
                                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Contenido con scroll interno */}
                                <div className="overflow-y-auto max-h-80 p-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    {item.submenu.map((brand) => (
                                      <div key={brand.name} className="space-y-1">
                                        <Link
                                          href={brand.href}
                                          onClick={() => setActiveSubmenu(null)}
                                          className="flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 group border border-gray-100 hover:border-gray-200 hover:shadow-md"
                                        >
                                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3 overflow-hidden group-hover:scale-110 transition-transform duration-200">
                                            <Image
                                              src={`/images/logo-${
                                                brand.name === 'Grupo Topgel' ? 'gtg' :
                                                brand.name === 'Nestlé' ? 'nestle' :
                                                brand.name === 'Panamar' ? 'panamar' :
                                                brand.name === 'Okin' ? 'okin' :
                                                brand.name === 'Pastelería Amparín' ? 'pamparin' :
                                                'gtg'
                                              }.png`}
                                              alt={brand.name}
                                              width={28}
                                              height={28}
                                              style={{ width: 'auto', height: 'auto' }}
                                              className="object-contain max-w-full max-h-full"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-200 block truncate">
                                              {brand.name}
                                            </span>
                                          </div>
                                        </Link>
                                        
                                        {/* Subcategorías más compactas en columnas */}
                                        {brand.subcategories && (
                                          <div className="ml-2 space-y-0.5">
                                            {brand.subcategories.map((subcat) => (
                                              <Link
                                                key={subcat.name}
                                                href={subcat.href}
                                                onClick={() => setActiveSubmenu(null)}
                                                className="block px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-150 truncate"
                                              >
                                                • {subcat.name}
                                              </Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Footer del dropdown */}
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <Link
                                      href="/productos"
                                      onClick={() => setActiveSubmenu(null)}
                                      className="flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                                    >
                                      Ver todos los productos
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`relative px-3 py-2 lg:px-4 lg:py-3 xl:px-6 xl:py-3 text-xs lg:text-sm font-semibold transition-all duration-300 rounded-lg group overflow-hidden ${
                        pathname === item.href
                          ? isScrolled
                            ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl shadow-blue-500/30 scale-105'
                            : 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl shadow-blue-500/30 scale-105'
                          : isScrolled
                          ? 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:scale-105'
                          : 'text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30'
                      } focus-ring`}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      <span className="relative z-10 transition-all duration-300">
                        {item.name}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right Controls - MEJORADA RESPONSIVIDAD */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Cart Button - RESPONSIVO */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCartClick}
                  className={`relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl transition-all duration-300 group ${
                    isScrolled
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'text-slate-700 hover:text-white hover:bg-blue-600'
                  }`}
                  aria-label={`Carrito de compras ${isHydrated && getTotalItems() > 0 ? `con ${getTotalItems()} productos` : 'vacío'}`}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                </Button>
                
                {isHydrated && getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] sm:min-w-[22px] sm:h-[22px] flex items-center justify-center font-bold shadow-lg border-2 border-white z-10 animate-pulse">
                    <span className="animate-bounce text-xs">{getTotalItems()}</span>
                  </span>
                )}
              </div>

              {/* User Button - SOLO ICONO */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="hidden sm:block"
              >
                <Link href="/area-clientes">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                      isScrolled
                        ? 'text-slate-300 hover:text-white hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-600 hover:shadow-2xl hover:shadow-slate-500/30'
                        : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-emerald-600 hover:to-cyan-600 hover:shadow-2xl hover:shadow-emerald-400/40'
                    } focus-ring`}
                    aria-label="Área de clientes"
                    title="Área de clientes"
                  >
                    {/* Enhanced ripple effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-emerald-400/40 transition-opacity duration-300" />
                    
                    {/* Enhanced gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-cyan-400/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100 rounded-2xl" />
                    
                    {/* Subtle border glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-all duration-500" style={{
                      backgroundClip: 'padding-box',
                      border: '2px solid transparent'
                    }} />
                    
                    <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 relative z-10 group-hover:scale-125 transition-all duration-500 group-hover:drop-shadow-lg" aria-hidden="true" />
                  </Button>
                </Link>
              </motion.div>

              {/* Mobile Menu Button - MEJORADO PARA TABLETS */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="lg:hidden"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                    isScrolled
                      ? 'text-slate-300 hover:text-white hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-600'
                      : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700'
                  } focus-ring`}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Abrir menú de navegación"
                  aria-expanded={isMobileMenuOpen}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100 rounded-2xl" />
                  
                  <motion.div 
                    className="relative z-10"
                    animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation - PANTALLA COMPLETA MEJORADO */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:hidden fixed inset-0 bg-slate-900 z-[1000] overflow-hidden"
            >
              {/* Header del menú mejorado con más separación */}
              <div className="bg-blue-600 px-6 py-8 flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src="/images/logo.jpeg"
                    alt="Mari Pepa"
                    width={56}
                    height={56}
                    className="object-contain rounded-lg w-14 h-14"
                    style={{ width: 'auto', height: 'auto', maxWidth: '56px', maxHeight: '56px' }}
                  />
                </Link>
                
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-12 h-12 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Contenido del menú con scroll */}
              <div className="h-full overflow-y-auto pb-4">
                <div className="px-6 py-6 space-y-3">
                  {navigation.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      {item.hasSubmenu ? (
                        <div>
                          {/* Productos con flecha integrada */}
                          <div className="flex rounded-lg overflow-hidden">
                            {/* Enlace principal de Productos */}
                            <Link
                              href={item.href}
                              className={`relative flex-1 py-4 px-6 text-base font-semibold transition-all duration-300 min-h-[56px] flex items-center group overflow-hidden ${
                                pathname === item.href
                                  ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/25'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              <span className="relative z-10 flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  pathname === item.href
                                    ? 'bg-white shadow-lg' 
                                    : 'bg-slate-500 group-hover:bg-blue-400'
                                }`} />
                                {item.name}
                              </span>

                              {pathname === item.href && (
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                              )}
                            </Link>

                            {/* Flecha para expandir submenu */}
                            <button
                              onClick={() => setActiveMobileSubmenu(
                                activeMobileSubmenu === item.name ? null : item.name
                              )}
                              className="w-14 py-4 flex items-center justify-center transition-all duration-300 text-slate-400 hover:text-white hover:bg-slate-800/50 border-l border-slate-700"
                            >
                              <ChevronDown
                                className={`w-5 h-5 transition-transform duration-300 ${
                                  activeMobileSubmenu === item.name ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Submenu expandible */}
                          <AnimatePresence>
                            {activeMobileSubmenu === item.name && item.submenu && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden mt-2 ml-6 space-y-2 bg-slate-800/50 rounded-lg p-4"
                              >
                                {item.submenu.map((brand) => (
                                  <div key={brand.name}>
                                    <Link
                                      href={brand.href}
                                      onClick={() => {
                                        setIsMobileMenuOpen(false)
                                        setActiveMobileSubmenu(null)
                                      }}
                                      className="flex items-center py-3 px-4 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                    >
                                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center mr-3 overflow-hidden">
                                        <Image
                                          src={`/images/logo-${
                                            brand.name === 'Grupo Topgel' ? 'gtg' :
                                            brand.name === 'Nestlé' ? 'nestle' :
                                            brand.name === 'Panamar' ? 'panamar' :
                                            brand.name === 'Okin' ? 'okin' :
                                            brand.name === 'Pastelería Amparín' ? 'pamparin' :
                                            'gtg'
                                          }.png`}
                                          alt={brand.name}
                                          width={32}
                                          height={32}
                                          className="object-contain max-w-full max-h-full"
                                          style={{ width: 'auto', height: 'auto' }}
                                        />
                                      </div>
                                      <div>
                                        <div className="font-medium">{brand.name}</div>
                                      </div>
                                    </Link>
                                    
                                    {/* Subcategorías */}
                                    {brand.subcategories && (
                                      <div className="ml-12 space-y-1 mt-2">
                                        {brand.subcategories.map((subcat) => (
                                          <Link
                                            key={subcat.name}
                                            href={subcat.href}
                                            onClick={() => {
                                              setIsMobileMenuOpen(false)
                                              setActiveMobileSubmenu(null)
                                            }}
                                            className="block px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/30 rounded transition-all duration-150"
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
                        /* Item simple sin submenu */
                        <Link
                          href={item.href}
                          className={`relative block py-4 px-6 text-base font-semibold rounded-lg transition-all duration-300 min-h-[56px] flex items-center group overflow-hidden ${
                            pathname === item.href
                              ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/25'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                          
                          <span className="relative z-10 flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              pathname === item.href 
                                ? 'bg-white shadow-lg' 
                                : 'bg-slate-500 group-hover:bg-blue-400'
                            }`} />
                            {item.name}
                          </span>

                          {pathname === item.href && (
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          )}

                          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-blue-500/5 transition-opacity duration-300" />
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Footer informativo del menú */}
                <div className="mt-8 px-6 pb-6">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600 flex items-center justify-center">
                        <Phone className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">¿Necesitas ayuda?</h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Contacta con nosotros para consultas sobre productos o pedidos
                      </p>
                      
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        <div className="flex items-center justify-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                          <Phone className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-white text-sm font-medium">968 123 456</div>
                            <div className="text-slate-400 text-xs">Llamadas y WhatsApp</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <div>
                            <div className="text-white text-sm font-medium">Murcia • Almería</div>
                            <div className="text-slate-400 text-xs">Distribución especializada</div>
                          </div>
                        </div>
                      </div>
                      
                      <Link 
                        href="/contacto"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-300"
                      >
                        Contactar ahora
                      </Link>
                      
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-slate-400 text-xs">
                          ✨ Más de 35 años de excelencia marina
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
    </div>
  );
}