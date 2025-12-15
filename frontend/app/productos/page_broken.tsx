'use client';

/**
 * 🛍️ PÁGINA DE PRODUCTOS - VERSIÓN CORREGIDA
 * ============================================
 * ✅ AuthModal bloqueante (sin redirigir)
 * ✅ Estilos visuales originales mantenidos
 * ✅ Sin GSAP (solo Framer Motion)
 * ✅ Autenticación obligatoria
 * ✅ Productos personalizados por cliente
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Grid, List, Search, Star, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AuthModal } from '@/components/auth/auth-modal';
import toast from 'react-hot-toast';

// Partículas determinísticas para efectos visuales
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
  const { isAuthenticated, user } = useAuthStore();
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50);
  const [showDiscounted, setShowDiscounted] = useState(false);
  const [showInStock, setShowInStock] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [realCategories, setRealCategories] = useState<any[]>([]);
  
  // Auth states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const productsPerPage = 12;

  // 🔒 Verificar autenticación (sin redirigir, mostrar modal)
  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      if (!isAuthenticated || !token) {
        // Mostrar modal bloqueante en lugar de redirigir
        setShowAuthModal(true);
        setAuthChecked(false);
      } else {
        setShowAuthModal(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [isAuthenticated]);

  // 📊 Cargar productos personalizados del cliente autenticado
  useEffect(() => {
    const fetchData = async () => {
      if (!authChecked) return;
      
      try {
        setIsLoadingProducts(true);
        const token = localStorage.getItem('access_token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Cargar categorías primero
        try {
          const categoriasResponse = await fetch(`${API_URL}/api/productos/familias`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (categoriasResponse.ok) {
            const categoriasData = await categoriasResponse.json();
            if (categoriasData.success && categoriasData.data) {
              setRealCategories(categoriasData.data);
            }
          }
        } catch (error) {
          console.error('Error loading categories:', error);
        }
        
        // Cargar productos PERSONALIZADOS
        const response = await fetch(`${API_URL}/api/productos?limite=200`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Respuesta del backend:', data);
          
          if (data.success && data.productos && Array.isArray(data.productos)) {
            // Transformar productos al formato correcto
            const transformedProducts = data.productos.map((p: any) => ({
              id: p.codigo || '',
              name: p.nombre || '',
              category: p.categoria || 'general',
              categoryName: p.familia?.descripcion || 'Sin categoría',
              brand: 'general',
              price: parseFloat(p.precio) || 0,
              originalPrice: p.precioOriginal ? parseFloat(p.precioOriginal) : null,
              units: p.unidades || 'unidad',
              description: p.descripcion || '',
              image: p.imagen || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
              inStock: true,
              discount: p.descuento || 0,
              featured: p.destacado || false,
              familia: p.familia || { codigo: '', descripcion: 'Sin categoría' }
            }));
            
            console.log('✅ Productos transformados:', transformedProducts.length);
            setProducts(transformedProducts);
            
            // Ajustar rango de precios basado en productos reales
            const prices = transformedProducts.map((p: any) => p.price).filter((p: number) => p > 0);
            if (prices.length > 0) {
              const max = Math.ceil(Math.max(...prices));
              setMaxPrice(max);
              setPriceRange([0, max]);
            }
            
            toast.success(`${transformedProducts.length} productos cargados`);
          } else {
            console.error('❌ Respuesta inválida:', data);
            toast.error('No se pudieron cargar los productos');
          }
        } else if (response.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente');
          setShowAuthModal(true);
          setAuthChecked(false);
        } else {
          toast.error('Error al cargar productos');
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Error de conexión al cargar productos');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchData();
  }, [authChecked]);

  // Scroll handler para sidebar
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setShowFilters(scrollY < 100);
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

  // Handler para cuando se completa el login
  const handleLoginSuccess = () => {
    setShowAuthModal(false);
    setAuthChecked(true);
    // Los productos se cargarán automáticamente por el useEffect
  };

  // 🔍 Filtrado y ordenamiento (memoizado)
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesDiscount = !showDiscounted || (product.discount && product.discount > 0);
      const matchesStock = !showInStock || product.inStock;

      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount && matchesStock;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        case 'discount': return (b.discount || 0) - (a.discount || 0);
        default: return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, priceRange, showDiscounted, showInStock, sortBy]);

  // 📄 Paginación
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, showDiscounted, showInStock, sortBy]);

  // 🎨 Componente de Filtros
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
          {realCategories.slice(0, 20).map((category, index) => (
            <motion.div 
              key={category.codigo}
              className="flex items-center space-x-3 group cursor-pointer"
              whileHover={{ x: 5 }}
              transition={{ delay: index * 0.05 }}
            >
              <Checkbox
                id={`category-${category.codigo}`}
                checked={selectedCategory === category.codigo}
                onCheckedChange={() => setSelectedCategory(category.codigo)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500 border-amber-400/50"
              />
              <label htmlFor={`category-${category.codigo}`} className="text-amber-100 group-hover:text-white transition-colors cursor-pointer text-sm">
                {category.descripcion} <span className="text-amber-300/60">({category.totalProductos})</span>
              </label>
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
            max={maxPrice}
            step={0.5}
            className="mb-3"
          />
          <div className="flex justify-between text-sm text-amber-300">
            <span>€{priceRange[0].toFixed(2)}</span>
            <span>€{priceRange[1].toFixed(2)}</span>
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
          <motion.div 
            className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <Checkbox
              id="filter-discount"
              checked={showDiscounted}
              onCheckedChange={(checked) => setShowDiscounted(checked === true)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 border-purple-400/50"
            />
            <span className="text-lg">💥</span>
            <label htmlFor="filter-discount" className="text-purple-100 cursor-pointer flex-1">Con descuento</label>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ x: 5 }}
          >
            <Checkbox
              id="filter-stock"
              checked={showInStock}
              onCheckedChange={(checked) => setShowInStock(checked === true)}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-cyan-500 border-green-400/50"
            />
            <span className="text-lg">✅</span>
            <label htmlFor="filter-stock" className="text-purple-100 cursor-pointer flex-1">Solo disponibles</label>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  // Mostrar pantalla de carga mientras se cargan productos
  if (authChecked && isLoadingProducts) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-32 relative overflow-hidden flex items-center justify-center"
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
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
          >
            <LoadingSpinner size="lg" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Cargando productos...
            </h2>
            <p className="text-blue-200/70">
              Obteniendo tus productos personalizados
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de autenticación bloqueante */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={handleLoginSuccess}
        blockClose={true}
        title="Acceso Requerido"
        subtitle="Debes iniciar sesión para ver nuestro catálogo de productos"
      />

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
        {/* Background Effects con partículas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
            
            {/* Desktop Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  ref={filtersRef}
                  className="hidden 2xl:block w-80 fixed z-30"
                  style={{ 
                    left: 'max(1rem, calc((100vw - 1600px) / 3 + 1rem))',
                    top: '160px',
                    height: 'calc(100vh - 200px)',
                    maxHeight: '770px'
                  }}
                  initial={{ opacity: 0, x: -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div 
                    className="rounded-3xl p-6 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden h-full"
                    style={{
                      background: `linear-gradient(135deg, rgba(10, 10, 26, 0.9) 0%, rgba(26, 10, 46, 0.9) 50%, rgba(42, 24, 16, 0.9) 100%)`
                    }}
                  >
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                      <Filter className="w-5 h-5 mr-2 text-amber-400" />
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
            <div className="flex-1 w-full">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 text-center"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3">
                  <span className="bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                    TUS PRODUCTOS
                  </span>
                </h1>
                <p className="text-lg text-blue-200/80 max-w-3xl mx-auto">
                  Catálogo personalizado con{' '}
                  <span className="text-cyan-300 font-semibold">tus precios y descuentos</span>
                </p>
              </motion.div>

              {/* Search and Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="rounded-3xl p-6 mb-8 backdrop-blur-xl border border-white/10 shadow-xl bg-white/5"
              >
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 pr-4 py-4 bg-black/20 border-blue-400/30 text-white placeholder-blue-300/70"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="2xl:hidden">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtros
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full sm:w-96 p-8 bg-black/95 backdrop-blur-xl">
                          <SheetHeader className="mb-8">
                            <SheetTitle className="text-2xl text-white">Filtros</SheetTitle>
                          </SheetHeader>
                          <FilterContent />
                        </SheetContent>
                      </Sheet>

                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-64 bg-cyan-600/20 border-cyan-400/30 text-cyan-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Destacados</SelectItem>
                          <SelectItem value="name">Nombre A-Z</SelectItem>
                          <SelectItem value="price-low">Precio: Menor</SelectItem>
                          <SelectItem value="price-high">Precio: Mayor</SelectItem>
                          <SelectItem value="discount">Mayor Descuento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-white">
                      Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Products Grid */}
              {paginatedProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Sparkles className="w-20 h-20 text-purple-300/50 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-4">No se encontraron productos</h3>
                  <p className="text-blue-200/70 mb-8">
                    Prueba a modificar los filtros
                  </p>
                  <Button onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setShowDiscounted(false);
                  }}>
                    Limpiar filtros
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className={`grid gap-8 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1'
                  }`}>
                    {paginatedProducts.map((product, index) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12 bg-white/5 backdrop-blur-sm rounded-full px-6 py-4 border border-white/10 w-fit mx-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-white hover:bg-white/20"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = totalPages <= 5 ? i + 1 : 
                          currentPage <= 3 ? i + 1 :
                          currentPage >= totalPages - 2 ? totalPages - 4 + i :
                          currentPage - 2 + i;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={pageNum === currentPage 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                              : 'text-white hover:bg-white/20'
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-white hover:bg-white/20"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Animaciones CSS para partículas */}
        <style jsx global>{`
          @keyframes float-products-0 {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-40px) translateX(-10px); }
            75% { transform: translateY(-20px) translateX(15px); }
          }
          
          @keyframes float-products-1 {
            0%, 100% { transform: translateY(0) translateX(0); }
            33% { transform: translateY(-30px) translateX(-15px); }
            66% { transform: translateY(-15px) translateX(20px); }
          }
          
          @keyframes float-products-2 {
            0%, 100% { transform: translateY(0) translateX(0); }
            20% { transform: translateY(-25px) translateX(12px); }
            40% { transform: translateY(-50px) translateX(-8px); }
            60% { transform: translateY(-35px) translateX(18px); }
            80% { transform: translateY(-15px) translateX(-12px); }
          }
        `}</style>
      </div>
    </>
  );
}
