'use client';

import React from 'react';
import { CheckCircle, Shield, Clock, Zap, X } from 'lucide-react';

interface PasswordChangeSuccessModalProps {
    isOpen: boolean;
    crackTimeDisplay: string;
    strengthScore: number;
    onClose: () => void;
}

/**
 * Modal de éxito tras cambiar contraseña
 *
 * Refuerza positivamente la decisión del usuario mostrando:
 * - Confirmación visual clara
 * - Tiempo de crackeo de la nueva contraseña
 * - Beneficios de seguridad obtenidos
 */
export default function PasswordChangeSuccessModal({
    isOpen,
    crackTimeDisplay,
    strengthScore,
    onClose
}: PasswordChangeSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in my-8 max-h-[95vh] flex flex-col">
                {/* Header de éxito */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center relative flex-shrink-0">
                    {/* Botón cerrar (X) en la esquina */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">
                        ¡Contraseña cambiada con éxito!
                    </h2>
                    <p className="text-green-50 text-lg">
                        Tu cuenta ahora está mucho más protegida
                    </p>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Mensaje principal con tiempo de crackeo */}
                    <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                        <div className="flex items-start gap-3">
                            <Clock className="w-6 h-6 text-green-700 flex-shrink-0 mt-1" />
                            <div>
                                <p className="text-gray-800 font-semibold text-lg mb-1">
                                    Tiempo para crackear tu nueva contraseña:
                                </p>
                                <p className="text-green-700 text-2xl font-bold">
                                    {crackTimeDisplay}
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    Un atacante tardaría este tiempo en descifrar tu contraseña incluso
                                    con supercomputadoras.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Beneficios obtenidos */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Lo que acabas de conseguir:
                        </h3>

                        <div className="space-y-3 ml-7">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Seguridad exponencial
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Tu cuenta pasa de estar en riesgo alto a estar protegida con
                                        estándares de nivel bancario.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Sesiones anteriores cerradas
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Todos los dispositivos donde estabas conectado han sido
                                        desconectados automáticamente.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800">
                                        Contraseña única y privada
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Ya no usas información pública (NIF) como contraseña. Solo tú conoces
                                        esta nueva clave.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadística de fortaleza */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-5 text-white text-center">
                        <p className="text-sm text-green-100 mb-1">
                            Puntuación de fortaleza
                        </p>
                        <p className="text-5xl font-bold mb-1">
                            {strengthScore}/4
                        </p>
                        <p className="text-green-100 font-medium">
                            MUY FUERTE
                        </p>
                    </div>

                    {/* Consejo final */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>💡 Consejo:</strong> Guarda tu contraseña en un lugar seguro o utiliza
                            un gestor de contraseñas. No la compartas con nadie y cámbiala periódicamente.
                        </p>
                    </div>

                    {/* Botón cerrar */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        Entendido, continuar
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
