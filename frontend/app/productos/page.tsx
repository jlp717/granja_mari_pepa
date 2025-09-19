'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Grid, List, Search, ChevronDown, Star, Zap, Clock, TrendingUp, Award, Sparkles } from 'lucide-react';
import { products, productCategories, brands } from '@/lib/data';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Deterministic particle data for products page
const PRODUCTS_PARTICLES = [
  { width: 4.2, height: 5.8, left: 15, top: 22, color: 0, duration: 9.5, delay: 0.8 },
  { width: 6.1, height: 3.7, left: 67, top: 78, color: 1, duration: 11.2, delay: 2.3 },
  { width: 5.3, height: 7.2, left: 34, top: 45, color: 2, duration: 8.7, delay: 1.1 },
  { width: 3.8, height: 4.9, left: 82, top: 19, color: 0, duration: 10.8, delay: 3.2 },
  { width: 7.4, height: 5.1, left: 28, top: 66, color: 1, duration: 9.3, delay: 0.5 },
  { width: 4.7, height: 6.3, left: 73, top: 33, color: 2, duration: 12.1, delay: 1.7 },
  { width: 5.9, height: 3.4, left: 51, top: 87, color: 0, duration: 8.9, delay: 2.8 },
  { width: 3.6, height: 8.1, left: 9, top: 54, color: 1, duration: 11.7, delay: 0.3 },
  { width: 6.8, height: 4.5, left: 88, top: 41, color: 2, duration: 9.8, delay: 1.9 },
  { width: 4.1, height: 5.7, left: 42, top: 73, color: 0, duration: 10.4, delay: 3.5 },
  { width: 7.2, height: 3.9, left: 76, top: 16, color: 1, duration: 8.6, delay: 1.4 },
  { width: 5.5, height: 6.7, left: 23, top: 59, color: 2, duration: 11.9, delay: 0.7 },
  { width: 3.3, height: 4.8, left: 65, top: 84, color: 0, duration: 9.1, delay: 2.6 },
  { width: 8.7, height: 5.2, left: 31, top: 27, color: 1, duration: 10.7, delay: 0.1 },
  { width: 4.4, height: 7.6, left: 79, top: 62, color: 2, duration: 8.5, delay: 1.8 }
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [showFilters, setShowFilters] = useState(true);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync price inputs with slider
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
  }, [priceRange]);

  // Leer parámetros de URL al cargar la página
  useEffect(() => {
    const brandParam = searchParams?.get('brand');
    const categoryParam = searchParams?.get('category');
    
    if (brandParam && brandParam !== selectedBrand) {
      setSelectedBrand(brandParam);
    }
    
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Professional animations
  useEffect(() => {
    if (!headerRef.current || !gridRef.current) return;

    const tl = gsap.timeline();

    tl.fromTo(headerRef.current, {
      opacity: 0,
      y: -50
    }, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out'
    })
    .fromTo(filtersRef.current, {
      opacity: 0,
      x: -100
    }, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.8')
    .fromTo(gridRef.current.children, {
      opacity: 0,
      y: 60,
      scale: 0.9
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'backOut'
    }, '-=0.4');

    return () => {
      tl.kill();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesDiscount = !showDiscounted || product.discount;
      const matchesStock = !showInStock || product.inStock;
      const matchesFeatured = !showFeatured || product.featured;
      const matchesNew = !showNew || product.id === '1' || product.id === '3'; // Mock new products

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesDiscount && matchesStock && matchesFeatured && matchesNew;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        case 'discount':
          return (b.discount || 0) - (a.discount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedBrand, priceRange, showDiscounted, showInStock, showFeatured, showNew, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, productsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setIsPageChanging(true);
    const timer = setTimeout(() => setIsPageChanging(false), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedBrand, priceRange, showDiscounted, showInStock, showFeatured, showNew, sortBy]);

  // Handle filters visibility on scroll
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          // Hide filters when approaching footer (last 500px of page) to avoid overlap
          const hideThreshold = documentHeight - windowHeight - 500;
          const shouldShow = scrollPosition < hideThreshold; // Show from page load, hide near footer
          setShowFilters(shouldShow);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check - show filters on page load
    setShowFilters(true);
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-bold text-white mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mr-2 animate-pulse"></div>
          Categoría
        </h3>
        <div className="space-y-2">
          <motion.div 
            className="flex items-center space-x-3 group cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <Checkbox
              id="category-all"
              checked={selectedCategory === 'all'}
              onCheckedChange={() => setSelectedCategory('all')}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500 border-amber-400/50"
            />
            <label htmlFor="category-all" className="text-amber-100 group-hover:text-white transition-colors cursor-pointer">
              Todas las categorías
            </label>
          </motion.div>
          {productCategories.map((category, index) => (
            <motion.div 
              key={category.id}
              className="flex items-center space-x-3 group cursor-pointer"
              whileHover={{ x: 5 }}
              transition={{ delay: index * 0.05 }}
            >
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategory === category.id}
                onCheckedChange={() => setSelectedCategory(category.id)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500 border-amber-400/50"
              />
              <span className="text-xl mr-2">{category.icon}</span>
              <label htmlFor={`category-${category.id}`} className="text-amber-100 group-hover:text-white transition-colors cursor-pointer">
                {category.name}
              </label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Brand Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="font-bold text-white mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-2 animate-pulse"></div>
          Marcas
        </h3>
        <div className="space-y-2">
          <motion.div 
            className="flex items-center space-x-3 group cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <Checkbox
              id="brand-all"
              checked={selectedBrand === 'all'}
              onCheckedChange={() => setSelectedBrand('all')}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 border-purple-400/50"
            />
            <label htmlFor="brand-all" className="text-purple-100 group-hover:text-white transition-colors cursor-pointer">
              Todas las marcas
            </label>
          </motion.div>
          {brands.map((brand, index) => (
            <motion.div 
              key={brand.id}
              className="flex items-center space-x-3 group cursor-pointer"
              whileHover={{ x: 5 }}
              transition={{ delay: index * 0.05 }}
            >
              <Checkbox
                id={`brand-${brand.id}`}
                checked={selectedBrand === brand.id}
                onCheckedChange={() => setSelectedBrand(brand.id)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 border-purple-400/50"
              />
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                    brand.color === 'blue' ? 'from-blue-400 to-blue-600' :
                    brand.color === 'red' ? 'from-red-400 to-red-600' :
                    brand.color === 'cyan' ? 'from-cyan-400 to-cyan-600' :
                    brand.color === 'amber' ? 'from-amber-400 to-amber-600' :
                    brand.color === 'pink' ? 'from-pink-400 to-pink-600' :
                    'from-gray-400 to-gray-600'
                  }`}
                />
                <label htmlFor={`brand-${brand.id}`} className="text-purple-100 group-hover:text-white transition-colors cursor-pointer font-medium">
                  {brand.name}
                </label>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Price Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-amber-500/20"
      >
        <h3 className="font-bold text-white mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full mr-2 animate-pulse"></div>
          Rango de Precio
        </h3>
        <div className="space-y-3">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={50}
            step={0.5}
            className="mb-3 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:border-0"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-amber-300 text-sm block mb-1">Mínimo</label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="bg-black/20 border-amber-500/30 text-white placeholder-amber-300/50 focus:border-amber-400"
                min={0}
                max={50}
              />
            </div>
            <div>
              <label className="text-amber-300 text-sm block mb-1">Máximo</label>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="bg-black/20 border-amber-500/30 text-white placeholder-amber-300/50 focus:border-amber-400"
                min={0}
                max={50}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm text-amber-300">
            <span>{priceRange[0]}€</span>
            <span>{priceRange[1]}€</span>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-bold text-white mb-3 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-2 animate-pulse"></div>
          Filtros Avanzados
        </h3>
        <div className="space-y-2">
          {[
            { id: 'discounted', label: 'Con descuento', icon: '💥', checked: showDiscounted, onChange: setShowDiscounted },
            { id: 'in-stock', label: 'Disponible ahora', icon: '✅', checked: showInStock, onChange: setShowInStock },
            { id: 'featured', label: 'Productos destacados', icon: '⭐', checked: showFeatured, onChange: setShowFeatured },
            { id: 'new', label: 'Novedades', icon: '🆕', checked: showNew, onChange: setShowNew }
          ].map((filter, index) => (
            <motion.div
              key={filter.id}
              className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer"
              whileHover={{ scale: 1.02, x: 5 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => filter.onChange(!filter.checked)}
            >
              <Checkbox
                id={filter.id}
                checked={filter.checked}
                onCheckedChange={(checked) => filter.onChange(checked === true)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 border-purple-400/50"
              />
              <span className="text-lg">{filter.icon}</span>
              <label htmlFor={filter.id} className="text-purple-100 group-hover:text-white transition-colors cursor-pointer font-medium">
                {filter.label}
              </label>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div 
      className="min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-32 relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            #0c0a1e 0%, 
            #1a1b3a 25%, 
            #2d1b69 50%, 
            #1a1b3a 75%, 
            #0c0a1e 100%
          )
        `
      }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles with deterministic values */}
        {PRODUCTS_PARTICLES.map((particle, i) => (
          <div
            key={`products-particle-${i}`}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              background: `rgba(${particle.color === 0 ? '59, 130, 246' : particle.color === 1 ? '147, 51, 234' : '16, 185, 129'}, 0.8)`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              animation: `float-products-${i % 3} ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 pt-4 pb-2 sm:pb-4 lg:pb-6 relative z-10">
        <div className="flex flex-col 2xl:flex-row gap-6 lg:gap-8 items-start max-w-[1600px] mx-auto">
          {/* Spacer for fixed sidebar on desktop */}
          <div className="hidden 2xl:block w-80 flex-shrink-0"></div>
          
          {/* Desktop Sidebar - MEJOR POSICIONAMIENTO */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                ref={filtersRef}
                className="hidden 2xl:block w-80 fixed z-30"
                style={{ 
                  left: 'max(1rem, calc((100vw - 1600px) / 3 + 1rem))',
                  top: '260px',
                  height: 'calc(100vh - 00px)',
                  maxHeight: '770px',
                  minHeight: '650px'
                }}
                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.23, 1, 0.32, 1] 
                }}
              >
                <div 
                  className="rounded-3xl p-6 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden h-full"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(10, 10, 26, 0.9) 0%, 
                        rgba(26, 10, 46, 0.9) 50%, 
                        rgba(42, 24, 16, 0.9) 100%
                      )
                    `
                  }}
                >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-amber-400 opacity-100" />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  Filtros
                </span>
              </h2>
              <div 
                className="overflow-y-auto overflow-x-hidden pr-2"
                style={{
                  height: 'calc(100% - 60px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
                }}
              >
                <FilterContent />
              </div>
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 2xl:ml-6 max-w-none w-full">
            {/* Header Section - Aligned with content below */}
            <motion.div
              ref={headerRef}
              className="mb-4 sm:mb-6 text-center"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-2 sm:mb-3">
                <span className="bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                  NUESTROS
                </span>
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  PRODUCTOS
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-200/80 max-w-4xl mx-auto leading-relaxed px-4 mb-6">
                Descubre toda nuestra gama de productos alimentarios de 
                <span className="text-cyan-300 font-semibold"> primera calidad</span> y 
                <span className="text-purple-300 font-semibold"> sabores excepcionales</span>
              </p>
            </motion.div>
            {/* Search and Controls Bar - ULTRA RESPONSIVO */}
            <motion.div 
              className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-xl border border-white/10 shadow-xl relative z-20 mx-auto"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.1) 0%, 
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex flex-col gap-4 lg:gap-6">
                {/* Search Bar */}
                <div className="w-full max-w-2xl mx-auto lg:mx-0">
                  <div className="relative group">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4 sm:w-5 sm:h-5 group-hover:text-blue-200 transition-colors opacity-100" />
                    <Input
                      placeholder="Buscar productos deliciosos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-black/20 border-blue-400/30 text-white placeholder-blue-300/70 focus:border-blue-300 text-sm sm:text-lg rounded-xl sm:rounded-2xl"
                    />
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Left Controls */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Mobile Filter Button */}
                    <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="2xl:hidden bg-purple-600/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30 hover:text-white flex-1 sm:flex-none"
                        >
                          <Filter className="w-4 h-4 mr-2 text-purple-200 opacity-100" />
                          Filtros
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-full sm:w-96 p-0 border-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto">
                        <div 
                          className="h-full p-4 sm:p-8 overflow-y-auto"
                          style={{
                            background: `
                              linear-gradient(135deg, 
                                rgba(10, 10, 26, 0.95) 0%, 
                                rgba(26, 10, 46, 0.95) 50%, 
                                rgba(42, 24, 16, 0.95) 100%
                              )
                            `
                          }}
                        >
                          <SheetHeader className="mb-8">
                            <SheetTitle className="flex items-center text-xl sm:text-2xl text-white">
                              <Filter className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-amber-400 opacity-100" />
                              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                                Filtros
                              </span>
                            </SheetTitle>
                          </SheetHeader>
                          <FilterContent />
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Sort Selector */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-64 bg-cyan-600/20 border-cyan-400/30 text-cyan-200 focus:border-cyan-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl border-cyan-400/30">
                        <SelectItem value="featured" className="text-cyan-200 focus:bg-cyan-600/20">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-2 text-yellow-400 opacity-100" />
                            Destacados
                          </div>
                        </SelectItem>
                        <SelectItem value="name" className="text-cyan-200 focus:bg-cyan-600/20">
                          <div className="flex items-center">
                            <Award className="w-4 h-4 mr-2 text-blue-400 opacity-100" />
                            Nombre A-Z
                          </div>
                        </SelectItem>
                        <SelectItem value="price-low" className="text-cyan-200 focus:bg-cyan-600/20">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-green-400 opacity-100" />
                            Precio: Menor a Mayor
                          </div>
                        </SelectItem>
                        <SelectItem value="price-high" className="text-cyan-200 focus:bg-cyan-600/20">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 rotate-180 text-red-400 opacity-100" />
                            Precio: Mayor a Menor
                          </div>
                        </SelectItem>
                        <SelectItem value="discount" className="text-cyan-200 focus:bg-cyan-600/20">
                          <div className="flex items-center">
                            <Zap className="w-4 h-4 mr-2 text-orange-400 opacity-100" />
                            Mayor Descuento
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Right Controls - View Mode */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Grid className="w-4 h-4 text-white opacity-100" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <List className="w-4 h-4 text-white opacity-100" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats and Pagination Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 gap-4">
                <div className="text-blue-200/80 flex items-center gap-3 flex-wrap">
                  <span className="text-white text-sm sm:text-base">
                    Mostrando {Math.min(paginatedProducts.length, productsPerPage)} productos
                  </span>
                  <span className="text-gray-400 hidden sm:inline">|</span>
                  <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full text-cyan-200 font-semibold text-xs sm:text-sm">
                    {filteredProducts.length} totales
                  </span>
                  {selectedCategory !== 'all' && (
                    <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs sm:text-sm border border-purple-400/30">
                      {productCategories.find(cat => cat.id === selectedCategory)?.name}
                    </span>
                  )}
                </div>
                
                {/* Pagination Controls - RESPONSIVE */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 sm:gap-2 bg-white/5 backdrop-blur-sm rounded-full px-2 sm:px-4 py-2 border border-white/10">
                    <Button
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full text-xs sm:text-sm"
                    >
                      ‹
                    </Button>
                    
                    {/* Page Numbers - RESPONSIVE */}
                    {Array.from({ length: Math.min(typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      const maxPages = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
                      if (totalPages <= maxPages) {
                        pageNum = i + 1;
                      } else {
                        if (currentPage <= Math.ceil(maxPages/2)) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                          pageNum = totalPages - maxPages + 1 + i;
                        } else {
                          pageNum = currentPage - Math.floor(maxPages/2) + i;
                        }
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => {
                            setIsPageChanging(true);
                            setCurrentPage(pageNum);
                            setTimeout(() => setIsPageChanging(false), 300);
                          }}
                          variant={pageNum === currentPage ? "default" : "ghost"}
                          size="sm"
                          className={`w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full transition-all duration-200 text-xs sm:text-sm ${
                            pageNum === currentPage 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                              : 'text-white hover:bg-white/20 hover:scale-105'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed w-6 h-6 sm:w-8 sm:h-8 p-0 rounded-full text-xs sm:text-sm"
                    >
                      ›
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Products Grid - COMPLETAMENTE RESPONSIVO */}
            <AnimatePresence mode="wait">
              <motion.div 
                ref={gridRef}
                className={`grid gap-4 sm:gap-6 lg:gap-8 relative ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: isPageChanging ? 0.7 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {isPageChanging && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={`${product.id}-${currentPage}`}
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.95 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: Math.min(index * 0.08, 0.4),
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ 
                      y: -4,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <ProductCard 
                      product={product} 
                      index={index}
                      viewMode={viewMode}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {filteredProducts.length === 0 && (
              <motion.div 
                className="text-center py-12 sm:py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-6xl sm:text-8xl text-purple-300/50 mb-4 sm:mb-6">🔍</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                  No se encontraron productos
                </h3>
                <p className="text-blue-200/70 mb-6 sm:mb-8 text-base sm:text-lg max-w-md mx-auto px-4">
                  Prueba a modificar los filtros o el término de búsqueda para encontrar lo que buscas
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setPriceRange([0, 50]);
                    setShowDiscounted(false);
                    setShowInStock(false);
                    setShowFeatured(false);
                    setShowNew(false);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-white opacity-100" />
                  Limpiar filtros
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
        /* Custom Scrollbar Styles */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        @keyframes float-products-0 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) translateX(10px) rotate(180deg);
            opacity: 0.6;
          }
        }

        @keyframes float-products-1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.3;
          }
          33%, 66% { 
            transform: translateY(-15px) translateX(-8px) rotate(120deg);
            opacity: 0.5;
          }
        }

        @keyframes float-products-2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.25;
          }
          40%, 80% { 
            transform: translateY(-18px) translateX(12px) rotate(240deg);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}