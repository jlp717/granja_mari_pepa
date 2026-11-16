"use client";
import { OperationalSurface } from "@/components/gmp/operations/Operations";

import { useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Shield,
  ArrowRight,
  AlertCircle,
  X,
  Phone,
  CheckCircle,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { CustomerDashboard } from "@/components/customer/dashboard";
import { PanamarDashboard } from "@/components/panamar/PanamarDashboard";
import { useLocale, useTranslations } from "next-intl";
import {
  OperationsFrame,
  OperationsIntro,
} from "@/components/gmp/operations/Operations";
import { useOperationsCopy } from "@/components/gmp/operations/copy";
import ops from "@/components/gmp/operations/operations.module.css";
import AuthFlowManager from "@/components/auth/AuthFlowManager";
import { secureFetch } from "@/lib/secureFetch";

const loginFormSchema = z.object({
  codigoCliente: z.string().min(1, "Código de cliente es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;
type PendingLoginData = {
  customerId: number;
  password: string;
  codigoCliente?: string;
  needsEmailSetup?: boolean;
};

export default function CustomerAreaPage() {
  const t = useTranslations("customerArea");
  const locale = useLocale();
  const copy = useOperationsCopy();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<
    "clientCode" | "code" | "newPassword" | "success"
  >("clientCode");
  const [forgotPasswordClientCode, setForgotPasswordClientCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [, setDevVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [canChangePassword, setCanChangePassword] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPasswordChangeFlow, setShowPasswordChangeFlow] = useState(false);
  const [loginData, setLoginData] = useState<PendingLoginData | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [isConfiguringEmail, setIsConfiguringEmail] = useState(false);
  const [showEmailSetupModal, setShowEmailSetupModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const { isAuthenticated, login, isPanamarMode } = useAuthStore();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      codigoCliente: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await login(data.codigoCliente, data.password);

      if (result.success) {
        // Login exitoso

        // PRIORITY 1: Si necesita cambiar contraseña (usuario legacy), mostrar flujo PRIMERO
        if (result.showPasswordChangeModal) {
          // Obtener el customerId del store después del login exitoso
          const currentUser = useAuthStore.getState().user;
          if (currentUser?.customerId) {
            setLoginData({
              customerId: currentUser.customerId,
              password: data.password,
              codigoCliente: data.codigoCliente,
              needsEmailSetup: result.requiresEmailSetup || false, // Store in loginData to avoid closure issue
            });
            setShowPasswordChangeFlow(true);
            toast.success("¡Bienvenido! Recomendamos cambiar tu contraseña.");
            setIsLoading(false);
            return;
          }
        }

        // PRIORITY 2: Check if email/phone setup is required (only if no password modal)
        if (result.requiresEmailSetup) {
          setForgotPasswordClientCode(data.codigoCliente); // Reuse client code state
          setLoginData({ customerId: 0, password: data.password }); // Save password for re-login
          setShowEmailSetupModal(true);
          toast(
            "Por seguridad, necesitamos que configures tu email y teléfono.",
          );
          setIsLoading(false);
          return;
        }

        // No modals needed
        toast.success("¡Bienvenido! Has iniciado sesión correctamente.");
      } else {
        setErrorMessage(
          "Credenciales incorrectas. Verifica tu código de cliente y contraseña.",
        );
        setShowErrorModal(true);
      }
    } catch {
      setErrorMessage(
        "Error al iniciar sesión. Por favor, inténtalo más tarde.",
      );
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 1: Solicitar código de verificación (solo con código de cliente)
  const handleRequestVerificationCode = async () => {
    if (!forgotPasswordClientCode) {
      toast.error("Por favor, ingresa tu código de cliente");
      return;
    }

    setIsLoading(true);
    try {
      // Verificar si puede cambiar contraseña (restricción 30 días)
      const checkResponse = await fetch(
        `/api/auth/v2/verificar-cambio/${forgotPasswordClientCode}`,
      );
      const checkData = await checkResponse.json();

      if (!checkData.puedeCambiar && !checkData.esPrimerCambio) {
        setCanChangePassword(false);
        setDaysRemaining(checkData.diasRestantes || 0);

        // Construir mensaje informativo con fechas
        let mensaje = `No puedes cambiar la contraseña todavía.`;
        if (checkData.fechaUltimoCambio) {
          const fechaUltimo = new Date(checkData.fechaUltimoCambio);
          mensaje += `\n\nÚltimo cambio: ${fechaUltimo.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
        }
        if (checkData.fechaProximoCambio) {
          const fechaProximo = new Date(checkData.fechaProximoCambio);
          mensaje += `\nPodrás cambiarla a partir del: ${fechaProximo.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
        }
        mensaje += `\n\nDebes esperar ${checkData.diasRestantes} día${checkData.diasRestantes > 1 ? "s" : ""} más.`;

        toast.error(mensaje, { duration: 6000 });
        return;
      }

      // Solicitar código de verificación
      const response = await fetch("/api/auth/v2/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoCliente: forgotPasswordClientCode }),
      });

      const data = await response.json();

      // Check if user needs to configure email first
      if (data.needsEmail) {
        setNeedsEmail(true);
        toast.error(
          data.message ||
            "Necesitas configurar tu email para recuperar la contraseña",
        );
        return;
      }

      if (response.ok && (data.success || data.ok)) {
        setClientName(data.nombreCliente || "");
        setForgotPasswordStep("code");

        const emailMasked =
          data.emailMasked || data.maskedEmail || "tu email registrado";
        toast.success(
          `Código enviado a ${emailMasked}. Revisa tu bandeja de entrada.`,
        );
      } else {
        toast.error(
          data.error || data.message || "Error al procesar la solicitud",
        );
        if (data.diasRestantes) {
          setCanChangePassword(false);
          setDaysRemaining(data.diasRestantes);
        }
      }
    } catch {
      toast.error("Error al procesar la solicitud. Inténtalo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Configure email for password reset
  const handleConfigureEmail = async () => {
    if (!tempEmail) {
      toast.error("Por favor, ingresa tu email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      toast.error("Email inválido");
      return;
    }

    setIsConfiguringEmail(true);
    try {
      const response = await fetch("/api/auth/v2/configure-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          email: tempEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.ok)) {
        toast.success("Email configurado correctamente");
        setNeedsEmail(false);
        setTempEmail("");

        // Retry requesting verification code now that email is configured
        await handleRequestVerificationCode();
      } else {
        toast.error(data.message || "Error al configurar email");
      }
    } catch {
      toast.error("Error al configurar email. Inténtalo más tarde.");
    } finally {
      setIsConfiguringEmail(false);
    }
  };

  // Paso 2: Verificar código y mostrar confirmación
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos");
      return;
    }

    // Mostrar diálogo de confirmación antes de cambiar
    setShowConfirmDialog(true);
  };

  // Paso 3: Confirmar cambio de contraseña
  const handleConfirmPasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 12) {
      toast.error("La contraseña debe tener al menos 12 caracteres");
      return;
    }

    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/v2/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          codigoVerificacion: verificationCode,
          nuevaPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotPasswordStep("success");
        toast.success("¡Contraseña cambiada exitosamente!");
      } else {
        // Show the actual error message from the backend
        const errorMsg =
          data.message || data.error || "Error al cambiar la contraseña";
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordStep("clientCode");
    setForgotPasswordClientCode("");
    setClientName("");
    setVerificationCode("");
    setDevVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setCanChangePassword(true);
    setDaysRemaining(0);
    setShowConfirmDialog(false);
    setNeedsEmail(false);
    setTempEmail("");
  };

  // FIX: Scroll al top inmediatamente cuando el usuario se autentica
  // Esto evita que se vea el footer durante la transición
  useLayoutEffect(() => {
    if (isAuthenticated) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [isAuthenticated]);

  // Function to handle email setup submission - MUST be declared BEFORE authenticated section uses it
  const handleEmailSetupSubmit = async () => {
    if (!tempEmail || !tempPhone) {
      toast.error("Por favor, completa email y teléfono");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      toast.error("Email inválido");
      return;
    }

    // Validate phone format (at least 9 digits)
    const phoneRegex = /^\d{9,}$/;
    if (!phoneRegex.test(tempPhone.replace(/\s/g, ""))) {
      toast.error("Teléfono debe tener al menos 9 dígitos");
      return;
    }

    setIsConfiguringEmail(true);
    try {
      // Use secureFetch to include CSRF token automatically
      const response = await secureFetch("/api/auth/v2/configure-email", {
        method: "POST",
        body: JSON.stringify({
          codigoCliente: forgotPasswordClientCode,
          email: tempEmail,
          telefono: tempPhone,
        }),
      });
      const data = response.data as
        | { success?: boolean; ok?: boolean; message?: string }
        | undefined;

      if (response.ok && (data?.success || data?.ok)) {
        toast.success("Email y teléfono configurados correctamente");
        setShowEmailSetupModal(false);
        setTempEmail("");
        setTempPhone("");

        // Reload to refresh user data
        window.location.reload();
      } else {
        toast.error(data?.message || "Error al guardar email");
      }
    } catch {
      toast.error("Error al guardar. Inténtalo más tarde.");
    } finally {
      setIsConfiguringEmail(false);
    }
  };

  if (isAuthenticated) {
    // Modo PANAMAR: dashboard especial para cliente 9999999999
    if (isPanamarMode) {
      return <PanamarDashboard />;
    }

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
              const needsEmailSetup = loginData.needsEmailSetup;
              const codigoCliente = loginData.codigoCliente;

              setShowPasswordChangeFlow(false);
              setLoginData(null);

              // If user needs to configure email/phone, show that modal now
              if (needsEmailSetup) {
                setForgotPasswordClientCode(codigoCliente ?? "");
                setShowEmailSetupModal(true);
                toast(
                  "Ahora configura tu email y teléfono para recuperación de contraseña.",
                );
              }
            }}
          />
        )}

        {/* Modal de configuración de email/teléfono OBLIGATORIO - en sección autenticada */}
        <AnimatePresence>
          {showEmailSetupModal && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center p-2 sm:p-4"
            >
              <motion.div
                initial={false}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-card w-full max-w-md max-h-[95vh] overflow-y-auto mx-2 sm:mx-0"
              >
                <div className="p-4 sm:p-6 text-foreground text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-card flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-normal">
                    {t("emailSetup.title")}
                  </h3>
                  <p className="text-foreground mt-2 text-sm sm:text-base">
                    {t("emailSetup.subtitle")}
                  </p>
                </div>

                <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                  <div className="bg-card border-l-4 border-border p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-foreground">
                      <strong>{t("emailSetup.data_usage")}</strong>{" "}
                      {t("emailSetup.data_usage_desc")}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("emailSetup.email")} *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          className="w-full pl-10 h-12 border-2 border-border bg-card text-foreground focus:border-border focus:ring-[var(--gmp-accent)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t("emailSetup.phone")} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          placeholder="612345678"
                          className="w-full pl-10 h-12 border-2 border-border bg-card text-foreground focus:border-border focus:ring-[var(--gmp-accent)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEmailSetupSubmit}
                    disabled={!tempEmail || !tempPhone || isConfiguringEmail}
                    className="w-full h-12 text-foreground font-normal text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfiguringEmail
                      ? t("emailSetup.saving")
                      : t("emailSetup.save")}
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
    <OperationsFrame routeId="area-clientes" mode="ambient" world="gmp">
      <div className={ops.accessGrid}>
        <OperationsIntro
          id="access-intro"
          label={copy.accessLabel}
          title={copy.accessTitle}
          body={copy.accessBody}
          compact
        />
        <section
          id="access-form"
          className={ops.formPanel}
          aria-label={copy.accessLabel}
          data-fx="form-feedback"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={ops.form}>
              <FormField
                control={form.control}
                name="codigoCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.clientCode")}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="username"
                        placeholder="0123456789"
                        {...field}
                        disabled={isLoading}
                        onFocus={() => setFocusedInput("codigoCliente")}
                        onBlur={() => setFocusedInput(null)}
                        data-focused={focusedInput === "codigoCliente"}
                      />
                    </FormControl>
                    <small>{copy.clientCodeHelp}</small>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.password")}</FormLabel>
                    <div className={ops.password}>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("login.passwordPlaceholder")}
                          {...field}
                          disabled={isLoading}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          data-focused={focusedInput === "password"}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("login.password")}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden="true" size={18} />
                        ) : (
                          <Eye aria-hidden="true" size={18} />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className={ops.button} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {t("login.loggingIn")}
                  </>
                ) : (
                  <>
                    {t("login.accessButton")}
                    <ArrowRight aria-hidden="true" size={16} />
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className={ops.link}
              >
                {t("login.forgotPassword")}
              </button>
            </form>
          </Form>
        </section>
      </div>
      <section
        id="access-help"
        className={ops.help}
        aria-label={copy.contact}
        data-fx="form-feedback"
      >
        <p>{copy.accessHelp}</p>
        <div className={ops.actions}>
          <a href={`/${locale}`} className={ops.link}>
            {copy.home}
          </a>
          <a href={`/${locale}/contacto`} className={ops.link}>
            {copy.contact}
          </a>
          <button
            type="button"
            className={ops.link}
            onClick={() => {
              toast(t("login.contactToast"), {
                duration: 8000,
                style: {
                  background: "var(--gmp-accent)",
                  color: "currentColor",
                  padding: "16px",
                  borderRadius: "8px",
                  whiteSpace: "pre-line",
                },
              });
            }}
          >
            {t("login.contactUs")}
          </button>
        </div>
      </section>
      {/* Modal de Error de Login */}
      <AnimatePresence>
        {showErrorModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowErrorModal(false)}
            >
              {/* Modal */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card p-8 border border-border max-w-md w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowErrorModal(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground hover:bg-card"
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={false}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-card flex items-center justify-center"
                  >
                    <AlertCircle className="w-10 h-10 text-muted-foreground" />
                  </motion.div>
                </div>

                {/* Content */}
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <h3 className="text-2xl font-normal text-foreground mb-4">
                    Error de autenticación
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {errorMessage}
                  </p>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowErrorModal(false)}
                      className="w-full bg-card hover:bg-card text-foreground font-normal py-3"
                    >
                      Intentar de nuevo
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowErrorModal(false);
                        setShowForgotPasswordModal(true);
                      }}
                      className="w-full text-muted-foreground hover:text-foreground py-2"
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
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center p-4"
            onClick={resetForgotPasswordModal}
          >
            <motion.div
              initial={false}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 text-foreground relative">
                <motion.button
                  onClick={resetForgotPasswordModal}
                  className="absolute top-4 right-4 p-1 hover:bg-card transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-card flex items-center justify-center">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-normal">
                      Recuperar Contraseña
                    </h3>
                    <p className="text-foreground text-sm">
                      {forgotPasswordStep === "clientCode" &&
                        "Ingresa tu código de cliente"}
                      {forgotPasswordStep === "code" &&
                        "Ingresa el código y nueva contraseña"}
                      {forgotPasswordStep === "newPassword" &&
                        "Define tu nueva contraseña"}
                      {forgotPasswordStep === "success" &&
                        "¡Contraseña restablecida!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Paso 1: Solo código de cliente */}
                  {forgotPasswordStep === "clientCode" && (
                    <motion.div
                      key="clientCode-step"
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Código de cliente
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="text"
                            value={forgotPasswordClientCode}
                            onChange={(e) =>
                              setForgotPasswordClientCode(e.target.value)
                            }
                            placeholder="Ej: 0123456789"
                            className="pl-10 h-12 border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                          />
                        </div>
                      </div>

                      {!canChangePassword && daysRemaining > 0 && (
                        <div className="bg-card p-4 border border-border">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="text-sm text-foreground">
                              <strong>
                                No puedes cambiar la contraseña todavía.
                              </strong>
                              <p className="mt-1">
                                Debes esperar {daysRemaining} día
                                {daysRemaining > 1 ? "s" : ""} más.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-card p-4 border border-border">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="text-sm text-foreground">
                            <strong>Proceso seguro:</strong>
                            <ol className="mt-2 space-y-1 list-decimal list-inside">
                              <li>Ingresa tu código de cliente</li>
                              <li>
                                Contacta con la empresa para obtener el código
                                de verificación
                              </li>
                              <li>Establece tu nueva contraseña</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      {/* Show email configuration if needed */}
                      {needsEmail && (
                        <div className="space-y-4 mt-4 p-4 bg-card border border-border">
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div className="text-sm text-foreground">
                              <strong>Email requerido</strong>
                              <p className="mt-1">
                                Para recuperar tu contraseña necesitas
                                configurar tu email primero.
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Tu email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="pl-10 h-12 border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleConfigureEmail}
                            disabled={!tempEmail || isConfiguringEmail}
                            className="w-full h-12 text-foreground font-normal"
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
                          disabled={
                            !forgotPasswordClientCode ||
                            isLoading ||
                            !canChangePassword
                          }
                          className="w-full h-12 text-foreground font-normal"
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
                  {forgotPasswordStep === "code" && (
                    <motion.div
                      key="code-step"
                      initial={false}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {clientName && (
                        <div className="bg-card p-3 border border-border text-center">
                          <p className="text-sm text-foreground">
                            Hola,{" "}
                            <span className="font-normal">{clientName}</span>
                          </p>
                        </div>
                      )}

                      {/* Código de verificación */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Código de verificación
                        </label>
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          placeholder="000000"
                          className="h-12 text-center text-2xl font-mono border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-[var(--gmp-accent)] tracking-widest"
                          maxLength={6}
                          disabled={codeVerified}
                        />
                      </div>

                      {/* Helpful hint about email - only show before code is verified */}
                      {!codeVerified && (
                        <div className="bg-card p-3 border border-border">
                          <p className="text-sm text-foreground text-center">
                            Revisa tu <strong>bandeja de entrada</strong> y
                            carpeta de <strong>spam</strong>. El código tardará
                            unos segundos en llegar.
                          </p>
                        </div>
                      )}

                      {/* Password fields - only show after code is verified */}
                      {codeVerified && (
                        <>
                          <div className="bg-card p-3 border border-border">
                            <p className="text-sm text-foreground text-center">
                              Código verificado. Ahora elige una contraseña
                              segura.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Nueva Contraseña
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 12 caracteres"
                                className="pl-10 pr-10 h-12 border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
                                      className="h-1 flex-1 bg-card"
                                    />
                                  ))}
                                </div>
                                <p className="text-xs mt-1 text-muted-foreground">
                                  {newPassword.length >= 12
                                    ? "Contraseña fuerte"
                                    : newPassword.length >= 8
                                      ? "Contraseña aceptable (recomendamos 12+ caracteres)"
                                      : "Contraseña muy corta (mínimo 12 caracteres)"}
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Confirmar Contraseña
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type={
                                  showConfirmNewPassword ? "text" : "password"
                                }
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                placeholder="Repite tu contraseña"
                                className="pl-10 pr-10 h-12 border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmNewPassword(
                                    !showConfirmNewPassword,
                                  )
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                              >
                                {showConfirmNewPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {confirmPassword &&
                              newPassword !== confirmPassword && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Las contraseñas no coinciden
                                </p>
                              )}
                            {confirmPassword &&
                              newPassword === confirmPassword && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Las contraseñas coinciden
                                </p>
                              )}
                          </div>
                        </>
                      )}

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setForgotPasswordStep("clientCode");
                            setCodeVerified(false);
                            setVerificationCode("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                          className="flex-1 h-12 border-2"
                        >
                          Atrás
                        </Button>

                        {!codeVerified ? (
                          <Button
                            onClick={async () => {
                              if (verificationCode.length !== 6) {
                                toast.error("El código debe tener 6 dígitos");
                                return;
                              }
                              setIsLoading(true);
                              try {
                                const response = await fetch(
                                  "/api/auth/v2/verificar-solo-codigo",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      codigoCliente: forgotPasswordClientCode,
                                      codigoVerificacion: verificationCode,
                                    }),
                                  },
                                );
                                const data = await response.json();
                                if (response.ok && (data.success || data.ok)) {
                                  setCodeVerified(true);
                                  toast.success(
                                    "Código verificado correctamente",
                                  );
                                } else {
                                  toast.error(
                                    data.message || "Código incorrecto",
                                  );
                                }
                              } catch {
                                toast.error("Error al verificar el código");
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={
                              verificationCode.length !== 6 || isLoading
                            }
                            className="flex-1 h-12 text-foreground font-normal"
                          >
                            {isLoading ? (
                              <LoadingSpinner className="w-5 h-5" />
                            ) : (
                              "Verificar Código"
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleVerifyCode}
                            disabled={
                              newPassword.length < 12 ||
                              newPassword !== confirmPassword ||
                              isLoading
                            }
                            className="flex-1 h-12 text-foreground font-normal"
                          >
                            {isLoading ? (
                              <LoadingSpinner className="w-5 h-5" />
                            ) : (
                              "Cambiar Contraseña"
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Paso 3: Éxito - Modal Celebratorio */}
                  {forgotPasswordStep === "success" && (
                    <motion.div
                      key="success-step"
                      initial={false}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center space-y-5"
                    >
                      {/* Icono celebratorio con animación */}
                      <div className="relative mx-auto w-24 h-24">
                        <motion.div
                          initial={false}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-24 h-24 flex items-center justify-center"
                        >
                          <Shield className="w-12 h-12 text-foreground" />
                        </motion.div>
                        {/* Confetti dots */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={false}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: Math.cos((i * 45 * Math.PI) / 180) * 50,
                              y: Math.sin((i * 45 * Math.PI) / 180) * 50,
                            }}
                            className={`absolute top-1/2 left-1/2 w-2 h-2 ${
                              ["bg-card", "bg-card", "bg-card", "bg-card"][
                                i % 4
                              ]
                            }`}
                          />
                        ))}
                      </div>

                      {/* Título y mensaje */}
                      <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h4 className="text-2xl font-normal text-foreground mb-2">
                          ¡Enhorabuena!
                        </h4>
                        <p className="text-lg text-foreground font-normal">
                          Tu contraseña ha sido actualizada
                        </p>
                      </motion.div>

                      {/* Lista de beneficios */}
                      <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-border"
                      >
                        <h5 className="text-sm font-normal text-foreground mb-3 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Tu cuenta ahora es más segura
                        </h5>
                        <ul className="space-y-2 text-left text-sm text-foreground">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>
                              Contraseña protegida con cifrado bancario
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>
                              Mayor protección contra accesos no autorizados
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>
                              Cumples con las mejores prácticas de seguridad
                            </span>
                          </li>
                        </ul>
                      </motion.div>

                      {/* Recordatorios */}
                      <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card p-3 border border-border"
                      >
                        <p className="text-xs text-foreground flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Guarda tu contraseña en un lugar seguro</span>
                        </p>
                      </motion.div>

                      {/* Botón para continuar */}
                      <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Button
                          onClick={resetForgotPasswordModal}
                          className="w-full h-14 text-foreground font-normal text-lg"
                        >
                          <motion.div className="flex items-center gap-2">
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
        <DialogContent className="sm:max-w-md bg-card border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              Confirmar cambio de contraseña
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta acción es importante y tiene consecuencias de seguridad.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-card border border-border p-4">
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Tu contraseña actual dejará de funcionar inmediatamente.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>
                      No podrás cambiar tu contraseña de nuevo durante 30 días.
                    </strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Asegúrate de recordar tu nueva contraseña o guárdala en un
                    lugar seguro.
                  </span>
                </li>
              </ul>
            </div>

            <p className="text-center text-foreground font-medium">
              ¿Estás seguro de que deseas continuar?
            </p>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 border-border text-foreground hover:bg-card"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPasswordChange}
              disabled={isLoading}
              className="flex-1 text-foreground"
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5" />
              ) : (
                "Sí, cambiar contraseña"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OperationsFrame>
  );

  // Note: Removed duplicate handleEmailSetupSubmit - already declared above line 331

  return (
    <OperationalSurface>
      <div className="min-h-[calc(100vh-12rem)] py-8 overflow-hidden relative">
        {/* ... existing content ... */}

        {/* Existing content is rendered above, I am appending the modal here */}
        <AnimatePresence>
          {showEmailSetupModal && (
            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={false}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-card w-full max-w-md overflow-hidden"
              >
                <div className="p-6 text-foreground text-center">
                  <div className="w-16 h-16 bg-card flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-normal">
                    Configuración de Contacto
                  </h3>
                  <p className="text-foreground mt-2">
                    Para tu seguridad, necesitamos configurar tus datos de
                    contacto.
                  </p>
                </div>

                <div className="p-8 space-y-6">
                  <div className="bg-card border-l-4 border-border p-4">
                    <p className="text-sm text-foreground">
                      <strong>Uso de tus datos:</strong> Solo para{" "}
                      <strong>recuperar tu contraseña</strong> y{" "}
                      <strong>enviar facturas</strong>. No compartimos ni usamos
                      esta información para otros fines.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          placeholder="ejemplo@correo.com"
                          className="pl-10 h-12 border-2 border-border bg-card text-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value)}
                          placeholder="612345678"
                          className="pl-10 h-12 border-2 border-border bg-card text-foreground focus:border-border focus:ring-[var(--gmp-accent)]"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEmailSetupSubmit}
                    disabled={!tempEmail || !tempPhone || isConfiguringEmail}
                    className="w-full h-12 text-foreground font-normal text-lg"
                  >
                    {isConfiguringEmail ? (
                      <LoadingSpinner />
                    ) : (
                      "Guardar y Continuar"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OperationalSurface>
  );
}
