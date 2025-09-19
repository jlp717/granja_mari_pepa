'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  CreditCard, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Lock,
  Truck,
  Gift,
  Tag,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Minus,
  X,
  Shield,
  Star,
  AlertCircle,
  Edit,
  Trash2,
  Home,
  Building
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface ShippingAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'business';
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

const checkoutSteps = [
  { id: 'cart', title: 'Carrito', icon: ShoppingCart },
  { id: 'shipping', title: 'Envío', icon: Truck },
  { id: 'payment', title: 'Pago', icon: CreditCard },
  { id: 'confirmation', title: 'Confirmación', icon: Check }
];

// Sample data
const sampleAddresses: ShippingAddress[] = [
  {
    id: '1',
    name: 'Oficina Principal',
    street: 'Calle Mayor 123, Planta 2',
    city: 'Madrid',
    state: 'Madrid',
    zipCode: '28001',
    country: 'España',
    isDefault: true,
    type: 'business'
  },
  {
    id: '2',
    name: 'Almacén Secundario',
    street: 'Polígono Industrial Los Olivos, Nave 15',
    city: 'Getafe',
    state: 'Madrid',
    zipCode: '28905',
    country: 'España',
    isDefault: false,
    type: 'business'
  }
];

const samplePaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  },
  {
    id: '2',
    type: 'card',
    last4: '5555',
    brand: 'mastercard',
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false
  }
];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<string>(sampleAddresses[0].id);
  const [selectedPayment, setSelectedPayment] = useState<string>(samplePaymentMethods[0].id);
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { items: cartItems, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  // Calculate totals
  const subtotal = getTotalPrice();
  const discount = isPromoApplied ? subtotal * 0.1 : 0; // 10% discount
  const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over €50
  const tax = (subtotal - discount) * 0.21; // 21% IVA
  const total = subtotal - discount + shipping + tax;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'descuento10') {
      setIsPromoApplied(true);
      toast.success('¡Código promocional aplicado! 10% de descuento');
    } else {
      toast.error('Código promocional inválido');
    }
  };

  const handleRemovePromo = () => {
    setIsPromoApplied(false);
    setPromoCode('');
    toast.success('Código promocional eliminado');
  };

  const handleNextStep = () => {
    if (currentStep === 0 && cartItems.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }
    if (currentStep === 1 && !selectedAddress) {
      toast.error('Por favor, selecciona una dirección de envío');
      return;
    }
    if (currentStep === 2 && !selectedPayment) {
      toast.error('Por favor, selecciona un método de pago');
      return;
    }
    if (currentStep === 2 && !agreeToTerms) {
      toast.error('Debes aceptar los términos y condiciones');
      return;
    }
    
    if (currentStep < checkoutSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setCurrentStep(3);
      toast.success('¡Pedido procesado con éxito!');
      
      // Clear cart after successful order
      setTimeout(() => {
        clearCart();
      }, 2000);
      
    } catch (error) {
      toast.error('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const getStepIcon = (step: number) => {
    const StepIcon = checkoutSteps[step].icon;
    return <StepIcon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-60 right-10 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Finalizar Compra
            </h1>
            <p className="text-xl text-gray-600">
              Completa tu pedido de forma segura y rápida
            </p>
          </motion.div>

          {/* Step Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              {checkoutSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {getStepIcon(index)}
                    {index < currentStep && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-emerald-600 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-6 h-6 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="ml-3 hidden md:block">
                    <div className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  
                  {index < checkoutSteps.length - 1 && (
                    <div className={`hidden md:block w-16 h-0.5 ml-6 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Step Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
                >
                  
                  {/* STEP 0: CART */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                          <ShoppingCart className="w-7 h-7 mr-3 text-blue-600" />
                          Tu carrito ({cartItems.length} productos)
                        </h2>
                      </div>

                      {cartItems.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-16"
                        >
                          <ShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            Tu carrito está vacío
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Explora nuestros productos y añade algunos artículos a tu carrito
                          </p>
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            Ver productos
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {cartItems.map((item, index) => (
                            <motion.div
                              key={item.product.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-blue-50/30 rounded-2xl border border-gray-100"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/placeholder-product.jpg';
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                                <p className="text-sm text-gray-600">{item.product.category}</p>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-500">€{item.product.price.toFixed(2)} × {item.quantity}</p>
                                  <p className="text-lg font-bold text-blue-600">€{(item.product.price * item.quantity).toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                
                                <span className="w-12 text-center font-semibold text-gray-900">
                                  {item.quantity}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.product.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 1: SHIPPING */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Truck className="w-7 h-7 mr-3 text-blue-600" />
                        Dirección de envío
                      </h2>

                      <div className="grid gap-4">
                        {sampleAddresses.map((address, index) => (
                          <motion.div
                            key={address.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedAddress(address.id)}
                            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                              selectedAddress === address.id
                                ? 'border-blue-500 bg-blue-50/50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className={`p-2 rounded-xl ${
                                  address.type === 'home' ? 'bg-emerald-100' : 'bg-blue-100'
                                }`}>
                                  {address.type === 'home' ? 
                                    <Home className="w-5 h-5 text-emerald-600" /> : 
                                    <Building className="w-5 h-5 text-blue-600" />
                                  }
                                </div>
                                
                                <div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{address.name}</h3>
                                    {address.isDefault && (
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                        Por defecto
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-gray-600 mb-1">{address.street}</p>
                                  <p className="text-gray-600">
                                    {address.city}, {address.state} {address.zipCode}
                                  </p>
                                  <p className="text-gray-600">{address.country}</p>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" className="text-blue-600">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!address.isDefault && (
                                  <Button variant="ghost" size="sm" className="text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <motion.button
                        onClick={() => setShowAddAddress(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Añadir nueva dirección</span>
                      </motion.button>

                      {/* Shipping Options */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Opciones de envío</h3>
                        
                        <div className="grid gap-3">
                          <div className="p-4 border border-gray-200 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Truck className="w-5 h-5 text-emerald-600" />
                                <div>
                                  <div className="font-semibold text-emerald-900">Envío estándar</div>
                                  <div className="text-sm text-emerald-700">3-5 días laborables</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-emerald-900">
                                  {shipping === 0 ? 'GRATIS' : `€${shipping.toFixed(2)}`}
                                </div>
                                {shipping === 0 && (
                                  <div className="text-xs text-emerald-700">Compra superior a €50</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PAYMENT */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <CreditCard className="w-7 h-7 mr-3 text-blue-600" />
                        Método de pago
                      </h2>

                      <div className="grid gap-4">
                        {samplePaymentMethods.map((payment, index) => (
                          <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedPayment(payment.id)}
                            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                              selectedPayment === payment.id
                                ? 'border-blue-500 bg-blue-50/50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-2xl">
                                  {getCardBrandIcon(payment.brand || 'card')}
                                </div>
                                
                                <div>
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 capitalize">
                                      {payment.brand} •••• {payment.last4}
                                    </h3>
                                    {payment.isDefault && (
                                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                        Por defecto
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {payment.expiryMonth && payment.expiryYear && (
                                    <p className="text-gray-600 text-sm">
                                      Expira {payment.expiryMonth.toString().padStart(2, '0')}/{payment.expiryYear}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" className="text-blue-600">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {!payment.isDefault && (
                                  <Button variant="ghost" size="sm" className="text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <motion.button
                        onClick={() => setShowAddPayment(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Añadir método de pago</span>
                      </motion.button>

                      {/* Order Notes */}
                      <div className="space-y-3">
                        <Label htmlFor="notes" className="text-base font-semibold text-gray-900">
                          Notas del pedido (opcional)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Instrucciones especiales para la entrega..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                          rows={3}
                        />
                      </div>

                      {/* Terms and Conditions */}
                      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreeToTerms}
                          onChange={(e) => setAgreeToTerms(e.target.checked)}
                          className="w-5 h-5 text-blue-600 bg-blue-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-700">
                          Acepto los{' '}
                          <button className="text-blue-600 hover:underline">
                            términos y condiciones
                          </button>{' '}
                          y la{' '}
                          <button className="text-blue-600 hover:underline">
                            política de privacidad
                          </button>
                        </label>
                      </div>

                      {/* Security Notice */}
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                        <Shield className="w-6 h-6 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-900">Pago 100% seguro</div>
                          <div className="text-sm text-green-700">
                            Tus datos están protegidos con cifrado SSL
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: CONFIRMATION */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 space-y-6"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.5 }}
                        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
                      >
                        <Check className="w-12 h-12 text-emerald-600" />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                      >
                        <h2 className="text-3xl font-bold text-gray-900">
                          ¡Pedido confirmado!
                        </h2>
                        <p className="text-xl text-gray-600 max-w-md mx-auto">
                          Gracias por tu compra. Te hemos enviado un email de confirmación con todos los detalles.
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto"
                      >
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Número de pedido
                        </h3>
                        <p className="text-2xl font-bold text-blue-700">
                          #ORD-{Date.now().toString().slice(-6)}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                      >
                        <Button 
                          variant="outline" 
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          Ver pedido
                        </Button>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          Seguir comprando
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 sticky top-24"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Tag className="w-6 h-6 mr-2 text-blue-600" />
                  Resumen del pedido
                </h3>

                {/* Promo Code */}
                {!isPromoApplied ? (
                  <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-center mb-3">
                      <Gift className="w-5 h-5 text-amber-600 mr-2" />
                      <span className="font-semibold text-amber-900">Código promocional</span>
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Código (ej: DESCUENTO10)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-amber-300 focus:border-amber-500 focus:ring-0"
                      />
                      <Button 
                        onClick={handleApplyPromo}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Check className="w-5 h-5 text-emerald-600 mr-2" />
                        <span className="font-semibold text-emerald-900">
                          Código aplicado: {promoCode}
                        </span>
                      </div>
                      <Button
                        onClick={handleRemovePromo}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-700 hover:text-emerald-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Order Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-700">
                    <span>Envío</span>
                    <span>{shipping === 0 ? 'GRATIS' : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-700">
                    <span>IVA (21%)</span>
                    <span>€{tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {currentStep < 2 && (
                    <Button
                      onClick={handleNextStep}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-2xl"
                      disabled={cartItems.length === 0}
                    >
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}

                  {currentStep === 2 && (
                    <Button
                      onClick={handleProcessPayment}
                      disabled={isProcessing || !agreeToTerms}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 rounded-2xl"
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Procesando pago...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Lock className="w-5 h-5 mr-2" />
                          Pagar €{total.toFixed(2)}
                        </div>
                      )}
                    </Button>
                  )}

                  {currentStep > 0 && currentStep < 3 && (
                    <Button
                      onClick={handlePrevStep}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Volver
                    </Button>
                  )}
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      <span>Pago seguro</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      <span>Garantía total</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}