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
      {/* Top Utility Bar - Fixed */}
      <div className="fixed top-0 left-0 right-0 bg-blue-600/98 md:bg-blue-600 text-white text-xs py-2 z-[60] transition-all duration-300 backdrop-blur-sm">
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

      {/* Main Header - Fixed and positioned below utility bar */}
      <header
        className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? 'bg-slate-900/98 md:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20'
            : isHomePage
            ? 'bg-white/98 md:bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'bg-white/98 md:bg-white/95 backdrop-blur-xl shadow-lg shadow-black/10'
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

        {/* Mobile Navigation Overlay - Full-screen professional */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 z-[9999] bg-slate-900/98 backdrop-blur-2xl"
              style={{ height: '100vh', width: '100vw', top: 0, left: 0, position: 'fixed' }}
            >
              {/* Header del menú móvil - Solo logo minimalista */}
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center justify-between p-6 border-b border-white/10"
              >
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 group"
                >
                  <motion.div 
                    className="relative overflow-hidden rounded-2xl bg-white/10 p-2 backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src="/images/logo.jpeg"
                      alt="Logo"
                      width={40}
                      height={40}
                      className="object-cover rounded-xl transition-transform duration-300"
                    />
                  </motion.div>
                  <motion.div 
                    className="text-white"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="font-bold text-lg tracking-wide">Mari Pepa</div>
                  </motion.div>
                </Link>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </motion.div>

              {/* Contenido principal del menú scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center p-6">
                  {/* Lista de navegación moderna */}
                  <div className="space-y-4 mb-8">
                    {navigation.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.6, 
                          delay: index * 0.15,
                          type: "spring",
                          stiffness: 120,
                          damping: 20
                        }}
                      >
                        <Link
                          href={item.href}
                          className={`group flex items-center p-5 rounded-3xl border transition-all duration-300 transform hover:scale-105 ${
                            pathname === item.href
                              ? 'bg-gradient-to-r from-blue-600/30 to-blue-700/30 border-blue-400/50 text-blue-300 shadow-2xl shadow-blue-500/20 backdrop-blur-sm'
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-white/10 backdrop-blur-sm'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <motion.div 
                            className={`w-14 h-14 rounded-2xl mr-5 flex items-center justify-center transition-all duration-300 ${
                              pathname === item.href 
                                ? 'bg-blue-500/40 text-blue-200 shadow-lg shadow-blue-500/30' 
                                : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-lg'
                            }`}
                            whileHover={{ 
                              rotate: [0, -10, 10, 0],
                              transition: { duration: 0.5 }
                            }}
                          >
                            {index === 0 && <ShoppingBag className="w-7 h-7" />}
                            {index === 1 && <User className="w-7 h-7" />}
                            {index === 2 && <Phone className="w-7 h-7" />}
                            {index === 3 && <MapPin className="w-7 h-7" />}
                          </motion.div>
                          
                          <div className="flex-1">
                            <div className="font-bold text-xl mb-1 tracking-wide">
                              {item.name}
                            </div>
                            <div className={`text-sm transition-colors duration-300 ${
                              pathname === item.href ? 'text-blue-200/80' : 'text-white/60 group-hover:text-white/80'
                            }`}>
                              {index === 0 && 'Ver todo el catálogo'}
                              {index === 1 && 'Nuestra historia'}
                              {index === 2 && 'Ponte en contacto'}
                              {index === 3 && 'Área personal'}
                            </div>
                          </div>
                          
                          {pathname === item.href && (
                            <motion.div
                              layoutId="activeMobileIndicator"
                              className="w-4 h-4 bg-blue-400 rounded-full shadow-xl shadow-blue-400/50"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer con información de contacto */}
                  <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="mt-auto p-6 bg-gradient-to-r from-white/5 to-white/10 rounded-3xl border border-white/10 backdrop-blur-sm"
                  >
                    <div className="grid grid-cols-1 gap-4 text-center mb-4">
                      <motion.div 
                        className="flex items-center justify-center space-x-3 p-3 rounded-2xl bg-white/5"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">968 123 456</div>
                          <div className="text-white/60 text-sm">Llámanos ahora</div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center justify-center space-x-3 p-3 rounded-2xl bg-white/5"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-300" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">Murcia • Almería</div>
                          <div className="text-white/60 text-sm">Nuestras sedes</div>
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 text-center">
                      <p className="text-white/70 text-sm font-medium">
                        ✨ Más de 35 años de excelencia marina
                      </p>
                    </div>
                  </motion.div>
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