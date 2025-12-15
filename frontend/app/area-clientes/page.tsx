'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Mail, Shield, Star, ArrowRight, Sparkles, Crown, TrendingUp, AlertCircle, X, Clipboard, FileText, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { CustomerDashboard } from '@/components/customer/dashboard';

const loginFormSchema = z.object({
  codigoCliente: z.string().min(1, 'Código de cliente es requerido'),
  password: z.string().min(1, 'Contraseña es requerida')
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function CustomerAreaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'clientCode' | 'code' | 'newPassword' | 'success'>('clientCode');
  const [forgotPasswordClientCode, setForgotPasswordClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [devVerificationCode, setDevVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [canChangePassword, setCanChangePassword] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isAuthenticated, login } = useAuthStore();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      codigoCliente: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const success = await login(data.codigoCliente, data.password);

      if (success) {
        toast.success('¡Bienvenido! Has iniciado sesión correctamente.');
      } else {
        setErrorMessage('Credenciales incorrectas. Verifica tu código de cliente y contraseña.');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Error al iniciar sesión. Por favor, inténtalo más tarde.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 1: Solicitar código de verificación (solo con código de cliente)
  const handleRequestVerificationCode = async () => {
    if (!forgotPasswordClientCode) {
      toast.error('Por favor, ingresa tu código de cliente');
      return;
    }

    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Verificar si puede cambiar contraseña (restricción 30 días)
      const checkResponse = await fetch(`${API_URL}/api/auth/v2/verificar-cambio/${forgotPasswordClientCode}`);
      const checkData = await checkResponse.json();

      if (!checkData.puedeCambiar && !checkData.esPrimerCambio) {
        setCanChangePassword(false);
        setDaysRemaining(checkData.diasRestantes || 0);
        
        // Construir mensaje informativo con fechas
        let mensaje = `No puedes cambiar la contraseña todavía.`;
        if (checkData.fechaUltimoCambio) {
          const fechaUltimo = new Date(checkData.fechaUltimoCambio);
          mensaje += `\n\nÚltimo cambio: ${fechaUltimo.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
        }
        if (checkData.fechaProximoCambio) {
          const fechaProximo = new Date(checkData.fechaProximoCambio);
          mensaje += `\nPodrás cambiarla a partir del: ${fechaProximo.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        }
        mensaje += `\n\nDebes esperar ${checkData.diasRestantes} día${checkData.diasRestantes > 1 ? 's' : ''} más.`;
        
        toast.error(mensaje, { duration: 6000 });
        return;
      }

      // Solicitar código de verificación
      const response = await fetch(`${API_URL}/api/auth/v2/solicitar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoCliente: forgotPasswordClientCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setClientName(data.nombreCliente || '');
        setForgotPasswordStep('code');
        
        // En desarrollo, guardar el código para mostrarlo
        if (data.modoDesarrollo && data.codigoVerificacion) {
          setDevVerificationCode(data.codigoVerificacion);
          console.log('🔑 Código de verificación (DEV):', data.codigoVerificacion);
        }
        
        toast.success('Código de verificación generado. Contacta con la empresa para obtenerlo.');
      } else {
        toast.error(data.error || 'Error al procesar la solicitud');
        if (data.diasRestantes) {
          setCanChangePassword(false);
          setDaysRemaining(data.diasRestantes);
        }
      }
    } catch (error) {
      console.error('Error solicitando código:', error);
      toast.error('Error al procesar la solicitud. Inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Verificar código y mostrar confirmación
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    // Mostrar diálogo de confirmación antes de cambiar
    setShowConfirmDialog(true);
  };

  // Paso 3: Confirmar cambio de contraseña
  const handleConfirmPasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('La contraseña debe contener letras y números');
      return;
    }

    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_URL}/api/auth/v2/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          codigoVerificacion: verificationCode,
          nuevaPassword: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotPasswordStep('success');
        toast.success('¡Contraseña cambiada exitosamente!');
      } else {
        toast.error(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordStep('clientCode');
    setForgotPasswordClientCode('');
    setClientName('');
    setVerificationCode('');
    setDevVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setCanChangePassword(true);
    setDaysRemaining(0);
    setShowConfirmDialog(false);
  };

  // 🔧 FIX: Scroll al top inmediatamente cuando el usuario se autentica
  // Esto evita que se vea el footer durante la transición
  useLayoutEffect(() => {
    if (isAuthenticated) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <CustomerDashboard />;
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 overflow-hidden relative">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400 to-cyan-600 rounded-full blur-3xl"
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, -100, -20],
              x: [-10, 10, -10],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className="absolute w-2 h-2 bg-blue-400 rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${60 + i * 5}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Welcome Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Premium Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200"
              >
                <Crown className="w-4 h-4" />
                Área Exclusiva para Clientes
                <Sparkles className="w-4 h-4" />
              </motion.div>

              {/* Main Heading */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                >
                  Bienvenido a tu
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Área Personal
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl text-gray-600 leading-relaxed"
                >
                  Accede a tu panel de control personalizado para gestionar pedidos, 
                  descargar facturas y mucho más con total comodidad.
                </motion.p>
              </div>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="space-y-4"
              >
                {[
                  { icon: TrendingUp, title: 'Historial completo', desc: 'Todos tus pedidos organizados' },
                  { icon: Shield, title: 'Datos seguros', desc: 'Protección garantizada' },
                  { icon: Star, title: 'Acceso prioritario', desc: 'Ofertas y novedades exclusivas' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Glassmorphism Card */}
              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-white/20">
                
                {/* Animated border gradient */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-[1px]">
                  <div className="h-full w-full rounded-3xl bg-white/80 backdrop-blur-xl"></div>
                </div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.6, type: "spring", bounce: 0.4 }}
                      className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                      <User className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="text-2xl font-bold text-gray-900 mb-2"
                    >
                      Iniciar Sesión
                    </motion.h2>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="text-gray-600"
                    >
                      Accede con tus credenciales
                    </motion.p>
                  </div>

                  {/* Login Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <FormField
                        control={form.control}
                        name="codigoCliente"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Código de Cliente</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                                  focusedInput === 'codigoCliente' ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                                <Input
                                  type="text"
                                  placeholder="Ej: 0123456789"
                                  className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400"
                                  {...field}
                                  disabled={isLoading}
                                  onFocus={() => setFocusedInput('codigoCliente')}
                                  onBlur={() => setFocusedInput(null)}
                                />
                                <AnimatePresence>
                                  {focusedInput === 'codigoCliente' && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Contraseña</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                                  focusedInput === 'password' ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Tu contraseña"
                                  className="pl-11 pr-12 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400"
                                  {...field}
                                  disabled={isLoading}
                                  onFocus={() => setFocusedInput('password')}
                                  onBlur={() => setFocusedInput(null)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-blue-50 rounded-lg"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <AnimatePresence>
                                  {focusedInput === 'password' && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none"
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <LoadingSpinner size="sm" />
                              Iniciando sesión...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              Acceder
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Form>

                  {/* Additional links */}
                  <div className="mt-6 text-center space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </motion.button>
                    
                    <div className="text-sm text-gray-600">
                      ¿Necesitas una cuenta?{' '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                      >
                        Contacta con nosotros
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Features Section - DISEÑO PREMIUM */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16 lg:mt-24"
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.85, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 rounded-full text-blue-700 text-sm font-medium mb-4"
              >
                <Sparkles className="w-4 h-4" />
                Panel de Control
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              >
                Todo lo que necesitas en un solo lugar
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-gray-600 max-w-2xl mx-auto text-lg"
              >
                Gestiona tu relación comercial con nosotros de forma fácil y eficiente
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: Clipboard, 
                  title: 'Gestión de Pedidos', 
                  desc: 'Realiza y consulta todos tus pedidos en tiempo real',
                  gradient: 'from-blue-500 to-indigo-600',
                  bgGlow: 'bg-blue-500/20',
                  stats: '24/7',
                  statsLabel: 'Disponible'
                },
                { 
                  icon: FileText, 
                  title: 'Facturas PDF', 
                  desc: 'Descarga y gestiona tus facturas al instante',
                  gradient: 'from-purple-500 to-pink-600',
                  bgGlow: 'bg-purple-500/20',
                  stats: '100%',
                  statsLabel: 'Digital'
                },
                { 
                  icon: User, 
                  title: 'Perfil Personal', 
                  desc: 'Actualiza tus datos y preferencias de contacto',
                  gradient: 'from-emerald-500 to-teal-600',
                  bgGlow: 'bg-emerald-500/20',
                  stats: '∞',
                  statsLabel: 'Personalizable'
                },
                { 
                  icon: BarChart3, 
                  title: 'Estadísticas', 
                  desc: 'Analiza tu historial y patrones de compra',
                  gradient: 'from-amber-500 to-orange-600',
                  bgGlow: 'bg-amber-500/20',
                  stats: '📊',
                  statsLabel: 'Insights'
                }
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group cursor-pointer relative"
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 ${feature.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                    
                    <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-gray-200 transition-all duration-500 h-full">
                      {/* Icon with gradient background */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-gray-800 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {feature.desc}
                      </p>
                      
                      {/* Stats badge */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <span className={`text-xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                          {feature.stats}
                        </span>
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          {feature.statsLabel}
                        </span>
                      </div>
                      
                      {/* Hover arrow indicator */}
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className={`w-5 h-5 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Bottom CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-12 relative overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 md:p-10 relative">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h4 className="text-xl md:text-2xl font-bold text-white mb-2">
                      ¿Aún no tienes cuenta?
                    </h4>
                    <p className="text-blue-100 text-sm md:text-base">
                      Contacta con nuestro equipo comercial para obtener acceso
                    </p>
                  </div>
                  <motion.a
                    href="/contacto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Contactar
                    <ArrowRight className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Modal de Error de Login */}
      <AnimatePresence>
        {showErrorModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowErrorModal(false)}
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative bg-white rounded-3xl p-8 shadow-2xl border border-red-100 max-w-md w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowErrorModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.6 }}
                    className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </motion.div>
                </div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Error de autenticación
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {errorMessage}
                  </p>
                  
                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowErrorModal(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl"
                    >
                      Intentar de nuevo
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowErrorModal(false);
                        setShowForgotPasswordModal(true);
                      }}
                      className="w-full text-gray-600 hover:text-gray-800 py-2"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL RECUPERACIÓN DE CONTRASEÑA - FLUJO COMPLETO */}
      <AnimatePresence>
        {showForgotPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetForgotPasswordModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetForgotPasswordModal}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Recuperar Contraseña</h3>
                    <p className="text-blue-100 text-sm">
                      {forgotPasswordStep === 'clientCode' && 'Ingresa tu código de cliente'}
                      {forgotPasswordStep === 'code' && 'Ingresa el código y nueva contraseña'}
                      {forgotPasswordStep === 'newPassword' && 'Define tu nueva contraseña'}
                      {forgotPasswordStep === 'success' && '¡Contraseña restablecida!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Paso 1: Solo código de cliente */}
                  {forgotPasswordStep === 'clientCode' && (
                    <motion.div
                      key="clientCode-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código de cliente
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="text"
                            value={forgotPasswordClientCode}
                            onChange={(e) => setForgotPasswordClientCode(e.target.value)}
                            placeholder="Ej: 0123456789"
                            className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      {!canChangePassword && daysRemaining > 0 && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="text-sm text-red-800">
                              <strong>No puedes cambiar la contraseña todavía.</strong>
                              <p className="mt-1">Debes esperar {daysRemaining} día{daysRemaining > 1 ? 's' : ''} más.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <strong>Proceso seguro:</strong>
                            <ol className="mt-2 space-y-1 list-decimal list-inside">
                              <li>Ingresa tu código de cliente</li>
                              <li>Contacta con la empresa para obtener el código de verificación</li>
                              <li>Establece tu nueva contraseña</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleRequestVerificationCode}
                        disabled={!forgotPasswordClientCode || isLoading || !canChangePassword}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
                      >
                        {isLoading ? (
                          <LoadingSpinner className="w-5 h-5" />
                        ) : (
                          <>
                            Solicitar código
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {/* Paso 2: Código de verificación + Nueva contraseña */}
                  {forgotPasswordStep === 'code' && (
                    <motion.div
                      key="code-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {clientName && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                          <p className="text-sm text-blue-800">
                            Hola, <span className="font-semibold">{clientName}</span>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código de verificación
                        </label>
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="h-12 text-center text-2xl font-mono border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 tracking-widest"
                          maxLength={6}
                        />
                      </div>

                      {/* En desarrollo: mostrar código - solo para testing local */}
                      {devVerificationCode && process.env.NODE_ENV === 'development' && (
                        <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-300">
                          <p className="text-sm text-yellow-800 text-center">
                            <strong>🔧 Testing:</strong> Código <span className="font-mono font-bold text-lg">{devVerificationCode}</span>
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <strong>¿No tienes el código?</strong>
                            <p className="mt-1">Llama al <strong>639 77 86 56</strong> para obtener tu código de verificación.</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres, letras y números"
                            className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                            className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setForgotPasswordStep('clientCode')}
                          className="flex-1 h-12 border-2"
                        >
                          Atrás
                        </Button>
                        <Button
                          onClick={handleVerifyCode}
                          disabled={verificationCode.length !== 6 || !newPassword || !confirmPassword || isLoading}
                          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                        >
                          {isLoading ? (
                            <LoadingSpinner className="w-5 h-5" />
                          ) : (
                            'Cambiar'
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Paso 3: Éxito */}
                  {forgotPasswordStep === 'success' && (
                    <motion.div
                      key="success-step"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          <Star className="w-8 h-8 text-green-600 fill-current" />
                        </motion.div>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          ¡Contraseña restablecida!
                        </h4>
                        <p className="text-gray-600">
                          Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.
                        </p>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <strong>Importante:</strong> Solo podrás cambiar tu contraseña de nuevo dentro de 30 días.
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="text-sm text-green-800">
                            Tu cuenta está protegida. Recuerda mantener tu contraseña segura.
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={resetForgotPasswordModal}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                      >
                        Continuar al login
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diálogo de confirmación antes de cambiar contraseña */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirmar cambio de contraseña
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Esta acción es importante y tiene consecuencias de seguridad.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Tu contraseña actual dejará de funcionar inmediatamente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><strong>No podrás cambiar tu contraseña de nuevo durante 30 días.</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Asegúrate de recordar tu nueva contraseña o guárdala en un lugar seguro.</span>
                </li>
              </ul>
            </div>
            
            <p className="text-center text-gray-700 font-medium">
              ¿Estás seguro de que deseas continuar?
            </p>
          </div>
          
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPasswordChange}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5" />
              ) : (
                'Sí, cambiar contraseña'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}