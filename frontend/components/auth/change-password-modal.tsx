'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, AlertCircle, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  codigoCliente: string;
  currentPassword: string;
  onSuccess: () => void;
  onLogout?: () => void;
}

// Criterios de validación
const passwordCriteria = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (pwd: string) => pwd.length >= 8 },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'lowercase', label: 'Una letra minúscula', test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'number', label: 'Un número', test: (pwd: string) => /[0-9]/.test(pwd) },
  { id: 'special', label: 'Un carácter especial (!@#$%...)', test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
];

export function ChangePasswordModal({
  isOpen,
  codigoCliente,
  currentPassword,
  onSuccess,
  onLogout
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; general?: string }>({});

  // Validación en tiempo real
  const getPasswordStrength = () => {
    return passwordCriteria.filter(c => c.test(newPassword)).length;
  };

  const validatePasswords = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    // Validar nueva contraseña
    const failedCriteria = passwordCriteria.filter(c => !c.test(newPassword));
    if (failedCriteria.length > 0) {
      newErrors.newPassword = `La contraseña debe cumplir todos los requisitos`;
    }

    // Verificar que no sea igual a la actual (NIF)
    if (newPassword === currentPassword) {
      newErrors.newPassword = 'La nueva contraseña no puede ser igual a tu NIF actual';
    }

    // Validar confirmación
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('¡Contraseña cambiada exitosamente! 🎉', {
          duration: 4000,
          icon: '✅'
        });

        // Limpiar campos
        setNewPassword('');
        setConfirmPassword('');

        // Callback de éxito
        onSuccess();
      } else {
        setErrors({ general: data.error || 'Error al cambiar la contraseña' });
        toast.error(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: 'Error de conexión. Intenta nuevamente.' });
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  if (!isOpen) return null;

  const passwordStrength = getPasswordStrength();
  const strengthPercentage = (passwordStrength / passwordCriteria.length) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop - NO CLICKABLE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-lg"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative rounded-3xl p-8 backdrop-blur-xl border border-amber-500/30 shadow-2xl overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(245, 158, 11, 0.1) 0%,
                  rgba(251, 146, 60, 0.1) 50%,
                  rgba(239, 68, 68, 0.1) 100%
                )
              `
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <Shield className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-3">
                🔒 Configuración de Seguridad Obligatoria
              </h2>
              <p className="text-amber-200/90 text-lg mb-2">
                Por tu seguridad, debes establecer una contraseña personalizada
              </p>
              <p className="text-amber-200/70 text-sm">
                Actualmente usas tu NIF como contraseña, lo cual no es seguro
              </p>
            </div>

            {/* Alert importante */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 text-sm font-semibold mb-1">
                  Importante: Este proceso es obligatorio
                </p>
                <p className="text-amber-200/80 text-xs">
                  No podrás acceder al área de clientes hasta que establezcas una contraseña segura. 
                  Esta medida protege tu información y cumple con nuestras políticas de seguridad.
                </p>
              </div>
            </motion.div>

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
              {/* Nueva Contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-amber-200 mb-2">
                  Nueva Contraseña Segura
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-300 w-5 h-5" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors(prev => ({ ...prev, newPassword: undefined, general: undefined }));
                    }}
                    placeholder="Crea una contraseña fuerte"
                    className={`pl-10 pr-12 py-3 bg-black/30 border text-white placeholder-amber-300/50 focus:border-amber-300 rounded-xl ${
                      errors.newPassword ? 'border-red-500/50 focus:border-red-400' : 'border-amber-400/30'
                    }`}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-300 hover:text-amber-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Barra de fortaleza */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-amber-200/70">Fortaleza de la contraseña</span>
                      <span className="text-xs font-semibold text-amber-200">
                        {passwordStrength}/{passwordCriteria.length}
                      </span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strengthPercentage}%` }}
                        className={`h-full transition-colors duration-300 ${
                          strengthPercentage < 40 ? 'bg-red-500' :
                          strengthPercentage < 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Criterios de validación */}
                <div className="mt-4 space-y-2">
                  {passwordCriteria.map((criterion) => {
                    const isValid = criterion.test(newPassword);
                    return (
                      <motion.div
                        key={criterion.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                      >
                        {isValid ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={`text-xs ${isValid ? 'text-green-300' : 'text-gray-400'}`}>
                          {criterion.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {errors.newPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.newPassword}
                  </motion.p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-200 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-300 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors(prev => ({ ...prev, confirmPassword: undefined, general: undefined }));
                    }}
                    placeholder="Repite tu nueva contraseña"
                    className={`pl-10 pr-12 py-3 bg-black/30 border text-white placeholder-amber-300/50 focus:border-amber-300 rounded-xl ${
                      errors.confirmPassword ? 'border-red-500/50 focus:border-red-400' : 'border-amber-400/30'
                    }`}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-300 hover:text-amber-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Indicador de coincidencia */}
                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300">Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}

                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || passwordStrength < passwordCriteria.length}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cambiando contraseña...
                    </span>
                  ) : (
                    'Establecer Contraseña Segura'
                  )}
                </Button>

                {onLogout && (
                  <Button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoading}
                    variant="outline"
                    className="bg-black/20 border-amber-500/30 text-amber-200 hover:bg-black/30 hover:border-amber-500/50 px-6 py-3 rounded-xl"
                  >
                    Cerrar Sesión
                  </Button>
                )}
              </div>
            </form>

            {/* Footer info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <p className="text-blue-200/80 text-xs text-center">
                💡 <strong>Consejo:</strong> Usa una combinación única de letras, números y símbolos. 
                No compartas esta contraseña con nadie ni la uses en otros sitios.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
