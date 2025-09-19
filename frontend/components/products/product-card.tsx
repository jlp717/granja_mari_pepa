'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Tag, Star, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    toast.success(`${product.name} añadido al carrito`, {
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: 'bold',
      }
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
            <Link href={`/productos/${product.id}`}>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                {product.name}
              </h3>
            </Link>

            <p className="text-blue-200/70 mb-3 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-white">
                    {product.price.toFixed(2)}€
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {product.originalPrice.toFixed(2)}€
                    </span>
                  )}
                </div>
                <span className="text-sm text-cyan-300">/ {product.units}</span>
              </div>
              
              <div className="flex space-x-2">
                <Link href={`/productos/${product.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
                  >
                    <Eye className="w-4 h-4 mr-2 text-white opacity-100" />
                    Ver
                  </Button>
                </Link>
                <Button 
                  size="sm"
                  disabled={!product.inStock}
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-white opacity-100" />
                  {product.inStock ? 'Añadir' : 'Agotado'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'backOut' }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group h-full"
    >
      <div 
        className="h-full rounded-3xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-xl group-hover:shadow-2xl group-hover:border-purple-400/30 transition-all duration-500 flex flex-col"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 100%
            )
          `
        }}
      >
        <div className="relative overflow-hidden flex-shrink-0">
          <Link href={`/productos/${product.id}`}>
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
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
              <Badge className="bg-gray-600 text-white font-bold px-3 py-1 shadow-lg">
                Agotado
              </Badge>
            )}
          </div>

          {/* Enhanced Quick actions overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div 
              className="flex space-x-3 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <Link href={`/productos/${product.id}`}>
                <Button 
                  size="sm" 
                  className="bg-white/95 text-gray-900 hover:bg-white hover:scale-105 rounded-full backdrop-blur-sm px-3 py-2 text-sm transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-2 text-gray-900 opacity-100" />
                  Ver detalles
                </Button>
              </Link>
              {product.inStock && (
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full px-3 py-2 text-sm"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2 text-white opacity-100" />
                  Añadir
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <Link href={`/productos/${product.id}`}>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </Link>

          <p className="text-blue-200/70 mb-4 line-clamp-3 text-sm leading-relaxed flex-1">
            {product.description}
          </p>

          <div className="flex items-end justify-between mb-4 mt-auto">
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
                  {product.price.toFixed(2)}€
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {product.originalPrice.toFixed(2)}€
                  </span>
                )}
              </div>
              <span className="text-xs text-cyan-300/70">por {product.units}</span>
            </div>
            
            <div className="flex items-center text-xs text-purple-300/70 bg-purple-500/10 px-3 py-1 rounded-full">
              <Tag className="w-3 h-3 mr-1 text-purple-300 opacity-100" />
              {product.category}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold text-white" 
              disabled={!product.inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2 text-white opacity-100" />
              {product.inStock ? 'Añadir al carrito' : 'Agotado'}
            </Button>
            <Link href={`/productos/${product.id}`}>
              <Button 
                variant="outline" 
                size="icon"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <Eye className="w-4 h-4 text-white opacity-100" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}