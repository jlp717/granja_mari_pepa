'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, User, MapPin, Phone, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Productos', href: '/productos' },
  { name: 'Quiénes somos', href: '/acerca' },
  { name: 'Contacto', href: '/contacto' },
  { name: 'Área de clientes', href: '/area-clientes' }
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const { getTotalItems, toggleCart } = useCartStore();
  const { toast } = useToast();

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
    if (getTotalItems() > 0) {
      toast({
        title: "Carrito",
        description: `Tienes ${getTotalItems()} producto${getTotalItems() > 1 ? 's' : ''} en tu carrito`,
        duration: 3000,
      });
    }
  };

  const isHomePage = pathname === '/';

  return (
    <div className="relative">
      {/* Top Utility Bar */}
      <div className="bg-blue-600 text-white text-xs py-2">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <MapPin className="w-3 h-3 text-blue-200" />
              <span className="text-blue-50 font-medium">Murcia • Almería</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3 text-blue-200" />
              <span className="text-blue-50 font-medium">968 123 456</span>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-blue-100 font-semibold">Distribución especializada desde 1985</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`relative z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20'
            : isHomePage
            ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/10'
        }`}
        style={{
          borderBottom: isScrolled 
            ? '1px solid rgba(148, 163, 184, 0.1)' 
            : isHomePage 
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-32 lg:h-36">
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

                  {/* Responsive logo */}
                  <Image
                    src="/images/logo.jpeg"
                    alt="Granja Mari Pepa Logo"
                    width={240}
                    height={180}
                    className="object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-2xl relative z-10 
                               w-24 h-18 xs:w-32 xs:h-24 sm:w-40 sm:h-30 md:w-48 md:h-36 lg:w-56 lg:h-42 xl:w-60 xl:h-45"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto'
                    }}
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />

                  {/* Fallback logo */}
                  <div className="hidden w-24 h-18 xs:w-32 xs:h-24 sm:w-40 sm:h-30 md:w-48 md:h-36 lg:w-56 lg:h-42 xl:w-60 xl:h-45 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl drop-shadow-lg">G</span>
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl blur-md" />
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-lg group overflow-hidden ${
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
                  {/* Text */}
                  <span className="relative z-10 transition-all duration-300">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCartClick}
                  className={`relative h-12 w-12 rounded-xl transition-all duration-300 group ${
                    isScrolled
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'text-slate-700 hover:text-white hover:bg-blue-600'
                  }`}
                  aria-label={`Carrito de compras ${isHydrated && getTotalItems() > 0 ? `con ${getTotalItems()} productos` : 'vacío'}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                </Button>
                
                {isHydrated && getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[22px] h-[22px] flex items-center justify-center font-bold shadow-lg border-2 border-white z-10 animate-pulse">
                    <span className="animate-bounce">{getTotalItems()}</span>
                  </span>
                )}
              </div>

              {/* User Button */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link href="/area-clientes">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                      isScrolled
                        ? 'text-slate-300 hover:text-white hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-600 hover:shadow-2xl hover:shadow-slate-500/30'
                        : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:shadow-blue-500/40'
                    } focus-ring`}
                    aria-label="Área de clientes"
                  >
                    {/* Ripple effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-blue-400/30 transition-opacity duration-300" />
                    
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100 rounded-2xl" />
                    
                    <User className="w-6 h-6 relative z-10 group-hover:scale-125 transition-all duration-500 group-hover:drop-shadow-lg" />
                  </Button>
                </Link>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="md:hidden"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-14 w-14 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
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
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer - Pantalla completa */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[8000] bg-white">
            {/* Header del menú móvil con logo Mari Pepa */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/logo.jpeg"
                    alt="Mari Pepa"
                    width={48}
                    height={48}
                    className="object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mari Pepa</h3>
                  <p className="text-blue-100 text-sm">Del mar a tu mesa</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lista de navegación que ocupa el resto del espacio */}
            <div className="flex-1 py-6 h-full overflow-y-auto">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-6 py-5 text-lg font-medium transition-all duration-200 border-l-4 ${
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50 border-blue-600 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 border-transparent hover:border-blue-300'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center ${
                    pathname === item.href ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {index === 0 && <ShoppingBag className="w-5 h-5" />}
                    {index === 1 && <User className="w-5 h-5" />}
                    {index === 2 && <Phone className="w-5 h-5" />}
                    {index === 3 && <MapPin className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {index === 0 && 'Ver catálogo completo'}
                      {index === 1 && 'Conoce nuestra historia'}
                      {index === 2 && 'Ponte en contacto'}
                      {index === 3 && 'Accede a tu cuenta'}
                    </div>
                  </div>
                  {pathname === item.href && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              ))}

              {/* Espaciador para empujar el footer hacia abajo */}
              <div className="flex-1 min-h-[200px]"></div>

              {/* Información de contacto en la parte inferior */}
              <div className="mt-auto px-6 py-6 bg-gray-50 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center text-base text-gray-600">
                    <Phone className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="font-medium">968 123 456</span>
                  </div>
                  <div className="flex items-center text-base text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <span className="font-medium">Murcia • Almería</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-500 text-center">
                      Más de 35 años llevando la excelencia marina a tu negocio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </div>
  );
}