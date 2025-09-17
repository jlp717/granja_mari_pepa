'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} añadido al carrito`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500">
        <div className="relative overflow-hidden">
          <Link href={`/productos/${product.id}`}>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </Link>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.discount && (
              <Badge variant="destructive" className="bg-red-500">
                -{product.discount}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-accent">
                Destacado
              </Badge>
            )}
            {!product.inStock && (
              <Badge variant="secondary">
                Agotado
              </Badge>
            )}
          </div>

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex space-x-2">
              <Link href={`/productos/${product.id}`}>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
              {product.inStock && (
                <Button 
                  size="icon" 
                  className="rounded-full"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <Link href={`/productos/${product.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary">
                  {product.price.toFixed(2)}€
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {product.originalPrice.toFixed(2)}€
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">/ {product.units}</span>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Tag className="w-3 h-3 mr-1" />
              {product.category}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button 
              className="flex-1" 
              disabled={!product.inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.inStock ? 'Añadir' : 'Agotado'}
            </Button>
            <Link href={`/productos/${product.id}`}>
              <Button variant="outline" size="icon">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}