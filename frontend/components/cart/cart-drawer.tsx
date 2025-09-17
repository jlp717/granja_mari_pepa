'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, ShoppingBag, Trash2, Edit, Check, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(0);
  const [isAnimatingRemove, setIsAnimatingRemove] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  
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

  const handleExploreProducts = () => {
    toggleCart();
    setTimeout(() => {
      router.push('/productos');
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
        setNotificationMessage(`✅ ${itemToDelete.name} eliminado del carrito`);
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
    setNotificationMessage(`🗑️ Carrito vaciado - ${itemCount === 1 ? '1 producto eliminado' : `${itemCount} productos eliminados`}`);
    setTimeout(() => setNotificationMessage(null), 4000);
    setShowClearDialog(false);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number, productName: string) => {
    const oldQuantity = items.find(item => item.product.id === itemId)?.quantity || 0;
    updateQuantity(itemId, newQuantity);
    
    if (newQuantity > oldQuantity) {
      toast({
        title: "📈 Cantidad actualizada",
        description: `${productName}: ${oldQuantity} → ${newQuantity} unidades`,
        duration: 2000,
      });
    } else if (newQuantity < oldQuantity && newQuantity > 0) {
      toast({
        title: "📉 Cantidad reducida",
        description: `${productName}: ${oldQuantity} → ${newQuantity} unidades`,
        duration: 2000,
      });
    }
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
                          <p className="text-slate-600 text-sm mb-2">{item.product.price.toFixed(2)}€/ud</p>
                          
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
                                  {(item.product.price * item.quantity).toFixed(2)}€
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item.quantity}x {item.product.price.toFixed(2)}€
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
              <div className="border-t bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-inner">
                {/* Notificación justo encima del total */}
                {notificationMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium text-center animate-pulse shadow-sm">
                    {notificationMessage}
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-slate-600" />
                    <span className="text-lg font-bold text-slate-800">Total:</span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 animate-pulse">
                      {getTotalPrice().toFixed(2)}€
                    </div>
                    <div className="text-sm text-slate-500">
                      {getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 text-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                    size="lg"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Proceder al Pago
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 group"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                    Vaciar Carrito
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación para eliminar producto */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-xl font-bold">
              <AlertCircle className="w-7 h-7 text-orange-500" />
              <span>¿Eliminar producto?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg leading-relaxed">
              Estás a punto de eliminar <strong className="text-slate-800">"{itemToDelete?.name}"</strong> de tu carrito.
              <br />
              <span className="text-sm text-slate-500 mt-3 block font-medium">
                ⚠️ Esta acción no se puede deshacer
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="hover:bg-slate-100 px-6 py-3 text-lg font-medium">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveItem}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmación para vaciar carrito */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-xl font-bold">
              <AlertCircle className="w-7 h-7 text-red-500" />
              <span>¿Vaciar carrito completo?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg leading-relaxed">
              Vas a eliminar <strong className="text-slate-800">{getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}</strong> por un valor total de <strong className="text-blue-600 text-xl">{getTotalPrice().toFixed(2)}€</strong>.
              <br />
              <span className="text-sm text-slate-500 mt-3 block font-medium">
                🗑️ Se perderán todos los productos del carrito
              </span>
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