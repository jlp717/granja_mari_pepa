'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Mail, Shield, Star, ArrowRight, Sparkles, Crown, TrendingUp, AlertCircle, X, Clipboard, FileText, BarChart3, Phone, CheckCircle, Check } from 'lucide-react';
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
import { useTranslations } from 'next-intl';
import AuthFlowManager from '@/components/auth/AuthFlowManager';
import { secureFetch } from '@/lib/secureFetch';

const loginFormSchema = z.object({
  codigoCliente: z.string().min(1, 'Código de cliente es requerido'),
  password: z.string().min(1, 'Contraseña es requerida')
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function CustomerAreaPage() {
  const t = useTranslations('customerArea');
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
  const [showPasswordChangeFlow, setShowPasswordChangeFlow] = useState(false);
  const [loginData, setLoginData] = useState<{ customerId: number; password: string } | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [isConfiguringEmail, setIsConfiguringEmail] = useState(false);
  const [showEmailSetupModal, setShowEmailSetupModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const { isAuthenticated, login, user } = useAuthStore();

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
      const result = await login(data.codigoCliente, data.password);

      // DEBUG: Log what we received from backend
      console.log('🔍 Login result:', {
        success: result.success,
        showPasswordChangeModal: result.showPasswordChangeModal,
        requiresEmailSetup: result.requiresEmailSetup,
        message: result.message
      });

      if (result.success) {
        // ✅ Login exitoso

        // PRIORITY 1: Si necesita cambiar contraseña (usuario legacy), mostrar flujo PRIMERO
        if (result.showPasswordChangeModal) {
          console.log('🔐 Showing password change modal');
          // Obtener el customerId del store después del login exitoso
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.customerId) {
            setLoginData({
              customerId: currentUser.customerId,
              password: data.password,
              codigoCliente: data.codigoCliente,
              needsEmailSetup: result.requiresEmailSetup || false // Store in loginData to avoid closure issue
            });
            setShowPasswordChangeFlow(true);
            toast.success('¡Bienvenido! Recomendamos cambiar tu contraseña.');
            setIsLoading(false);
            return;
          }
        }

        // PRIORITY 2: Check if email/phone setup is required (only if no password modal)
        if (result.requiresEmailSetup) {
          console.log('📧 Showing email setup modal');
          setForgotPasswordClientCode(data.codigoCliente); // Reuse client code state
          setLoginData({ customerId: 0, password: data.password }); // Save password for re-login
          setShowEmailSetupModal(true);
          toast('Por seguridad, necesitamos que configures tu email y teléfono.', { icon: '📧' });
          setIsLoading(false);
          return;
        }

        // No modals needed
        toast.success('¡Bienvenido! Has iniciado sesión correctamente.');
      } else {
        setErrorMessage('Credenciales incorrectas. Verifica tu código de cliente y contraseña.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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
      // Verificar si puede cambiar contraseña (restricción 30 días)
      const checkResponse = await fetch(`/api/auth/v2/verificar-cambio/${forgotPasswordClientCode}`);
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
      const response = await fetch('/api/auth/v2/solicitar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoCliente: forgotPasswordClientCode }),
      });

      const data = await response.json();

      // Check if user needs to configure email first
      if (data.needsEmail) {
        setNeedsEmail(true);
        toast.error(data.message || 'Necesitas configurar tu email para recuperar la contraseña');
        return;
      }

      if (response.ok && (data.success || data.ok)) {
        setClientName(data.nombreCliente || '');
        setForgotPasswordStep('code');

        const emailMasked = data.emailMasked || data.maskedEmail || 'tu email registrado';
        toast.success(`Código enviado a ${emailMasked}. Revisa tu bandeja de entrada.`);
      } else {
        toast.error(data.error || data.message || 'Error al procesar la solicitud');
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

  // Configure email for password reset
  const handleConfigureEmail = async () => {
    if (!tempEmail) {
      toast.error('Por favor, ingresa tu email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      toast.error('Email inválido');
      return;
    }

    setIsConfiguringEmail(true);
    try {
      const response = await fetch('/api/auth/v2/configure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          email: tempEmail
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.ok)) {
        toast.success('Email configurado correctamente');
        setNeedsEmail(false);
        setTempEmail('');

        // Retry requesting verification code now that email is configured
        await handleRequestVerificationCode();
      } else {
        toast.error(data.message || 'Error al configurar email');
      }
    } catch (error) {
      console.error('Error configurando email:', error);
      toast.error('Error al configurar email. Inténtalo más tarde.');
    } finally {
      setIsConfiguringEmail(false);
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

    if (newPassword.length < 12) {
      toast.error('La contraseña debe tener al menos 12 caracteres');
      return;
    }

    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/v2/verificar-codigo', {
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
        // Show the actual error message from the backend
        const errorMsg = data.message || data.error || 'Error al cambiar la contraseña';
        toast.error(errorMsg);
        console.error('Password change error:', errorMsg);
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
    setNeedsEmail(false);
    setTempEmail('');
  };


  // 🔧 FIX: Scroll al top inmediatamente cuando el usuario se autentica
  // Esto evita que se vea el footer durante la transición
  useLayoutEffect(() => {
    if (isAuthenticated) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isAuthenticated]);

  // Function to handle email setup submission - MUST be declared BEFORE authenticated section uses it
  const handleEmailSetupSubmit = async () => {
    if (!tempEmail || !tempPhone) {
      toast.error('Por favor, completa email y teléfono');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      toast.error('Email inválido');
      return;
    }

    // Validate phone format (at least 9 digits)
    const phoneRegex = /^\d{9,}$/;
    if (!phoneRegex.test(tempPhone.replace(/\s/g, ''))) {
      toast.error('Teléfono debe tener al menos 9 dígitos');
      return;
    }

    setIsConfiguringEmail(true);
    try {
      // Use secureFetch to include CSRF token automatically
      const response = await secureFetch('/api/auth/v2/configure-email', {
        method: 'POST',
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          email: tempEmail,
          telefono: tempPhone
        }),
      });

      if (response.ok && (response.data?.success || response.data?.ok)) {
        toast.success('Email y teléfono configurados correctamente');
        setShowEmailSetupModal(false);
        setTempEmail('');
        setTempPhone('');

        // Reload to refresh user data
        window.location.reload();
      } else {
        toast.error(response.data?.message || 'Error al guardar email');
      }
    } catch (error) {
      console.error('Error guardando email:', error);
      toast.error('Error al guardar. Inténtalo más tarde.');
    } finally {
      setIsConfiguringEmail(false);
    }
  };

  if (isAuthenticated) {
    return (
      <>
        <CustomerDashboard />

        {/* Flujo de cambio de contraseña para usuarios legacy */}
        {showPasswordChangeFlow && loginData && (
          <AuthFlowManager
            showLegacyWarning={true}
            customerId={loginData.customerId}
            currentPassword={loginData.password}
            onFlowComplete={() => {
              // Read from loginData to avoid closure issue
              const needsEmailSetup = (loginData as any).needsEmailSetup;
              const codigoCliente = (loginData as any).codigoCliente;
              console.log('🔐 Password flow complete, needsEmailSetup:', needsEmailSetup);

              setShowPasswordChangeFlow(false);
              setLoginData(null);

              // If user needs to configure email/phone, show that modal now
              if (needsEmailSetup) {
                console.log('📧 Showing email setup modal after password flow');
                setForgotPasswordClientCode(codigoCliente);
                setShowEmailSetupModal(true);
                toast('Ahora configura tu email y teléfono para recuperación de contraseña.', { icon: '📧' });
              }
            }}
          />
        )}

        {/* Modal de configuración de email/teléfono OBLIGATORIO - en sección autenticada */}
        <AnimatePresence>
          {showEmailSetupModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto mx-2 sm:mx-0"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-6 text-white text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold">{t('emailSetup.title')}</h3>
                  <p className="text-amber-100 mt-2 text-sm sm:text-base">
                    {t('emailSetup.subtitle')}
                  </p>
                </div>

                <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
                    <p className="text-xs sm:text-sm text-blue-900">
                      <strong>📌 {t('emailSetup.data_usage')}</strong> {t('emailSetup.data_usage_desc')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('emailSetup.email')} *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          className="w-full pl-10 h-12 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('emailSetup.phone')} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          placeholder="612345678"
                          className="w-full pl-10 h-12 border-2 border-gray-300 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEmailSetupSubmit}
                    disabled={!tempEmail || !tempPhone || isConfiguringEmail}
                    className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfiguringEmail ? t('emailSetup.saving') : t('emailSetup.save')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
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
                {t('exclusiveBadge')}
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
                  {t('welcome')}
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {t('welcomeHighlight')}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl text-gray-600 leading-relaxed"
                >
                  {t('description')}
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
                  { icon: TrendingUp, title: t('features.history'), desc: t('features.historyDesc') },
                  { icon: Shield, title: t('features.security'), desc: t('features.securityDesc') },
                  { icon: Star, title: t('features.priority'), desc: t('features.priorityDesc') }
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
                      {t('login.title')}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="text-gray-600"
                    >
                      {t('login.subtitle')}
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
                            <FormLabel className="text-gray-700 font-medium">{t('login.clientCode')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedInput === 'codigoCliente' ? 'text-blue-600' : 'text-gray-400'
                                  }`} />
                                <Input
                                  type="text"
                                  placeholder={t('login.clientCodePlaceholder')}
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
                            <FormLabel className="text-gray-700 font-medium">{t('login.password')}</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${focusedInput === 'password' ? 'text-blue-600' : 'text-gray-400'
                                  }`} />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder={t('login.passwordPlaceholder')}
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
                              {t('login.loggingIn')}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {t('login.accessButton')}
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
                      {t('login.forgotPassword')}
                    </motion.button>

                    <div className="text-sm text-gray-600">
                      {t('login.needAccount')}{' '}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          toast(t('login.contactToast'), {
                            duration: 8000,
                            style: {
                              background: '#3B82F6',
                              color: '#FFFFFF',
                              padding: '16px',
                              borderRadius: '8px',
                              whiteSpace: 'pre-line',
                            },
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                      >
                        {t('login.contactUs')}
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
                {t('publicFeatures.badge')}
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
              >
                {t('publicFeatures.title')}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-gray-600 max-w-2xl mx-auto text-lg"
              >
                {t('publicFeatures.subtitle')}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Clipboard,
                  title: t('publicFeatures.items.orders.title'),
                  desc: t('publicFeatures.items.orders.desc'),
                  gradient: 'from-blue-500 to-indigo-600',
                  bgGlow: 'bg-blue-500/20',
                  stats: '24/7',
                  statsLabel: t('publicFeatures.items.orders.label')
                },
                {
                  icon: FileText,
                  title: t('publicFeatures.items.invoices.title'),
                  desc: t('publicFeatures.items.invoices.desc'),
                  gradient: 'from-purple-500 to-pink-600',
                  bgGlow: 'bg-purple-500/20',
                  stats: '100%',
                  statsLabel: t('publicFeatures.items.invoices.label')
                },
                {
                  icon: User,
                  title: t('publicFeatures.items.profile.title'),
                  desc: t('publicFeatures.items.profile.desc'),
                  gradient: 'from-emerald-500 to-teal-600',
                  bgGlow: 'bg-emerald-500/20',
                  stats: '∞',
                  statsLabel: t('publicFeatures.items.profile.label')
                },
                {
                  icon: BarChart3,
                  title: t('publicFeatures.items.stats.title'),
                  desc: t('publicFeatures.items.stats.desc'),
                  gradient: 'from-amber-500 to-orange-600',
                  bgGlow: 'bg-amber-500/20',
                  stats: '📊',
                  statsLabel: t('publicFeatures.items.stats.label')
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
                      {t('publicFeatures.cta.title')}
                    </h4>
                    <p className="text-blue-100 text-sm md:text-base">
                      {t('publicFeatures.cta.desc')}
                    </p>
                  </div>
                  <motion.a
                    href="/contacto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t('publicFeatures.cta.button')}
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

                      {/* Show email configuration if needed */}
                      {needsEmail && (
                        <div className="space-y-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div className="text-sm text-amber-800">
                              <strong>Email requerido</strong>
                              <p className="mt-1">Para recuperar tu contraseña necesitas configurar tu email primero.</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tu email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleConfigureEmail}
                            disabled={!tempEmail || isConfiguringEmail}
                            className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-xl"
                          >
                            {isConfiguringEmail ? (
                              <LoadingSpinner className="w-5 h-5" />
                            ) : (
                              <>
                                Configurar email y continuar
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {!needsEmail && (
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
                      )}
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

                      {/* Código de verificación */}
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
                          disabled={codeVerified}
                        />
                      </div>

                      {/* Helpful hint about email - only show before code is verified */}
                      {!codeVerified && (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-800 text-center">
                            📬 Revisa tu <strong>bandeja de entrada</strong> y carpeta de <strong>spam</strong>. El código tardará unos segundos en llegar.
                          </p>
                        </div>
                      )}

                      {/* Password fields - only show after code is verified */}
                      {codeVerified && (
                        <>
                          <div className="bg-green-50 p-3 rounded-xl border border-green-300">
                            <p className="text-sm text-green-800 text-center">
                              ✅ Código verificado. Ahora elige una contraseña segura.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nueva Contraseña
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 12 caracteres"
                                className="pl-10 pr-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {/* Password strength indicator */}
                            {newPassword && (
                              <div className="mt-2">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                      key={level}
                                      className={`h-1 flex-1 rounded ${newPassword.length >= level * 3
                                        ? newPassword.length >= 12
                                          ? 'bg-green-500'
                                          : newPassword.length >= 8
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        : 'bg-gray-200'
                                        }`}
                                    />
                                  ))}
                                </div>
                                <p className={`text-xs mt-1 ${newPassword.length >= 12 ? 'text-green-600' :
                                  newPassword.length >= 8 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                  {newPassword.length >= 12 ? '✓ Contraseña fuerte' :
                                    newPassword.length >= 8 ? '⚠ Contraseña aceptable (recomendamos 12+ caracteres)' :
                                      '✗ Contraseña muy corta (mínimo 12 caracteres)'}
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirmar Contraseña
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type={showConfirmNewPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
                                className="pl-10 pr-10 h-12 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmNewPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                              <p className="text-xs text-red-600 mt-1">✗ Las contraseñas no coinciden</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && (
                              <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
                            )}
                          </div>
                        </>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setForgotPasswordStep('clientCode');
                            setCodeVerified(false);
                            setVerificationCode('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="flex-1 h-12 border-2"
                        >
                          Atrás
                        </Button>

                        {!codeVerified ? (
                          <Button
                            onClick={async () => {
                              if (verificationCode.length !== 6) {
                                toast.error('El código debe tener 6 dígitos');
                                return;
                              }
                              setIsLoading(true);
                              try {
                                const response = await fetch('/api/auth/v2/verificar-solo-codigo', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    codigoCliente: forgotPasswordClientCode,
                                    codigoVerificacion: verificationCode
                                  })
                                });
                                const data = await response.json();
                                if (response.ok && (data.success || data.ok)) {
                                  setCodeVerified(true);
                                  toast.success('Código verificado correctamente');
                                } else {
                                  toast.error(data.message || 'Código incorrecto');
                                }
                              } catch (error) {
                                console.error('Error verificando código:', error);
                                toast.error('Error al verificar el código');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={verificationCode.length !== 6 || isLoading}
                            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                          >
                            {isLoading ? (
                              <LoadingSpinner className="w-5 h-5" />
                            ) : (
                              'Verificar Código'
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleVerifyCode}
                            disabled={newPassword.length < 12 || newPassword !== confirmPassword || isLoading}
                            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                          >
                            {isLoading ? (
                              <LoadingSpinner className="w-5 h-5" />
                            ) : (
                              'Cambiar Contraseña'
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Paso 3: Éxito - Modal Celebratorio */}
                  {forgotPasswordStep === 'success' && (
                    <motion.div
                      key="success-step"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="text-center space-y-5"
                    >
                      {/* Icono celebratorio con animación */}
                      <div className="relative mx-auto w-24 h-24">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", delay: 0.1, stiffness: 150 }}
                          className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
                        >
                          <Shield className="w-12 h-12 text-white" />
                        </motion.div>
                        {/* Confetti dots */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: Math.cos(i * 45 * Math.PI / 180) * 50,
                              y: Math.sin(i * 45 * Math.PI / 180) * 50
                            }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
                            className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-400'][i % 4]
                              }`}
                          />
                        ))}
                      </div>

                      {/* Título y mensaje */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">
                          🎉 ¡Enhorabuena!
                        </h4>
                        <p className="text-lg text-green-700 font-semibold">
                          Tu contraseña ha sido actualizada
                        </p>
                      </motion.div>

                      {/* Lista de beneficios */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200"
                      >
                        <h5 className="text-sm font-bold text-green-800 mb-3 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Tu cuenta ahora es más segura
                        </h5>
                        <ul className="space-y-2 text-left text-sm text-green-700">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>Contraseña protegida con cifrado bancario</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>Mayor protección contra accesos no autorizados</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>Cumples con las mejores prácticas de seguridad</span>
                          </li>
                        </ul>
                      </motion.div>

                      {/* Recordatorios */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-blue-50 p-3 rounded-xl border border-blue-200"
                      >
                        <p className="text-xs text-blue-800 flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Guarda tu contraseña en un lugar seguro</span>
                        </p>
                      </motion.div>

                      {/* Botón para continuar */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Button
                          onClick={resetForgotPasswordModal}
                          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30"
                        >
                          <motion.div
                            className="flex items-center gap-2"
                            whileHover={{ x: 5 }}
                          >
                            Iniciar Sesión
                            <ArrowRight className="w-5 h-5" />
                          </motion.div>
                        </Button>
                      </motion.div>
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

  // Note: Removed duplicate handleEmailSetupSubmit - already declared above line 331

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 overflow-hidden relative">
      {/* ... existing content ... */}

      {/* Existing content is rendered above, I am appending the modal here */}
      <AnimatePresence>
        {showEmailSetupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Configuración de Contacto</h3>
                <p className="text-amber-100 mt-2">
                  Para tu seguridad, necesitamos configurar tus datos de contacto.
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>📌 Uso de tus datos:</strong> Solo para <strong>recuperar tu contraseña</strong> y <strong>enviar facturas</strong>.
                    No compartimos ni usamos esta información para otros fines.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="tel"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        placeholder="612345678"
                        className="pl-10 h-12 border-2 border-gray-300 bg-white text-gray-900 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleEmailSetupSubmit}
                  disabled={!tempEmail || !tempPhone || isConfiguringEmail}
                  className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-lg"
                >
                  {isConfiguringEmail ? <LoadingSpinner /> : 'Guardar y Continuar'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}