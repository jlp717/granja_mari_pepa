'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Grid, List, Search, ChevronDown, Star, Zap, Clock, TrendingUp, Award, Sparkles } from 'lucide-react';
import { products, productCategories } from '@/lib/data';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

    return () => tl.kill();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesDiscount = !showDiscounted || product.discount;
      const matchesStock = !showInStock || product.inStock;
      const matchesFeatured = !showFeatured || product.featured;
      const matchesNew = !showNew || product.id === '1' || product.id === '3'; // Mock new products

      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount && matchesStock && matchesFeatured && matchesNew;
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
  }, [searchTerm, selectedCategory, priceRange, showDiscounted, showInStock, showFeatured, showNew, sortBy]);

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-bold text-white mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mr-3 animate-pulse"></div>
          Categoría
        </h3>
        <div className="space-y-3">
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

      {/* Price Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-amber-500/20"
      >
        <h3 className="font-bold text-white mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full mr-3 animate-pulse"></div>
          Rango de Precio
        </h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={50}
            step={0.5}
            className="mb-4 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-500 [&_[role=slider]]:to-orange-500 [&_[role=slider]]:border-0"
          />
          <div className="grid grid-cols-2 gap-4">
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
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-bold text-white mb-4 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3 animate-pulse"></div>
          Filtros Avanzados
        </h3>
        <div className="space-y-4">
          {[
            { id: 'discounted', label: 'Con descuento', icon: '💥', checked: showDiscounted, onChange: setShowDiscounted },
            { id: 'in-stock', label: 'Disponible ahora', icon: '✅', checked: showInStock, onChange: setShowInStock },
            { id: 'featured', label: 'Productos destacados', icon: '⭐', checked: showFeatured, onChange: setShowFeatured },
            { id: 'new', label: 'Novedades', icon: '🆕', checked: showNew, onChange: setShowNew }
          ].map((filter, index) => (
            <motion.div
              key={filter.id}
              className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group cursor-pointer"
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
      className="min-h-screen pt-16 relative overflow-hidden"
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
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${3 + Math.random() * 6}px`,
              height: `${3 + Math.random() * 6}px`,
              background: `rgba(${i % 3 === 0 ? '59, 130, 246' : i % 3 === 1 ? '147, 51, 234' : '16, 185, 129'}, 0.8)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
              animation: `float-products-${i % 3} ${8 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          ref={headerRef}
          className="mb-12 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
              NUESTROS
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
              PRODUCTOS
            </span>
          </h1>
          <p className="text-xl text-blue-200/80 max-w-3xl mx-auto leading-relaxed">
            Descubre toda nuestra gama de productos alimentarios de 
            <span className="text-cyan-300 font-semibold"> primera calidad</span> y 
            <span className="text-purple-300 font-semibold"> sabores excepcionales</span>
          </p>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Desktop Sidebar - FIXED Z-INDEX */}
          <div 
            ref={filtersRef}
            className="hidden xl:block w-80 h-fit sticky top-24 z-30"
          >
            <div 
              className="rounded-3xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl"
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
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
                <Filter className="w-6 h-6 mr-3 text-amber-400" />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  Filtros
                </span>
              </h2>
              <FilterContent />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Controls Bar */}
            <motion.div 
              className="rounded-3xl p-6 mb-8 backdrop-blur-xl border border-white/10 shadow-xl relative z-20"
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
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex-1 max-w-xl">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5 group-hover:text-blue-200 transition-colors" />
                    <Input
                      placeholder="Buscar productos deliciosos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-4 bg-black/20 border-blue-400/30 text-white placeholder-blue-300/70 focus:border-blue-300 text-lg rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                  {/* Mobile Filter Button */}
                  <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="xl:hidden bg-purple-600/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30 hover:text-white"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-96 p-0 border-0 bg-black/95 backdrop-blur-xl z-50">
                      <div 
                        className="h-full p-8"
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
                          <SheetTitle className="flex items-center text-2xl text-white">
                            <Filter className="w-6 h-6 mr-3 text-amber-400" />
                            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                              Filtros
                            </span>
                          </SheetTitle>
                        </SheetHeader>
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-64 bg-cyan-600/20 border-cyan-400/30 text-cyan-200 focus:border-cyan-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 backdrop-blur-xl border-cyan-400/30">
                      <SelectItem value="featured" className="text-cyan-200 focus:bg-cyan-600/20">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          Destacados
                        </div>
                      </SelectItem>
                      <SelectItem value="name" className="text-cyan-200 focus:bg-cyan-600/20">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-2" />
                          Nombre A-Z
                        </div>
                      </SelectItem>
                      <SelectItem value="price-low" className="text-cyan-200 focus:bg-cyan-600/20">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Precio: Menor a Mayor
                        </div>
                      </SelectItem>
                      <SelectItem value="price-high" className="text-cyan-200 focus:bg-cyan-600/20">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 rotate-180" />
                          Precio: Mayor a Menor
                        </div>
                      </SelectItem>
                      <SelectItem value="discount" className="text-cyan-200 focus:bg-cyan-600/20">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Mayor Descuento
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 pt-6 border-t border-white/10 gap-4">
                <div className="text-blue-200/80">
                  <span className="font-semibold text-white">{filteredProducts.length}</span> productos encontrados
                  {selectedCategory !== 'all' && (
                    <span className="ml-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {productCategories.find(cat => cat.id === selectedCategory)?.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Products Grid */}
            <AnimatePresence mode="wait">
              <motion.div 
                ref={gridRef}
                className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
                layout
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 60, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.9 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      ease: 'backOut'
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
                className="text-center py-20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-8xl text-purple-300/50 mb-6">🔍</div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  No se encontraron productos
                </h3>
                <p className="text-blue-200/70 mb-8 text-lg max-w-md mx-auto">
                  Prueba a modificar los filtros o el término de búsqueda para encontrar lo que buscas
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange([0, 50]);
                    setShowDiscounted(false);
                    setShowInStock(false);
                    setShowFeatured(false);
                    setShowNew(false);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Limpiar filtros
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Professional CSS animations */}
      <style jsx>{`
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