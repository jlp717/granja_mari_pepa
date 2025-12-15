'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Key, Eye, EyeOff, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  blockClose?: boolean; // Si es true, no se puede cerrar el modal
  title?: string;
  subtitle?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  blockClose = false,
  title = "Iniciar Sesión",
  subtitle = "Debes iniciar sesión para continuar"
}: AuthModalProps) {
  const [codigoCliente, setCodigoCliente] = useState('');
  const [nif, setNif] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ codigoCliente?: string; nif?: string; general?: string }>({});

  const { login } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { codigoCliente?: string; nif?: string } = {};

    // Validar código de cliente
    if (!codigoCliente.trim()) {
      newErrors.codigoCliente = 'El código de cliente es obligatorio';
    }

    // Validar NIF
    if (!nif.trim()) {
      newErrors.nif = 'El NIF es obligatorio';
    } else if (nif.trim().replace(/\s+/g, '').length < 9) {
      newErrors.nif = 'El NIF debe tener al menos 9 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Usar la función login del store que ya maneja todo correctamente
      const success = await login(
        codigoCliente.trim(),
        nif.trim().replace(/\s+/g, '') // Eliminar TODOS los espacios del NIF
      );

      if (success) {
        toast.success('¡Sesión iniciada correctamente!', {
          icon: '🎉',
          duration: 3000,
        });

        // Limpiar formulario
        setCodigoCliente('');
        setNif('');

        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess();
        }

        // Cerrar modal si está permitido
        if (!blockClose && onClose) {
          onClose();
        }
      } else {
        // Login fallido
        const errorMessage = 'Código de cliente o NIF incorrectos';
        setErrors({ general: errorMessage });
        toast.error(errorMessage, {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      const errorMsg = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      setErrors({ general: errorMsg });
      toast.error(errorMsg, {
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!blockClose && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative rounded-3xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(10, 10, 26, 0.95) 0%,
                  rgba(26, 10, 46, 0.95) 50%,
                  rgba(42, 24, 16, 0.95) 100%
                )
              `
            }}
          >
            {/* Close button - solo si no está bloqueado */}
            {!blockClose && onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-2">
                {title}
              </h2>
              <p className="text-blue-200/70">
                {subtitle}
              </p>
            </div>

            {/* Error general */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errors.general}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Código de Cliente Input */}
              <div>
                <label htmlFor="codigoCliente" className="block text-sm font-medium text-blue-200 mb-2">
                  Código de Cliente
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <Input
                    id="codigoCliente"
                    type="text"
                    value={codigoCliente}
                    onChange={(e) => {
                      setCodigoCliente(e.target.value);
                      setErrors(prev => ({ ...prev, codigoCliente: undefined, general: undefined }));
                    }}
                    placeholder="Ej: 4300012345"
                    className={`pl-10 pr-4 py-3 bg-black/20 border text-white placeholder-blue-300/50 focus:border-blue-300 rounded-xl ${
                      errors.codigoCliente ? 'border-red-500/50 focus:border-red-400' : 'border-blue-400/30'
                    }`}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
                {errors.codigoCliente && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.codigoCliente}
                  </motion.p>
                )}
              </div>

              {/* NIF Input */}
              <div>
                <label htmlFor="nif" className="block text-sm font-medium text-blue-200 mb-2">
                  NIF / CIF
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <Input
                    id="nif"
                    type={showPassword ? 'text' : 'password'}
                    value={nif}
                    onChange={(e) => {
                      setNif(e.target.value);
                      setErrors(prev => ({ ...prev, nif: undefined, general: undefined }));
                    }}
                    placeholder="Ej: 12345678A"
                    className={`pl-10 pr-12 py-3 bg-black/20 border text-white placeholder-blue-300/50 focus:border-blue-300 rounded-xl ${
                      errors.nif ? 'border-red-500/50 focus:border-red-400' : 'border-blue-400/30'
                    }`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.nif && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.nif}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Warning si está bloqueado */}
            {blockClose && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              >
                <p className="text-amber-200/80 text-sm text-center flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Debes iniciar sesión para acceder a esta página
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
