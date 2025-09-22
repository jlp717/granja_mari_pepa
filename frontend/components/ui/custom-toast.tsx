'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ShoppingCart, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useCartStore } from '@/lib/store';

interface CustomToastProps {
  message: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  onDismiss: () => void;
  onViewCart?: () => void;
}

export function CustomToast({ 
  message, 
  productName, 
  productImage,
  quantity = 1, 
  onDismiss, 
  onViewCart 
}: CustomToastProps) {
  const { toggleCart } = useCartStore();

  const handleViewCart = () => {
    if (onViewCart) {
      onViewCart();
    } else {
      toggleCart();
    }
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.4 
      }}
      className="relative max-w-sm w-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-2xl overflow-hidden border border-emerald-400/30"
      style={{
        boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    >
      {/* Background liquid effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-2 -left-2 w-16 h-16 bg-white/10 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/5 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200 z-20"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="relative z-10 p-4">
        <div className="flex items-start space-x-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/30">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName || 'Producto'}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <ShoppingCart className="w-8 h-8 text-white/70" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="w-5 h-5 text-white drop-shadow-lg" />
              <h4 className="text-white font-bold text-sm drop-shadow-sm">
                ¡Añadido al carrito!
              </h4>
            </div>
            
            {productName ? (
              <p className="text-white/90 text-sm mb-1 font-medium drop-shadow-sm">
                {productName}
              </p>
            ) : (
              <p className="text-white/90 text-sm mb-1 font-medium drop-shadow-sm">
                {message}
              </p>
            )}
            
            <p className="text-white/80 text-xs drop-shadow-sm">
              {quantity} unidad{quantity > 1 ? 'es' : ''} añadida{quantity > 1 ? 's' : ''} con éxito
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={handleViewCart}
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 text-xs font-semibold backdrop-blur-sm transition-all duration-200"
          >
            <ShoppingCart className="w-3 h-3 mr-2" />
            Ver carrito
          </Button>
          
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 text-xs px-3 transition-all duration-200"
          >
            <Eye className="w-3 h-3 mr-1" />
            Seguir
          </Button>
        </div>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </motion.div>
  );
}

// Hook para mostrar toast personalizado
export function showCustomCartToast(productName: string, quantity: number = 1) {
  // Crear contenedor si no existe
  let toastContainer = document.getElementById('custom-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[9999] space-y-2';
    document.body.appendChild(toastContainer);
  }

  // Crear toast element
  const toastElement = document.createElement('div');
  toastContainer.appendChild(toastElement);

  const onDismiss = () => {
    if (toastElement && toastElement.parentNode) {
      toastElement.style.opacity = '0';
      toastElement.style.transform = 'translateX(300px) scale(0.8)';
      setTimeout(() => {
        if (toastElement && toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
      }, 300);
    }
  };

  // Auto dismiss after 4 seconds
  setTimeout(() => {
    onDismiss();
  }, 4000);

  return toastElement;
}