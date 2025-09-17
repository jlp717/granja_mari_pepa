'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingCart, User, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { useToast } from '@/hooks/use-toast';

const navigation = [
  { name: 'Inicio', href: '/' },
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
    <>
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
        className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
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
              
              <div className="hidden sm:block">
                <div className={`text-xl md:text-2xl font-bold transition-all duration-300 ${
                  isScrolled 
                    ? 'text-white drop-shadow-md' 
                    : 'text-slate-800'
                }`}>
                  <span className="inline-block transition-all duration-300 group-hover:text-blue-600">
                    Granja Mari Pepa
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  whileHover={{
                    scale: 1.05,
                    y: -2,
                    rotateX: 5,
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
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
                    {/* Magnetic particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(2)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100"
                          animate={{
                            x: [0, 10, -5, 8, 0],
                            y: [0, -8, 5, -10, 0],
                            scale: [0, 1, 0.5, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                          style={{
                            left: `${20 + i * 40}%`,
                            top: `${30 + i * 40}%`
                          }}
                        />
                      ))}
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg" />
                    
                    {/* Animated underline */}
                    <div className={`absolute bottom-0 left-1/2 h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 transition-all duration-300 transform -translate-x-1/2 rounded-full ${
                      pathname === item.href 
                        ? 'w-full opacity-100 shadow-lg shadow-blue-400/50' 
                        : 'w-0 group-hover:w-3/4 opacity-0 group-hover:opacity-100'
                    }`} />
                    
                    {/* Text */}
                    <span className="relative z-10 transition-all duration-300 group-hover:drop-shadow-md">
                      {item.name}
                    </span>

                    {/* Active indicator */}
                    {pathname === item.href && (
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-blue-400/50">
                        <motion.div 
                          className="w-full h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-ping absolute"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    )}

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCartClick}
                  className={`relative h-14 w-14 rounded-2xl transition-all duration-500 group ${
                    isScrolled
                      ? 'text-slate-300 hover:text-white hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-600 hover:shadow-2xl hover:shadow-slate-500/30'
                      : 'text-slate-700 hover:text-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:shadow-blue-500/40'
                  } focus-ring overflow-hidden`}
                  aria-label={`Carrito de compras ${isHydrated && getTotalItems() > 0 ? `con ${getTotalItems()} productos` : 'vacío'}`}
                >
                  {/* Ripple effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping bg-blue-400/30 transition-opacity duration-300" />
                  
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-0 group-hover:scale-100 rounded-2xl" />
                  
                  <ShoppingCart className="w-6 h-6 relative z-10 group-hover:scale-125 transition-all duration-500 group-hover:drop-shadow-lg" />
                  
                  {isHydrated && getTotalItems() > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-2xl ring-3 ring-white"
                    >
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {getTotalItems()}
                      </motion.span>
                    </motion.span>
                  )}
                </Button>
              </motion.div>

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

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl"
            >
              <div className="px-6 py-8 space-y-3">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={item.href}
                      className={`relative block py-4 px-6 text-base font-semibold rounded-lg transition-all duration-300 min-h-[56px] flex items-center group overflow-hidden ${
                        pathname === item.href
                          ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/25 transform scale-105'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 hover:scale-105'
                      } focus-ring`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      
                      {/* Text with icon */}
                      <span className="relative z-10 flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          pathname === item.href 
                            ? 'bg-white shadow-lg' 
                            : 'bg-slate-500 group-hover:bg-blue-400'
                        }`} />
                        {item.name}
                      </span>

                      {/* Active indicator */}
                      {pathname === item.href && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}

                      {/* Hover effect */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-blue-500/5 transition-opacity duration-300" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer />
    </>
  );
}