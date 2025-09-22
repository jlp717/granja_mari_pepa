'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Mail, Shield, Star, ArrowRight, Sparkles, Crown, TrendingUp, AlertCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import toast from 'react-hot-toast';
import { CustomerDashboard } from '@/components/customer/dashboard';

const loginFormSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function CustomerAreaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isAuthenticated, login } = useAuthStore();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        toast.success('¡Bienvenido! Has iniciado sesión correctamente.');
      } else {
        setErrorMessage('Credenciales incorrectas. Verifica tu email y contraseña.');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Error al iniciar sesión. Por favor, inténtalo más tarde.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <CustomerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-8 md:pt-12 lg:pt-16 xl:pt-20 overflow-hidden relative">
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
                  Accede a tu dashboard personalizado para gestionar pedidos, 
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                                  focusedInput === 'email' ? 'text-blue-600' : 'text-gray-400'
                                }`} />
                                <Input 
                                  type="email" 
                                  placeholder="tu@email.com" 
                                  className="pl-11 h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-0 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-400"
                                  {...field}
                                  disabled={isLoading}
                                  onFocus={() => setFocusedInput('email')}
                                  onBlur={() => setFocusedInput(null)}
                                />
                                <AnimatePresence>
                                  {focusedInput === 'email' && (
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
                                  placeholder="••••••••" 
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

                  {/* Demo credentials */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                  >
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Credenciales de demo:
                    </h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Email:</strong> cliente@example.com</p>
                      <p><strong>Contraseña:</strong> password123</p>
                    </div>
                  </motion.div>

                  {/* Additional links */}
                  <div className="mt-6 text-center space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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

          {/* Bottom Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-16 lg:mt-24"
          >
            <div className="text-center mb-12">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              >
                Todo lo que necesitas en un solo lugar
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-gray-600 max-w-2xl mx-auto"
              >
                Gestiona tu relación comercial con nosotros de forma fácil y eficiente
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: '📋', 
                  title: 'Gestión de Pedidos', 
                  desc: 'Realiza y consulta todos tus pedidos',
                  color: 'from-blue-500 to-cyan-500'
                },
                { 
                  icon: '🧾', 
                  title: 'Facturas PDF', 
                  desc: 'Descarga y gestiona tus facturas',
                  color: 'from-purple-500 to-pink-500'
                },
                { 
                  icon: '👤', 
                  title: 'Perfil Personal', 
                  desc: 'Actualiza tus datos y preferencias',
                  color: 'from-emerald-500 to-teal-500'
                },
                { 
                  icon: '📊', 
                  title: 'Estadísticas', 
                  desc: 'Analiza tu historial de compras',
                  color: 'from-orange-500 to-red-500'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.6 }}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.2 }
                  }}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-2xl transition-all duration-300 hover:bg-white/90">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative z-10 text-center">
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">{feature.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
                      onClick={() => setShowErrorModal(false)}
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
    </div>
  );
}