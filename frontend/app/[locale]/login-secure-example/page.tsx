"use client";

/**
 * EJEMPLO DE INTEGRACIÓN - LOGIN SEGURO
 *
 * Este es un ejemplo completo de cómo integrar el sistema de autenticación segura
 * en una página de login de Next.js con TypeScript.
 *
 * Características implementadas:
 * - Login con contraseña legacy (NIF)
 * - Modal de advertencia automático para usuarios legacy
 * - Formulario de cambio de contraseña con validación en tiempo real
 * - Modal de éxito tras cambiar contraseña
 * - Gestión de tokens JWT
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  OperationsFrame,
  OperationsIntro,
} from "@/components/gmp/operations/Operations";
import { useOperationsCopy } from "@/components/gmp/operations/copy";
import ops from "@/components/gmp/operations/operations.module.css";
import { useRouter } from "next/navigation";
import LegacyPasswordWarningModal from "@/components/auth/LegacyPasswordWarningModal";
import PasswordChangeForm from "@/components/auth/PasswordChangeForm";
import PasswordChangeSuccessModal from "@/components/auth/PasswordChangeSuccessModal";

// Tipo de datos del cliente
interface Customer {
  id: number;
  code: string;
  fullName: string;
  email: string;
  isLegacyPassword: boolean;
}

// Resultado del cambio de contraseña
interface PasswordChangeResult {
  crackTimeDisplay: string;
  strengthScore: number;
}

export default function LoginSecureExample() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("customerArea");
  const copy = useOperationsCopy();

  // Estados del formulario de login
  const [customerCode, setCustomerCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados de modales
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Datos del cliente y resultado
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [changeResult, setChangeResult] = useState<PasswordChangeResult | null>(
    null,
  );

  /**
   * Manejar el login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Llamar a la API de login seguro
      const response = await fetch(
        "http://localhost:5000/api/auth/secure/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Para enviar cookies
          body: JSON.stringify({
            customerCode,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      if (data.success) {
        // Guardar token en localStorage (o sessionStorage)
        localStorage.setItem("accessToken", data.accessToken);

        // Guardar datos del cliente
        setCustomer(data.customer);

        // Si es contraseña legacy, mostrar modal de advertencia
        if (data.showPasswordChangeModal) {
          setShowLegacyModal(true);
        } else {
          // Redirigir al dashboard
          router.push(`/${locale}/area-clientes`);
        }
      }
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Usuario decide cambiar contraseña ahora
   */
  const handleChangeNow = () => {
    setShowLegacyModal(false);
    setShowChangeForm(true);
  };

  /**
   * Usuario decide continuar sin cambiar (por ahora)
   */
  const handleContinue = () => {
    setShowLegacyModal(false);
    router.push(`/${locale}/area-clientes`);
  };

  /**
   * Éxito al cambiar contraseña
   */
  const handlePasswordChangeSuccess = (data: any) => {
    setChangeResult({
      crackTimeDisplay: data.crackTimeDisplay,
      strengthScore: data.strengthScore,
    });
    setShowChangeForm(false);
    setShowSuccessModal(true);
  };

  /**
   * Cancelar cambio de contraseña
   */
  const handleCancelChange = () => {
    setShowChangeForm(false);
    router.push(`/${locale}/area-clientes`);
  };

  /**
   * Cerrar modal de éxito y redirigir
   */
  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    router.push(`/${locale}/area-clientes`);
  };

  return (
    <OperationsFrame routeId="login-secure-example" mode="ambient">
      <OperationsIntro
        id="example-intro"
        label={copy.demoLabel}
        title={copy.accessTitle}
        body={copy.demoBody}
      />
      <section
        id="example-form"
        className={`${ops.section}  ${ops.formPanel}`}
        aria-label={copy.demoLabel}
        data-fx="form-feedback"
      >
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Código de cliente */}
          <div>
            <label
              htmlFor="customerCode"
              className="block text-sm font-medium text-foreground mb-2"
            >
              {t("login.clientCode")}
            </label>
            <input
              type="text"
              id="customerCode"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className="w-full px-4 py-3 border border-border focus:ring-2 focus:ring-[var(--gmp-accent)] focus:border-transparent"
              placeholder="0123456789"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              {t("login.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border focus:ring-2 focus:ring-[var(--gmp-accent)] focus:border-transparent pr-12"
                placeholder={t("login.passwordPlaceholder")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t("login.password")}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-card border border-border p-4">
              <p className="text-sm text-foreground">{error}</p>
            </div>
          )}

          {/* Botón de login */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 font-normal text-foreground transition-all ${
              isLoading ? "bg-card cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? t("login.loggingIn") : t("login.accessButton")}
          </button>
        </form>
      </section>
      <section id="example-help" className={ops.help} data-fx="form-feedback">
        <div className={ops.actions}>
          <a className={ops.link} href={`/${locale}`}>
            {copy.home}
          </a>
          <a className={ops.link} href={`/${locale}/area-clientes`}>
            {copy.accessLabel}
          </a>
        </div>
      </section>
      {/* Modal de advertencia legacy */}
      <LegacyPasswordWarningModal
        isOpen={showLegacyModal}
        onChangeNow={handleChangeNow}
        onContinue={handleContinue}
      />

      {/* Formulario de cambio de contraseña */}
      {showChangeForm && customer && (
        <div className="fixed inset-0 bg-background/60 z-50 overflow-auto">
          <PasswordChangeForm
            customerId={customer.id}
            currentPassword={password}
            isLegacyPasswordChange={true}
            onSuccess={handlePasswordChangeSuccess}
            onCancel={handleCancelChange}
          />
        </div>
      )}

      {/* Modal de éxito */}
      {changeResult && (
        <PasswordChangeSuccessModal
          isOpen={showSuccessModal}
          crackTimeDisplay={changeResult.crackTimeDisplay}
          strengthScore={changeResult.strengthScore}
          onClose={handleCloseSuccess}
        />
      )}
    </OperationsFrame>
  );
}
