'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, ShoppingBag, Trash2, Edit, Check, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Package, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CartDrawer() {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [isAnimatingRemove, setIsAnimatingRemove] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{type: string, message: string} | null>(null);
  
  const { 
    items, 
    isOpen, 
    toggleCart, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalPrice, 
    getTotalItems 
  } = useCartStore();

  // Efecto para añadir/quitar clase CSS cuando el carrito se abre/cierra
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('cart-open');
    } else {
      document.body.classList.remove('cart-open');
    }
    
    return () => {
      document.body.classList.remove('cart-open');
    };
  }, [isOpen]);

  const handleProceedToCheckout = () => {
    // Cerrar carrito primero
    toggleCart();
    
    // Navegar a checkout después de que se cierre el carrito
    setTimeout(() => {
      router.push('/checkout');
    }, 300);
  };

  const startEditing = (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setTempQuantity(currentQuantity);
  };

  const saveQuantity = (itemId: string) => {
    if (tempQuantity > 0) {
      updateQuantity(itemId, tempQuantity);
    }
    setEditingItem(null);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setTempQuantity(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      saveQuantity(itemId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    setItemToDelete({ id: itemId, name: productName });
    setShowDeleteDialog(true);
  };

  const confirmRemoveItem = () => {
    if (itemToDelete) {
      setIsAnimatingRemove(itemToDelete.id);
      setTimeout(() => {
        removeItem(itemToDelete.id);
        setIsAnimatingRemove(null);
        setNotificationMessage(`Producto eliminado del carrito`);
        setTimeout(() => setNotificationMessage(null), 3000);
      }, 300);
    }
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleClearCart = () => {
    setShowClearDialog(true);
  };

  const confirmClearCart = () => {
    const itemCount = getTotalItems();
    clearCart();
    setNotificationMessage(`Carrito vaciado - ${itemCount === 1 ? '1 producto eliminado' : `${itemCount} productos eliminados`}`);
    setTimeout(() => setNotificationMessage(null), 4000);
    setShowClearDialog(false);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number, productName: string) => {
    const oldQuantity = items.find(item => item.product.id === itemId)?.quantity || 0;
    
    // Si la cantidad se reduce a 0, mostrar modal de confirmación en lugar de eliminar automáticamente
    if (newQuantity <= 0) {
      setItemToDelete({ id: itemId, name: productName });
      setShowDeleteDialog(true);
      return;
    }
    
    updateQuantity(itemId, newQuantity);
    
    // Sistema de notificación mejorado - no invasivo
    if (newQuantity > oldQuantity) {
      setLastAction({
        type: 'increase',
        message: `${productName}: ${oldQuantity} → ${newQuantity} unidades`
      });
    } else if (newQuantity < oldQuantity && newQuantity > 0) {
      setLastAction({
        type: 'decrease', 
        message: `${productName}: ${oldQuantity} → ${newQuantity} unidades`
      });
    }
    
    // Limpiar la notificación después de 3.5 segundos
    setTimeout(() => setLastAction(null), 3500);
  };

  const handleExploreProducts = () => {
    toggleCart(); // Cerrar el carrito
    router.push('/productos'); // Navegar a la página de productos
  };

  return (
    <>
      {isOpen && (
        <>
          <div
            onClick={toggleCart}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9000] transition-opacity duration-300 ease-in-out"
          />
          
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[9001] flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="text-xl font-bold">Tu Carrito ({getTotalItems()})</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleCart}
                className="text-white hover:bg-white/20 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                  <div className="animate-bounce">
                    <ShoppingBag className="w-16 h-16 text-slate-400 mb-4" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Tu carrito está vacío</h3>
                  <p className="text-slate-500 mb-4">¡Descubre nuestros deliciosos productos!</p>
                  <Button 
                    onClick={handleExploreProducts} 
                    className="mt-4 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Explorar Productos
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div 
                      key={item.product.id} 
                      className={`bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-200 shadow-sm transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 ${
                        isAnimatingRemove === item.product.id ? 'scale-95 opacity-0' : ''
                      }`}
                    >
                      <div className="flex space-x-4">
                        <div className="relative">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg shadow-md border border-slate-200"
                          />
                          <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 mb-1">{item.product.name}</h4>
                          <p className="text-slate-600 text-sm mb-2">
                            {item.product.price ? `${item.product.price.toFixed(2)}€/ud` : 'Precio no disponible'}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-2">
                              {editingItem === item.product.id ? (
                                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg border-2 border-blue-200 animate-fade-in shadow-md">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={tempQuantity}
                                    onChange={(e) => setTempQuantity(parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => handleKeyPress(e, item.product.id)}
                                    className="w-16 h-10 text-center font-bold text-lg border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    autoFocus
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => saveQuantity(item.product.id)}
                                    className="h-10 px-3 bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400 transition-all duration-200"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Guardar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditing}
                                    className="h-10 px-3 bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400 transition-all duration-200"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.product.name)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  
                                  <div className="flex items-center space-x-1 px-2">
                                    <span className="font-bold text-xl min-w-[32px] text-center text-slate-800">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-full"
                                      onClick={() => startEditing(item.product.id, item.quantity)}
                                      title="Editar cantidad"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all duration-200"
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.product.name)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="font-bold text-xl text-blue-600">
                                  {item.product.price ? (item.product.price * item.quantity).toFixed(2) : '0.00'}€
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.quantity}x {item.product.price ? item.product.price.toFixed(2) : '0.00'}€
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200 rounded-lg"
                                onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-inner relative">
                {/* Sistema de notificaciones mejorado - Más elegante y contextual */}
                <div className="space-y-2 mb-4 min-h-[60px] flex flex-col justify-center">
                  {/* Notificación de acciones del carrito - Simplificada y clara */}
                  {notificationMessage && (
                    <div className="mb-3">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-green-800 font-medium text-sm">
                              {notificationMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notificación de cambios de cantidad - Simplificada */}
                  {lastAction && (
                    <div className="mb-3">
                      <div className={`border rounded-xl p-4 shadow-sm ${
                        lastAction.type === 'increase' 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            lastAction.type === 'increase'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-orange-100 text-orange-600'
                          }`}>
                            {lastAction.type === 'increase' ? 
                              <TrendingUp className="w-4 h-4" /> :
                              <TrendingDown className="w-4 h-4" />
                            }
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              lastAction.type === 'increase' ? 'text-blue-800' : 'text-orange-800'
                            }`}>
                              {lastAction.message}
                            </p>
                            <p className={`text-xs ${
                              lastAction.type === 'increase' ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {lastAction.type === 'increase' ? 'Cantidad incrementada' : 'Cantidad reducida'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estado de carrito vacío de notificaciones */}
                  {!notificationMessage && !lastAction && (
                    <div className="text-center py-3">
                      <p className="text-slate-500 text-sm font-medium">
                        {getTotalItems()} {getTotalItems() === 1 ? 'producto listo' : 'productos listos'} para el checkout
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Total con animación mejorada */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-slate-800">Total Final:</span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Incluye todos los productos seleccionados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        {getTotalPrice().toFixed(2)}€
                      </div>
                      <div className="text-sm text-slate-500">
                        {getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}
                      </div>
                      <div className="text-xs text-green-600 font-semibold mt-1 flex items-center justify-end space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Envío incluido</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Botón checkout futurista */}
                  <div className="relative overflow-hidden rounded-2xl">
                    {/* Glow background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl rounded-2xl"></div>
                    
                    <Button 
                      className="relative w-full h-16 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-purple-600/90 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 backdrop-blur-xl text-white font-bold text-lg border border-blue-400/30 shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-0.5 rounded-2xl group" 
                      size="lg"
                      onClick={handleProceedToCheckout}
                    >
                      {/* Inner glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center justify-center space-x-3 z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold tracking-wide">Proceder al Pago</span>
                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:translate-x-1 transition-transform duration-300">
                          <ArrowRight className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      {/* Animated bottom border */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"></div>
                    </Button>
                  </div>
                  
                  {/* Botón vaciar carrito futurista */}
                  <div className="relative overflow-hidden rounded-xl">
                    <Button 
                      variant="outline" 
                      className="relative w-full h-12 bg-gradient-to-r from-red-50/80 to-red-50/80 hover:from-red-100 hover:to-red-100 border border-red-200/60 hover:border-red-300 text-red-600 hover:text-red-700 backdrop-blur-sm transition-all duration-300 group rounded-xl"
                      onClick={handleClearCart}
                    >
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-red-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center justify-center space-x-2 z-10">
                        <div className="w-8 h-8 bg-red-100/80 rounded-lg flex items-center justify-center group-hover:bg-red-200/80 transition-colors duration-200">
                          <Trash2 className="w-4 h-4 group-hover:animate-bounce" />
                        </div>
                        <span className="font-semibold">Vaciar Carrito</span>
                      </div>
                      
                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-300 via-red-400 to-red-300 opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-b-xl"></div>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación para eliminar producto */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 backdrop-blur-xl border border-orange-200/50 shadow-2xl rounded-3xl overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-400/5 rounded-3xl"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent"></div>
          
          <AlertDialogHeader className="relative z-10">
            <AlertDialogTitle className="flex items-center space-x-3 text-xl font-bold mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center border border-orange-200/50 shadow-md">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-slate-800">¿Eliminar producto?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg leading-relaxed text-slate-600 pl-1">
              Estás a punto de eliminar{' '}
              <strong className="text-slate-800 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                "{itemToDelete?.name}"
              </strong>{' '}
              de tu carrito.
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl border border-orange-200/40 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-orange-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Esta acción no se puede deshacer</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6 relative z-10 space-x-3">
            <AlertDialogCancel className="flex-1 h-12 hover:bg-slate-100 border border-slate-200 px-6 text-lg font-medium rounded-xl transition-all duration-200 hover:shadow-md">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveItem}
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg border-none shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-[1.02] rounded-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Sí, eliminar</span>
              </div>
            </AlertDialogAction>
          </AlertDialogFooter>
          
          {/* Animated bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400/40 via-red-400/40 to-orange-400/40 rounded-b-3xl"></div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmación para vaciar carrito */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-3 text-xl font-bold mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center border border-red-200/50 shadow-md">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-slate-800">¿Vaciar carrito completo?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg leading-relaxed text-slate-600 pl-1">
              Vas a eliminar{' '}
              <strong className="text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                {getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}
              </strong>{' '}
              por un valor total de{' '}
              <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 text-xl">
                {getTotalPrice().toFixed(2)}€
              </strong>
              .
              <div className="mt-4 p-3 bg-gradient-to-r from-red-50/80 to-orange-50/80 rounded-xl border border-red-200/40 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-semibold">Se perderán todos los productos del carrito</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="hover:bg-slate-100 px-6 py-3 text-lg font-medium">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearCart}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Sí, vaciar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}