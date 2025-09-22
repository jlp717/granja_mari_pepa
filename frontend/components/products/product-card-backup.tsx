'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Tag, Star, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomToast } from '@/components/ui/custom-toast';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  index?: number;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, index = 0, viewMode = 'grid' }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    
    // Unified notification system with product image
    toast.custom((t) => (
      <CustomToast 
        message={`¡${product.name} añadido al carrito!`}
        productName={product.name}
        productImage={product.image}
        quantity={1}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
      position: 'top-right',
    });
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ x: 10, scale: 1.02 }}
        className="group w-full"
      >
        <div 
          className="flex items-center p-6 rounded-3xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-xl group-hover:shadow-2xl transition-all duration-500"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.1) 0%, 
                rgba(255, 255, 255, 0.05) 100%
              )
            `
          }}
        >
          <div className="relative overflow-hidden rounded-2xl flex-shrink-0">
            <Link href={`/productos/${product.id}`}>
              <img
                src={product.image}
                alt={product.name}
                className="w-32 h-32 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </Link>
            
            {/* Compact Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.discount && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-2 py-1">
                  -{product.discount}%
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs px-2 py-1">
                  ⭐
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 ml-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/productos/${product.id}`}>
                  <h3 className="text-white text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-white/70 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-400">
                      {product.price}€
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-white/50 line-through">
                        {product.originalPrice}€
                      </span>
                    )}
                    <span className="text-white/60 text-sm">
                      /{product.unit || 'kg'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/productos/${product.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver detalles
                      </Button>
                    </Link>
                    
                    <Button
                      onClick={handleAddToCart}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.inStock ? 'Añadir' : 'Agotado'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative w-full h-full"
    >
      <div 
        className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-xl group-hover:shadow-2xl transition-all duration-500"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.12) 0%, 
              rgba(255, 255, 255, 0.06) 50%,
              rgba(255, 255, 255, 0.08) 100%
            )
          `,
          backdropFilter: 'blur(20px)',
          minHeight: '420px'
        }}
      >
        {/* Enhanced shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>

        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 via-purple-500/10 to-transparent" />
        </div>

        <div className="relative h-full flex flex-col">
          {/* Enhanced product image section */}
          <div className="relative flex-shrink-0">
            <Link href={`/productos/${product.id}`}>
              <motion.div 
                className="relative overflow-hidden rounded-t-3xl"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Glowing border on hover */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400/50 rounded-t-3xl transition-colors duration-500" />
              </motion.div>
            </Link>
            
            {/* Enhanced Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.discount && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center"
                >
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold px-3 py-1 shadow-lg">
                    <Zap className="w-3 h-3 mr-1 text-white opacity-100" />
                    -{product.discount}%
                  </Badge>
                </motion.div>
              )}
              {product.featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-3 py-1 shadow-lg">
                    <Star className="w-3 h-3 mr-1 text-white opacity-100" />
                    Destacado
                  </Badge>
                </motion.div>
              )}
              {!product.inStock && (
                <Badge className="bg-gradient-to-r from-gray-600 to-gray-800 text-white font-bold px-3 py-1 shadow-lg">
                  Agotado
                </Badge>
              )}
            </div>

            {/* Hover overlay with buttons - FIXED POINTER EVENTS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[1px] pointer-events-none">
              <div 
                className="flex space-x-4 transform translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto"
              >
                <Link href={`/productos/${product.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold backdrop-blur-md border border-white/30 transition-all duration-300 flex items-center space-x-2 pointer-events-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <Eye className="w-4 h-4 text-white opacity-100" />
                    <span>Ver detalles</span>
                  </motion.button>
                </Link>
                
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!product.inStock}
                  className="relative overflow-hidden px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-500" />
                  </div>
                  <ShoppingCart className="w-4 h-4 text-white opacity-100" />
                  <span>{product.inStock ? 'Añadir' : 'Agotado'}</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Enhanced content section */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <Link href={`/productos/${product.id}`}>
                <h3 className="text-white text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              <p className="text-white/70 text-sm mb-4 line-clamp-3">
                {product.description}
              </p>
            </div>

            {/* Enhanced pricing section */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-400">
                  {product.price}€
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-white/50 line-through">
                    {product.originalPrice}€
                  </span>
                )}
                <span className="text-white/60 text-sm">
                  /{product.unit || 'kg'}
                </span>
              </div>

              {/* Quick add button */}
              <motion.button
                onClick={handleAddToCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!product.inStock}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <ShoppingCart className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}