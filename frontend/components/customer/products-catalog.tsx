'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  TrendingDown,
  Loader2,
  X
} from 'lucide-react';
import { useAuthStore, useCartStore } from '@/lib/store';
import { useSession } from '@/contexts/SessionContext';
import { formatCurrency } from '@/lib/utils';

interface Producto {
  codigo: string;
  descripcion: string;
  descripcionCorta: string;
  familia: {
    codigo: string;
    descripcion: string;
  };
  codigoIva: number;
  unidadMedida: string;
  unidadesCaja: number;
  peso: number;
  precios: {
    base: number;
    cliente: number | null;
    tarifaCliente: number | null;
    tieneDescuento: boolean;
  };
}

interface Familia {
  codigo: string;
  descripcion: string;
  totalProductos: number;
}

export default function ProductsCatalog() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFamilias, setLoadingFamilias] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const { cliente } = useSession();
  const addToCart = useCartStore((state) => state.addItem);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Cargar familias
  useEffect(() => {
    const fetchFamilias = async () => {
      try {
        const response = await fetch(`${API_URL}/api/productos/familias`);
        const data = await response.json();
        if (data.success) {
          setFamilias(data.data);
        }
      } catch (error) {
        console.error('Error cargando familias:', error);
      } finally {
        setLoadingFamilias(false);
      }
    };

    fetchFamilias();
  }, [API_URL]);

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pagina: paginaActual.toString(),
        limite: '24',
        ...(busqueda && { busqueda }),
        ...(familiaSeleccionada && { familia: familiaSeleccionada })
      });

      // 🔐 SECURITY: Usar fetch con credentials para enviar cookies HttpOnly
      const response = await fetch(`${API_URL}/api/productos?${params}`, { 
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // 🔐 Envía cookies HttpOnly automáticamente
      });
      const data = await response.json();

      if (data.success) {
        setProductos(data.data);
        setTotalPaginas(data.pagination.totalPaginas);
        setTotalProductos(data.pagination.totalProductos);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, paginaActual, busqueda, familiaSeleccionada, isAuthenticated]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // Buscar con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaginaActual(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleAddToCart = (producto: Producto) => {
    const precio = producto.precios.cliente || producto.precios.base;
    const productToAdd: any = {
      id: producto.codigo,
      name: producto.descripcionCorta || producto.descripcion,
      price: precio,
      image: '/placeholder-product.jpg', // TODO: Añadir imágenes reales
      inStock: producto.activo,
      category: producto.familia?.nombre || 'Otros'
    };
    addToCart(productToAdd, 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header del Catálogo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                Nuestros Productos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {totalProductos.toLocaleString()} productos disponibles
                {isAuthenticated && (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                    • Precios personalizados
                  </span>
                )}
              </p>
            </div>

            {/* Buscador */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Botón Filtros (móvil) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filtros
              {familiaSeleccionada && (
                <span className="bg-green-700 px-2 py-0.5 rounded-full text-xs">1</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtros */}
          <AnimatePresence>
            {(showFilters || window.innerWidth >= 1024) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 flex-shrink-0"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-32">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Filter className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Categorías
                    </h3>
                    {familiaSeleccionada && (
                      <button
                        onClick={() => setFamiliaSeleccionada(null)}
                        className="text-sm text-green-600 dark:text-green-400 hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {loadingFamilias ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {familias.map((familia) => (
                        <button
                          key={familia.codigo}
                          onClick={() => {
                            setFamiliaSeleccionada(
                              familiaSeleccionada === familia.codigo ? null : familia.codigo
                            );
                            setPaginaActual(1);
                            setShowFilters(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                            familiaSeleccionada === familia.codigo
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{familia.descripcion}</span>
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full ml-2">
                              {familia.totalProductos}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Grid de Productos */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-16">
                <Package className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta con otros términos de búsqueda o filtros
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productos.map((producto) => {
                    const precioMostrar = producto.precios.cliente || producto.precios.base;
                    const tieneDescuento = producto.precios.tieneDescuento;
                    const porcentajeDescuento = tieneDescuento
                      ? ((1 - precioMostrar / producto.precios.base) * 100).toFixed(0)
                      : 0;

                    return (
                      <motion.div
                        key={producto.codigo}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
                      >
                        {/* Imagen Placeholder */}
                        <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center overflow-hidden">
                          <Package className="h-20 w-20 text-green-600 dark:text-green-400 opacity-50 group-hover:scale-110 transition-transform" />
                          
                          {tieneDescuento && (
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                              <TrendingDown className="h-4 w-4" />
                              -{porcentajeDescuento}%
                            </div>
                          )}

                          <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                            {producto.familia.descripcion}
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                            {producto.descripcionCorta || producto.descripcion}
                          </h3>

                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <Tag className="h-4 w-4" />
                            <span>{producto.codigo}</span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-baseline justify-between">
                              {tieneDescuento && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                  {formatCurrency(producto.precios.base)}
                                </span>
                              )}
                              <span className={`text-2xl font-bold ${
                                tieneDescuento 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {formatCurrency(precioMostrar)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {producto.unidadesCaja} {producto.unidadMedida} • {producto.peso}kg
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToCart(producto)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors group"
                          >
                            <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Añadir al carrito
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                        let pageNum;
                        if (totalPaginas <= 5) {
                          pageNum = i + 1;
                        } else if (paginaActual <= 3) {
                          pageNum = i + 1;
                        } else if (paginaActual >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i;
                        } else {
                          pageNum = paginaActual - 2 + i;
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => setPaginaActual(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              paginaActual === pageNum
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
