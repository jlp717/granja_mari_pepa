'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/native-motion';
import { X, Eye, EyeOff, Lock, AlertCircle, CheckCircle, Shield, Clock, Key } from 'lucide-react';
import { toast } from 'sonner';
import { secureFetch } from '@/lib/secureFetch';
import { useAuthStore } from '@/lib/store';

interface PasswordChangeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordChangeForm({ isOpen, onClose }: PasswordChangeFormProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<'check' | 'request' | 'verify'>('check');
  const [loading, setLoading] = useState(false);

  // Cooldown check states
  const [canChange, setCanChange] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [lastChangeDate, setLastChangeDate] = useState<string>('');
  const [isLegacy, setIsLegacy] = useState(false);

  // Request code states
  const [maskedEmail, setMaskedEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [passwordFeedback, setPasswordFeedback] = useState<string>('');

  // Check if user can change password (30-day cooldown)
  useEffect(() => {
    if (isOpen && step === 'check') {
      checkPasswordChangeCooldown();
    }
  }, [isOpen, step]);

  const checkPasswordChangeCooldown = async () => {
    setLoading(true);
    try {
      // Use codigoCliente from user.id (defined in AuthStore)
      const codigoCliente = user?.id || user?.codigoCliente || user?.customerCode || user?.code;
      if (!codigoCliente) {
        toast.error('No se encontró el código de cliente');
        // onClose(); // Keep open to see error
        return;
      }

      // Add timestamp to prevent caching (304 Not Modified issues)
      const response = await secureFetch(`/api/auth/v2/verificar-cambio/${codigoCliente}?_=${Date.now()}`);
      const data = response.data as any; // secureFetch already parses JSON

      if (response.ok && (data.ok || data.success)) {
        setCanChange(data.canChange);
        setDaysRemaining(data.daysRemaining || 0);
        setLastChangeDate(data.lastChangeDate || '');
        setIsLegacy(data.isLegacy || false);

        if (data.canChange) {
          // Can proceed to request code
          setStep('request');
        } else {
          // Show cooldown message
          setStep('check');
        }
      } else {
        toast.error(data.message || 'Error al verificar permisos de cambio');
        // onClose(); // Keep open to see error
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
      toast.error('Error al verificar permisos de cambio');
      // onClose(); // Keep open to see error
    } finally {
      setLoading(false);
    }
  };

  const requestVerificationCode = async () => {
    setLoading(true);
    try {
      // Use codigoCliente from user.id (defined in AuthStore)
      const codigoCliente = user?.id || user?.codigoCliente || user?.customerCode || user?.code;
      if (!codigoCliente) {
        toast.error('No se encontró el código de cliente');
        return;
      }

      const response = await secureFetch('/api/auth/v2/solicitar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoCliente })
      });

      const data = response.data as any; // secureFetch already parses JSON

      if (response.ok && (data.ok || data.success)) {
        setMaskedEmail(data.maskedEmail || '');
        toast.success('Código de verificación generado');

        // In dev mode, show the code
        if (data.codigoVerificacion) {
          toast.info(`Código de prueba: ${data.codigoVerificacion}`, { duration: 10000 });
        }

        setStep('verify');
      } else {
        toast.error(data.message || 'Error al solicitar código de verificación');
      }
    } catch (error) {
      console.error('Error requesting code:', error);
      toast.error('Error al solicitar código de verificación');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndChangePassword = async () => {
    // Validations
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Ingrese un código de verificación válido (6 dígitos)');
      return;
    }

    if (!newPassword || newPassword.length < 12) {
      toast.error('La contraseña debe tener al menos 12 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordStrength < 4) {
      toast.error('La contraseña es muy débil. Por favor, elige una contraseña más segura.');
      return;
    }

    setLoading(true);
    try {
      // Use codigoCliente from user.id (defined in AuthStore)
      const codigoCliente = user?.id || user?.codigoCliente || user?.customerCode || user?.code;
      if (!codigoCliente) {
        toast.error('No se encontró el código de cliente');
        return;
      }

      const response = await secureFetch('/api/auth/v2/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoCliente,
          codigoVerificacion: verificationCode,
          nuevaPassword: newPassword
        })
      });

      const data = response.data as any; // secureFetch already parses JSON

      if (response.ok && (data.ok || data.success)) {
        toast.success('Contraseña cambiada exitosamente');
        onClose();
      } else {
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Simple password strength check (client-side only, real check is on backend)
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }

    let strength = 0;
    let feedback = '';

    // Length check
    if (newPassword.length >= 12) strength++;
    if (newPassword.length >= 16) strength++;

    // Complexity checks
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    // Normalize to 0-4 scale
    if (strength >= 6) strength = 4;
    else if (strength >= 5) strength = 3;
    else if (strength >= 4) strength = 2;
    else if (strength >= 2) strength = 1;
    else strength = 0;

    // Feedback
    if (strength === 0) feedback = 'Muy débil';
    else if (strength === 1) feedback = 'Débil';
    else if (strength === 2) feedback = 'Aceptable';
    else if (strength === 3) feedback = 'Fuerte';
    else feedback = 'Muy fuerte';

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  }, [newPassword]);

  const handleClose = () => {
    // Reset all states
    setStep('check');
    setCanChange(false);
    setDaysRemaining(0);
    setLastChangeDate('');
    setIsLegacy(false);
    setMaskedEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordStrength(0);
    setPasswordFeedback('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e: any) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cambiar Contraseña</h2>
                        <p className="text-sm text-gray-500">Actualiza tu contraseña de forma segura</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 pt-2">
                {/* Step 1: Cooldown Check */}
                {step === 'check' && (
                  <div className="space-y-6">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-4" />
                        <p className="text-gray-600">Verificando permisos...</p>
                      </div>
                    ) : !canChange ? (
                      daysRemaining > 0 ? (
                        <div className="space-y-4">
                          {/* Cooldown Warning */}
                          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h3 className="font-bold text-amber-900 mb-1">Período de Espera Activo</h3>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                  Por seguridad, solo puedes cambiar tu contraseña una vez cada 30 días.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Último cambio:</span>
                              <span className="text-sm font-bold text-gray-900">
                                {lastChangeDate ? new Date(lastChangeDate).toLocaleDateString('es-ES') : 'Nunca'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Días restantes:</span>
                              <span className="text-sm font-bold text-amber-600">
                                {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                              </span>
                            </div>
                          </div>

                          {/* Close Button */}
                          <button
                            onClick={handleClose}
                            className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                          >
                            Entendido
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6 text-center py-8">
                          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <X className="w-8 h-8 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No se pudo verificar el permiso</h3>
                            <p className="text-gray-500">
                              Ocurrió un error al verificar el estado de su cuenta. Por favor contacte con soporte.
                            </p>
                          </div>
                          <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                          >
                            Cerrar
                          </button>
                        </div>
                      )
                    ) : null}
                  </div>
                )}

                {/* Step 2: Request Verification Code */}
                {step === 'request' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-blue-900 mb-1">Verificación Requerida</h3>
                          <p className="text-sm text-blue-800 leading-relaxed">
                            Para cambiar tu contraseña, necesitas un código de verificación.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={requestVerificationCode}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Generando código...
                        </>
                      ) : (
                        <>
                          <Key className="w-5 h-5" />
                          Solicitar Código de Verificación
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Step 3: Verify Code & Change Password */}
                {step === 'verify' && (
                  <div className="space-y-6">
                    {/* Email Info */}
                    {maskedEmail && (
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-emerald-900 mb-1">Código Generado</h3>
                            <p className="text-sm text-emerald-800">
                              Se ha generado un código de verificación para <strong>{maskedEmail}</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verification Code Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Código de Verificación (6 dígitos)
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl text-center text-2xl font-mono tracking-widest transition-all"
                      />
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 12 caracteres"
                          className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength >= level
                                  ? passwordStrength === 1
                                    ? 'bg-red-500'
                                    : passwordStrength === 2
                                      ? 'bg-orange-500'
                                      : passwordStrength === 3
                                        ? 'bg-yellow-500'
                                        : 'bg-emerald-500'
                                  : 'bg-gray-200'
                                  }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${passwordStrength === 0 ? 'text-gray-500' :
                            passwordStrength === 1 ? 'text-red-600' :
                              passwordStrength === 2 ? 'text-orange-600' :
                                passwordStrength === 3 ? 'text-yellow-600' :
                                  'text-emerald-600'
                            }`}>
                            Fortaleza: {passwordFeedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la contraseña"
                          className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 rounded-xl transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Match Indicator */}
                      {confirmPassword && (
                        <p className={`text-xs font-medium ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                          {newPassword === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={verifyAndChangePassword}
                      disabled={loading || !verificationCode || !newPassword || !confirmPassword || passwordStrength < 4}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Cambiando contraseña...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Cambiar Contraseña
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
