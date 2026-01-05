'use client';

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

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LegacyPasswordWarningModal from '@/components/auth/LegacyPasswordWarningModal';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import PasswordChangeSuccessModal from '@/components/auth/PasswordChangeSuccessModal';

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

    // Estados del formulario de login
    const [customerCode, setCustomerCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados de modales
    const [showLegacyModal, setShowLegacyModal] = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Datos del cliente y resultado
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [changeResult, setChangeResult] = useState<PasswordChangeResult | null>(null);

    /**
     * Manejar el login
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Llamar a la API de login seguro
            const response = await fetch('http://localhost:5000/api/auth/secure/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Para enviar cookies
                body: JSON.stringify({
                    customerCode,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            if (data.success) {
                // Guardar token en localStorage (o sessionStorage)
                localStorage.setItem('accessToken', data.accessToken);

                // Guardar datos del cliente
                setCustomer(data.customer);

                // Si es contraseña legacy, mostrar modal de advertencia
                if (data.showPasswordChangeModal) {
                    setShowLegacyModal(true);
                } else {
                    // Redirigir al dashboard
                    router.push('/customer/dashboard');
                }
            }
        } catch (error: any) {
            setError(error.message || 'Error al iniciar sesión');
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
        router.push('/customer/dashboard');
    };

    /**
     * Éxito al cambiar contraseña
     */
    const handlePasswordChangeSuccess = (data: any) => {
        setChangeResult({
            crackTimeDisplay: data.crackTimeDisplay,
            strengthScore: data.strengthScore
        });
        setShowChangeForm(false);
        setShowSuccessModal(true);
    };

    /**
     * Cancelar cambio de contraseña
     */
    const handleCancelChange = () => {
        setShowChangeForm(false);
        router.push('/customer/dashboard');
    };

    /**
     * Cerrar modal de éxito y redirigir
     */
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        router.push('/customer/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Granja Mari Pepa
                    </h1>
                    <p className="text-gray-600">
                        Sistema de Autenticación Segura
                    </p>
                </div>

                {/* Formulario de login */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Código de cliente */}
                    <div>
                        <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700 mb-2">
                            Código de Cliente
                        </label>
                        <input
                            type="text"
                            id="customerCode"
                            value={customerCode}
                            onChange={(e) => setCustomerCode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ej: 9900"
                            required
                        />
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                                placeholder="Tu contraseña"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Botón de login */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                            isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Link de recuperación de contraseña */}
                <div className="mt-6 text-center">
                    <a
                        href="/forgot-password"
                        className="text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>
            </div>

            {/* Modal de advertencia legacy */}
            <LegacyPasswordWarningModal
                isOpen={showLegacyModal}
                onChangeNow={handleChangeNow}
                onContinue={handleContinue}
            />

            {/* Formulario de cambio de contraseña */}
            {showChangeForm && customer && (
                <div className="fixed inset-0 bg-black/60 z-50 overflow-auto">
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
        </div>
    );
}
