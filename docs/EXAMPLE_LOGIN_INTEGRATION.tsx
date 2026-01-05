/**
 * EJEMPLO COMPLETO DE INTEGRACIÓN
 *
 * Este archivo muestra cómo integrar todos los componentes de autenticación
 * en una página de login típica de Next.js con TypeScript.
 *
 * Copia este código en: frontend/app/login/page.tsx
 */

'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LegacyPasswordWarningModal from '@/components/auth/LegacyPasswordWarningModal';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import PasswordChangeSuccessModal from '@/components/auth/PasswordChangeSuccessModal';

interface LoginResponse {
    success: boolean;
    message?: string;
    customer?: {
        id: number;
        code: string;
        fullName: string;
        email: string;
        isLegacyPassword: boolean;
    };
    tokens?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    showPasswordChangeModal?: boolean;
}

interface PasswordChangeResult {
    success: boolean;
    message: string;
    crackTimeDisplay: string;
    strengthScore: number;
}

export default function LoginPage() {
    const router = useRouter();

    // Estados del formulario de login
    const [customerCode, setCustomerCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Estados de los modales
    const [showLegacyModal, setShowLegacyModal] = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Datos del usuario y resultado del cambio
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [changeResult, setChangeResult] = useState<PasswordChangeResult | null>(null);

    /**
     * HANDLE LOGIN
     */
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerCode: customerCode.trim(),
                    password: password
                }),
            });

            const data: LoginResponse = await response.json();

            if (data.success && data.customer && data.tokens) {
                // Guardar access token en localStorage (o sessionStorage)
                localStorage.setItem('accessToken', data.tokens.accessToken);
                localStorage.setItem('customerId', data.customer.id.toString());
                localStorage.setItem('customerName', data.customer.fullName);

                // Guardar datos del cliente para posible cambio de contraseña
                setCustomerId(data.customer.id);
                setCurrentPassword(password);

                // ¿Mostrar modal de advertencia legacy?
                if (data.showPasswordChangeModal) {
                    setShowLegacyModal(true);
                } else {
                    // Redirigir directamente al dashboard
                    router.push('/dashboard');
                }
            } else {
                setError(data.message || 'Error de autenticación. Verifica tus credenciales.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Error de conexión. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * HANDLE: Usuario elige "Cambiar contraseña ahora" en modal legacy
     */
    const handleChangeLegacyPasswordNow = () => {
        setShowLegacyModal(false);
        setShowChangeForm(true);
    };

    /**
     * HANDLE: Usuario elige "Continuar de momento" en modal legacy
     */
    const handleContinueWithLegacyPassword = () => {
        setShowLegacyModal(false);
        router.push('/dashboard');
    };

    /**
     * HANDLE: Cambio de contraseña exitoso
     */
    const handlePasswordChangeSuccess = (data: PasswordChangeResult) => {
        setChangeResult(data);
        setShowChangeForm(false);
        setShowSuccessModal(true);
    };

    /**
     * HANDLE: Cancelar cambio de contraseña
     */
    const handlePasswordChangeCancel = () => {
        setShowChangeForm(false);
        router.push('/dashboard');
    };

    /**
     * HANDLE: Cerrar modal de éxito (tras cambio exitoso)
     */
    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
            {/* FORMULARIO DE LOGIN */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Granja Mari Pepa
                    </h1>
                    <p className="text-gray-600">
                        Acceso a tu cuenta
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Código de cliente */}
                    <div>
                        <label htmlFor="customerCode" className="block text-sm font-medium text-gray-700 mb-2">
                            Código de cliente
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="customerCode"
                                type="text"
                                value={customerCode}
                                onChange={(e) => setCustomerCode(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: 9900"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tu contraseña"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Botón submit */}
                    <button
                        type="submit"
                        disabled={isLoading || !customerCode || !password}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                            isLoading || !customerCode || !password
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Iniciando sesión...
                            </span>
                        ) : (
                            'Iniciar sesión'
                        )}
                    </button>

                    {/* Enlaces adicionales */}
                    <div className="text-center space-y-2">
                        <a href="/recuperar-contrasena" className="text-sm text-blue-600 hover:text-blue-700 hover:underline block">
                            ¿Olvidaste tu contraseña?
                        </a>
                        <a href="/registro" className="text-sm text-gray-600 hover:text-gray-700 hover:underline block">
                            ¿No tienes cuenta? Regístrate
                        </a>
                    </div>
                </form>

                {/* Footer de seguridad */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>Conexión segura con encriptación de nivel bancario</span>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* MODALES DE AUTENTICACIÓN                    */}
            {/* ============================================ */}

            {/* Modal de advertencia de contraseña legacy */}
            <LegacyPasswordWarningModal
                isOpen={showLegacyModal}
                onChangeNow={handleChangeLegacyPasswordNow}
                onContinue={handleContinueWithLegacyPassword}
            />

            {/* Formulario de cambio de contraseña (pantalla completa) */}
            {showChangeForm && customerId && (
                <div className="fixed inset-0 bg-white z-50 overflow-auto">
                    <div className="min-h-screen flex items-center justify-center p-4">
                        <PasswordChangeForm
                            customerId={customerId}
                            currentPassword={currentPassword}
                            isLegacyPasswordChange={true}
                            onSuccess={handlePasswordChangeSuccess}
                            onCancel={handlePasswordChangeCancel}
                        />
                    </div>
                </div>
            )}

            {/* Modal de éxito tras cambio de contraseña */}
            {changeResult && (
                <PasswordChangeSuccessModal
                    isOpen={showSuccessModal}
                    crackTimeDisplay={changeResult.crackTimeDisplay}
                    strengthScore={changeResult.strengthScore}
                    onClose={handleSuccessModalClose}
                />
            )}
        </div>
    );
}

// ============================================
// EJEMPLO DE USO EN OTRAS PÁGINAS
// ============================================

/**
 * Página de perfil donde el usuario puede cambiar su contraseña voluntariamente
 * (fuera del flujo de login)
 */
export function ProfilePasswordChange() {
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [changeResult, setChangeResult] = useState<PasswordChangeResult | null>(null);

    const customerId = parseInt(localStorage.getItem('customerId') || '0');

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Seguridad</h2>

                <button
                    onClick={() => setShowChangeForm(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                    Cambiar contraseña
                </button>
            </div>

            {/* Modal/Overlay con formulario */}
            {showChangeForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
                    <div className="w-full max-w-2xl">
                        <PasswordChangeForm
                            customerId={customerId}
                            isLegacyPasswordChange={false}
                            onSuccess={(data) => {
                                setChangeResult(data);
                                setShowChangeForm(false);
                                setShowSuccessModal(true);
                            }}
                            onCancel={() => setShowChangeForm(false)}
                        />
                    </div>
                </div>
            )}

            {changeResult && (
                <PasswordChangeSuccessModal
                    isOpen={showSuccessModal}
                    crackTimeDisplay={changeResult.crackTimeDisplay}
                    strengthScore={changeResult.strengthScore}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}
        </div>
    );
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN (OPCIONAL)
// ============================================

/**
 * Hook personalizado para proteger rutas
 */
export function useAuth() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('accessToken');
                    router.push('/login');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return { isAuthenticated, isLoading };
}

/**
 * Componente wrapper para rutas protegidas
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

// ============================================
// USO EN LAYOUT
// ============================================

/**
 * Ejemplo en app/dashboard/layout.tsx
 */
/*
import { ProtectedRoute } from './login/page';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="dashboard-layout">
                {children}
            </div>
        </ProtectedRoute>
    );
}
*/
