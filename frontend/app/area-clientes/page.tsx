'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
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
        toast.error('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión. Por favor, inténtalo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <CustomerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 pt-20">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Área de clientes
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta para gestionar pedidos y facturas
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu@email.com" 
                          {...field}
                          disabled={isLoading}
                        />
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
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Iniciando sesión...
                    </div>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            </Form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Credenciales de demo:
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Email:</strong> cliente@example.com</p>
                <p><strong>Contraseña:</strong> password123</p>
              </div>
            </div>

            {/* Additional links */}
            <div className="mt-6 text-center space-y-3">
              <button className="text-sm text-primary hover:text-accent transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
              
              <div className="text-sm text-gray-600">
                ¿Necesitas una cuenta?{' '}
                <button className="text-primary hover:text-accent transition-colors font-semibold">
                  Contacta con nosotros
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-semibold text-gray-900">Gestión de pedidos</div>
              <div className="text-xs text-gray-600">Realiza y consulta tus pedidos</div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl mb-2">🧾</div>
              <div className="text-sm font-semibold text-gray-900">Facturas</div>
              <div className="text-xs text-gray-600">Descarga tus facturas</div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl mb-2">👤</div>
              <div className="text-sm font-semibold text-gray-900">Perfil</div>
              <div className="text-xs text-gray-600">Actualiza tus datos</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}