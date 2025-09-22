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
      initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: 45 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: 'backOut' }}
      whileHover={{ 
        y: -12, 
        scale: 1.03,
        rotateY: 5,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98, rotateY: 0 }}
      className="group h-full perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div 
        className="h-full rounded-3xl overflow-hidden shadow-xl border border-white/10 backdrop-blur-xl group-hover:shadow-2xl group-hover:border-purple-400/30 transition-all duration-500 flex flex-col relative"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 100%
            )
          `
        }}
      >
        {/* Magical shimmer effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        </div>
        
        {/* Floating particles on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full"
            animate={{ 
              y: [-20, 20, -20], 
              x: [-10, 10, -10],
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400 rounded-full"
            animate={{ 
              y: [20, -20, 20], 
              x: [10, -10, 10],
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-blue-400 rounded-full"
            animate={{ 
              y: [-15, 15, -15], 
              x: [15, -15, 15],
              opacity: [0, 1, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="relative overflow-hidden flex-shrink-0">
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
              <Badge className="bg-gray-600 text-white font-bold px-3 py-1 shadow-lg">
                Agotado
              </Badge>
            )}
          </div>

          {/* Enhanced Quick actions overlay - PERFECCIONADO */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[1px]">
            <motion.div 
              className="flex space-x-4 transform translate-y-6 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
            >
              <Link href={`/productos/${product.id}`}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  whileTap={{ scale: 0.95, rotate: -3 }}
                >
                  <Button 
                    size="sm" 
                    className="bg-white/95 text-gray-900 hover:bg-white hover:shadow-lg rounded-full backdrop-blur-sm px-4 py-2.5 text-sm transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Button shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    
                    <motion.div 
                      className="flex items-center relative z-10"
                      whileHover={{ x: 2 }}
                    >
                      <Eye className="w-4 h-4 mr-2 text-gray-900 opacity-100" />
                      Ver detalles
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
              
              {product.inStock && (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -3 }}
                  whileTap={{ scale: 0.95, rotate: 3 }}
                >
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 rounded-full px-4 py-2.5 text-sm transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-purple-500/50"
                    onClick={handleAddToCart}
                  >
                    {/* Glowing particles on button */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute top-1 left-2 w-1 h-1 bg-white/80 rounded-full animate-ping animation-delay-0" />
                      <div className="absolute top-1 right-3 w-1 h-1 bg-white/60 rounded-full animate-ping animation-delay-300" />
                      <div className="absolute bottom-1 left-4 w-1 h-1 bg-white/70 rounded-full animate-ping animation-delay-500" />
                    </div>
                    
                    <motion.div 
                      className="flex items-center relative z-10"
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ rotate: 360 }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2 text-white opacity-100" />
                      </motion.div>
                      Añadir
                    </motion.div>
                  </Button>
                </motion.div>
              )}
            </motion.div>
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