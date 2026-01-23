'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Lock, Zap, Clock, AlertTriangle } from 'lucide-react';
import zxcvbn from 'zxcvbn';

interface PasswordChangeFormProps {
    customerId: number;
    currentPassword?: string; // Opcional si viene del modal legacy
    isLegacyPasswordChange?: boolean;
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

interface PasswordStrength {
    score: number;
    crackTimeDisplay: string;
    feedback: {
        warning: string;
        suggestions: string[];
    };
    isPwned?: boolean;
}

/**
 * Formulario de cambio de contraseña con validación en tiempo real
 *
 * Características:
 * - Barra de fortaleza visual con zxcvbn
 * - Estimación de tiempo de crackeo en tiempo real
 * - Check contra HaveIBeenPwned
 * - Feedback educativo
 * - Confirmación doble antes de enviar
 */
export default function PasswordChangeForm({
    customerId,
    currentPassword: initialCurrentPassword,
    isLegacyPasswordChange = false,
    onSuccess,
    onCancel
}: PasswordChangeFormProps) {
    const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [error, setError] = useState('');
    const [strength, setStrength] = useState<PasswordStrength | null>(null);

    // Validar contraseña en tiempo real con zxcvbn
    useEffect(() => {
        if (newPassword.length === 0) {
            setStrength(null);
            return;
        }

        const result = zxcvbn(newPassword, [
            'granjamaripepa',
            'granja',
            'maripepa'
        ]);

        setStrength({
            score: result.score,
            crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
            feedback: {
                warning: result.feedback.warning || '',
                suggestions: result.feedback.suggestions || []
            }
        });

        // Verificar contra HaveIBeenPwned si la fortaleza es buena
        if (result.score >= 3 && newPassword.length >= 12) {
            checkPasswordPwned(newPassword);
        }
    }, [newPassword]);

    const checkPasswordPwned = async (password: string) => {
        try {
            const response = await fetch('/api/auth/check-password-pwned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();
            if (data.success && strength) {
                setStrength({
                    ...strength,
                    isPwned: data.isPwned
                });
            }
        } catch (error) {
            console.error('Error checking pwned password:', error);
        }
    };

    const getStrengthLabel = (score: number) => {
        const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
        return labels[score];
    };

    const getStrengthColor = (score: number) => {
        const colors = [
            'bg-red-500',
            'bg-orange-500',
            'bg-yellow-500',
            'bg-lime-500',
            'bg-green-600'
        ];
        return colors[score];
    };

    const getStrengthTextColor = (score: number) => {
        const colors = [
            'text-red-700',
            'text-orange-700',
            'text-yellow-700',
            'text-lime-700',
            'text-green-700'
        ];
        return colors[score];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!currentPassword) {
            setError('Por favor, ingresa tu contraseña actual');
            return;
        }

        if (newPassword.length < 12) {
            setError('La contraseña debe tener al menos 12 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!strength || strength.score < 4) {
            setError('La contraseña no es lo suficientemente fuerte (mínimo: Muy fuerte)');
            return;
        }

        if (strength.isPwned) {
            setError('Esta contraseña ha sido comprometida. Por favor, elige otra');
            return;
        }

        // Mostrar modal de confirmación
        setShowConfirmModal(true);
    };

    const handleConfirmedSubmit = async () => {
        setIsChecking(true);
        setError('');

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // 🔐 Enviar cookies con token JWT
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data);
            } else {
                setError(data.message || 'Error al cambiar contraseña');
                setShowConfirmModal(false);
            }
        } catch (error) {
            setError('Error de conexión. Por favor, intenta de nuevo');
            setShowConfirmModal(false);
        } finally {
            setIsChecking(false);
        }
    };

    const isFormValid = currentPassword &&
        newPassword &&
        confirmPassword &&
        newPassword === confirmPassword &&
        strength &&
        strength.score >= 4 &&
        !strength.isPwned;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isLegacyPasswordChange ? 'Protege tu cuenta' : 'Cambiar contraseña'}
                        </h2>
                    </div>
                    <p className="text-gray-600 ml-[60px]">
                        Crea una contraseña fuerte y única. Te guiaremos paso a paso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contraseña actual */}
                    {!initialCurrentPassword && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña actual
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                    placeholder="Tu contraseña actual"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Nueva contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nueva contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                placeholder="Mínimo 12 caracteres"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Barra de fortaleza */}
                        {strength && (
                            <div className="mt-4 space-y-3">
                                {/* Barra visual */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-semibold ${getStrengthTextColor(strength.score)}`}>
                                            Fortaleza: {getStrengthLabel(strength.score)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {strength.score}/4
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
                                            style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Tiempo de crackeo */}
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                                    strength.score >= 4 ? 'bg-green-50 border border-green-200' :
                                    strength.score >= 3 ? 'bg-yellow-50 border border-yellow-200' :
                                    'bg-red-50 border border-red-200'
                                }`}>
                                    <Clock className={`w-5 h-5 flex-shrink-0 ${
                                        strength.score >= 4 ? 'text-green-600' :
                                        strength.score >= 3 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">
                                            Tiempo para crackear: <span className="font-bold">{strength.crackTimeDisplay}</span>
                                        </p>
                                        {strength.score >= 4 && (
                                            <p className="text-xs text-green-700 mt-0.5">
                                                ¡Excelente! Esta contraseña tardaría siglos en ser crackeada.
                                            </p>
                                        )}
                                    </div>
                                    {strength.score >= 4 && (
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Check HaveIBeenPwned */}
                                {strength.isPwned !== undefined && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                                        strength.isPwned ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                                    }`}>
                                        {strength.isPwned ? (
                                            <>
                                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                <p className="text-sm text-red-700">
                                                    <strong>Contraseña comprometida:</strong> Esta contraseña ha sido filtrada en brechas de seguridad. Elige otra.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <p className="text-sm text-green-700">
                                                    Contraseña segura: No está en bases de datos de contraseñas filtradas
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Feedback de zxcvbn */}
                                {(strength.feedback.warning || strength.feedback.suggestions.length > 0) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                                        {strength.feedback.warning && (
                                            <p className="text-sm text-blue-800 flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                {strength.feedback.warning}
                                            </p>
                                        )}
                                        {strength.feedback.suggestions.length > 0 && (
                                            <ul className="text-xs text-blue-700 space-y-1 ml-6 list-disc">
                                                {strength.feedback.suggestions.map((suggestion, idx) => (
                                                    <li key={idx}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar nueva contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                                    confirmPassword && newPassword !== confirmPassword
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300'
                                }`}
                                placeholder="Repite tu nueva contraseña"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Las contraseñas no coinciden
                            </p>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Las contraseñas coinciden
                            </p>
                        )}
                    </div>

                    {/* Error general */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || isChecking}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                isFormValid && !isChecking
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isChecking ? 'Cambiando...' : 'Cambiar contraseña'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal de confirmación */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-100 p-3 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                Confirmar cambio de contraseña
                            </h3>
                        </div>

                        <p className="text-gray-700 mb-6">
                            Vas a cambiar tu contraseña. Esta acción:
                        </p>

                        <ul className="space-y-2 mb-6 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                                Cerrará todas tus sesiones en otros dispositivos
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                                Invalidará todos los tokens de acceso anteriores
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0"></div>
                                Protegerá tu cuenta con una contraseña muy fuerte
                            </li>
                        </ul>

                        <p className="text-gray-800 font-medium mb-6">
                            ¿Confirmas que deseas cambiar tu contraseña?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isChecking}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmedSubmit}
                                disabled={isChecking}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                {isChecking ? 'Cambiando...' : 'Sí, cambiar ahora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
