'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Tag, Star, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomToast } from '@/components/ui/custom-toast';
import { toast } from 'sonner';
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
                      /{product.units || 'kg'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Link href={`/productos/${product.id}`}>
                      <motion.button
                        whileHover={{ 
                          scale: 1.08, 
                          y: -2,
                          boxShadow: "0 12px 24px rgba(6, 182, 212, 0.3)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 10 
                        }}
                        className="group/btn relative px-5 py-2.5 bg-gradient-to-br from-slate-800/90 via-slate-700/95 to-slate-800/90 backdrop-blur-xl border border-cyan-400/40 hover:border-cyan-300/70 text-white/95 hover:text-cyan-100 rounded-xl font-semibold text-sm flex items-center gap-2.5 overflow-hidden transition-all duration-400 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.95) 50%, rgba(30, 41, 59, 0.9) 100%)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {/* Animated tech background */}
                        <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-blue-500/20 to-purple-500/15" />
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                        </div>
                        
                        <Eye className="w-4 h-4 relative z-10 transition-all duration-400 group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                        <span className="relative z-10 tracking-wide">Ver detalles</span>
                        
                        {/* Premium shimmer */}
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-800 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </motion.button>
                    </Link>
                    
                    <motion.button
                      onClick={handleAddToCart}
                      whileHover={{ 
                        scale: 1.08, 
                        y: -2,
                        boxShadow: "0 12px 24px rgba(16, 185, 129, 0.4)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 10 
                      }}
                      disabled={!product.inStock}
                      className="group/btn relative px-5 py-2.5 bg-gradient-to-br from-emerald-600/90 via-green-500/95 to-emerald-700/90 backdrop-blur-xl border border-emerald-400/50 hover:border-emerald-300/70 text-white rounded-xl font-semibold text-sm flex items-center gap-2.5 overflow-hidden transition-all duration-400 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: !product.inStock 
                          ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.8) 0%, rgba(100, 116, 139, 0.9) 50%, rgba(71, 85, 105, 0.8) 100%)'
                          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(34, 197, 94, 0.95) 50%, rgba(5, 150, 105, 0.9) 100%)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {/* Energy pulse effect */}
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-green-300/25 to-cyan-400/20 animate-pulse" />
                      </div>
                      
                      <ShoppingCart className="w-4 h-4 relative z-10 transition-all duration-400 group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] group-hover/btn:rotate-6" />
                      <span className="relative z-10 tracking-wide">{product.inStock ? 'Añadir' : 'Agotado'}</span>
                      
                      {/* Quantum shimmer */}
                      <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-800 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </motion.button>
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

            {/* Hover overlay with SPECTACULAR FUTURISTIC BUTTONS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 ease-out flex items-center justify-center backdrop-blur-[3px] pointer-events-none">
              <div 
                className="flex space-x-4 transform translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-1000 delay-200 ease-out pointer-events-auto"
              >
                <Link href={`/productos/${product.id}`}>
                  <motion.button
                    whileHover={{ 
                      scale: 1.12, 
                      y: -4,
                      rotateX: 5,
                      boxShadow: "0 20px 40px rgba(6, 182, 212, 0.4)"
                    }}
                    whileTap={{ 
                      scale: 0.92,
                      rotateX: -2 
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 10 
                    }}
                    className="group/btn relative px-6 py-3 bg-gradient-to-br from-slate-900/80 via-slate-800/90 to-slate-900/80 backdrop-blur-xl border border-cyan-400/40 hover:border-cyan-300/80 text-white/95 hover:text-cyan-100 rounded-2xl font-semibold text-sm flex items-center gap-3 overflow-hidden transition-all duration-500 shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(15, 23, 42, 0.95) 100%)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Animated circuit-like background */}
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/20 to-purple-500/10 animate-pulse" />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                    </div>
                    
                    {/* Holographic glow effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" 
                         style={{ 
                           background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(6, 182, 212, 0.15) 60deg, transparent 120deg, rgba(59, 130, 246, 0.15) 180deg, transparent 240deg, rgba(139, 92, 246, 0.15) 300deg, transparent 360deg)',
                           filter: 'blur(1px)'
                         }} />
                    
                    {/* Icon with premium glow */}
                    <div className="relative z-10">
                      <Eye className="w-5 h-5 transition-all duration-500 group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    </div>
                    
                    <span className="relative z-10 tracking-wider text-shadow">Ver detalles</span>
                    
                    {/* Premium corner accents */}
                    <div className="absolute top-1 right-1 w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-0 right-0 w-3 h-px bg-gradient-to-l from-cyan-400 to-transparent" />
                      <div className="absolute top-0 right-0 w-px h-3 bg-gradient-to-b from-cyan-400 to-transparent" />
                    </div>
                    <div className="absolute bottom-1 left-1 w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                      <div className="absolute bottom-0 left-0 w-3 h-px bg-gradient-to-r from-blue-400 to-transparent" />
                      <div className="absolute bottom-0 left-0 w-px h-3 bg-gradient-to-t from-blue-400 to-transparent" />
                    </div>
                  </motion.button>
                </Link>
                
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ 
                    scale: 1.12, 
                    y: -4,
                    rotateX: 5,
                    boxShadow: "0 20px 40px rgba(16, 185, 129, 0.5)"
                  }}
                  whileTap={{ 
                    scale: 0.92,
                    rotateX: -2 
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  }}
                  disabled={!product.inStock}
                  className="group/btn relative px-6 py-3 bg-gradient-to-br from-emerald-600/90 via-green-500/95 to-emerald-700/90 backdrop-blur-xl border border-emerald-400/50 hover:border-emerald-300/80 text-white rounded-2xl font-semibold text-sm flex items-center gap-3 overflow-hidden transition-all duration-500 shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: !product.inStock 
                      ? 'linear-gradient(135deg, rgba(71, 85, 105, 0.8) 0%, rgba(100, 116, 139, 0.9) 50%, rgba(71, 85, 105, 0.8) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(34, 197, 94, 0.95) 50%, rgba(5, 150, 105, 0.9) 100%)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {/* Electric energy background */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-green-300/30 to-cyan-400/20" 
                         style={{ 
                           animation: 'electric-pulse 2s ease-in-out infinite',
                           background: 'radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.3), transparent 50%), radial-gradient(circle at 70% 60%, rgba(34, 197, 94, 0.3), transparent 50%)'
                         }} />
                  </div>
                  
                  {/* Quantum shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
                  
                  {/* Icon with epic glow */}
                  <div className="relative z-10">
                    <ShoppingCart className="w-5 h-5 transition-all duration-500 group-hover/btn:scale-110 group-hover/btn:drop-shadow-[0_0_12px_rgba(16,185,129,1)] group-hover/btn:rotate-12" />
                  </div>
                  
                  <span className="relative z-10 tracking-wider text-shadow">
                    {product.inStock ? 'Añadir' : 'Agotado'}
                  </span>
                  
                  {/* Premium energy rings */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700"
                       style={{
                         background: 'conic-gradient(from 0deg at 50% 50%, transparent, rgba(16, 185, 129, 0.2) 90deg, transparent 180deg, rgba(34, 197, 94, 0.2) 270deg, transparent)',
                         animation: 'spin-slow 4s linear infinite'
                       }} />
                </motion.button>
              </div>
              
              {/* Premium overlay particles */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
                    style={{
                      left: `${20 + i * 12}%`,
                      top: `${30 + (i % 2) * 40}%`,
                      animation: `particle-float-${i % 3} ${2 + i * 0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`
                    }}
                  />
                ))}
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
                  /{product.units || 'kg'}
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
      
      {/* Spectacular CSS animations for premium effects */}
      <style jsx>{`
        @keyframes electric-pulse {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes particle-float-0 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-8px) translateX(4px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes particle-float-1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.6;
          }
          33% { 
            transform: translateY(-6px) translateX(-3px) scale(1.1);
            opacity: 0.9;
          }
          66% { 
            transform: translateY(-4px) translateX(6px) scale(1.3);
            opacity: 0.7;
          }
        }

        @keyframes particle-float-2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.5;
          }
          40% { 
            transform: translateY(-10px) translateX(2px) scale(1.4);
            opacity: 0.8;
          }
          80% { 
            transform: translateY(-3px) translateX(-4px) scale(1.1);
            opacity: 1;
          }
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        /* Enhanced glow effects */
        .group/btn:hover .drop-shadow-glow {
          filter: drop-shadow(0 0 12px currentColor);
        }
      `}</style>
    </motion.div>
  );
}