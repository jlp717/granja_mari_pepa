'use client';

import React from 'react';
import { AlertTriangle, Shield, Clock } from 'lucide-react';

interface LegacyPasswordWarningModalProps {
    isOpen: boolean;
    onChangeNow: () => void;
    onContinue: () => void;
}

/**
 * Modal de advertencia persuasiva para usuarios con contraseña legacy (NIF)
 *
 * Diseñado para educar sin frustrar:
 * - Explica claramente el riesgo
 * - No bloquea el acceso
 * - Destaca la acción recomendada
 * - Aparece en CADA login mientras siga usando contraseña legacy
 */
export default function LegacyPasswordWarningModal({
    isOpen,
    onChangeNow,
    onContinue
}: LegacyPasswordWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
            {/* Container compacto con scroll */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header con gradiente de alerta */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 sm:p-5 text-white flex-shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold">
                                Tu cuenta necesita protección
                            </h2>
                            <p className="text-amber-50 text-xs sm:text-sm mt-1">
                                Acción recomendada: 2 minutos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contenido scrollable */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Mensaje principal */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
                        <p className="text-gray-800 font-medium text-sm sm:text-base leading-relaxed">
                            Tu contraseña actual es tu <span className="font-bold">NIF</span>,
                            información pública y conocida por terceros.
                        </p>
                        <p className="text-gray-700 mt-2 text-xs sm:text-sm">
                            Tu cuenta está en <span className="font-bold text-amber-700">riesgo alto</span> de
                            acceso no autorizado.
                        </p>
                    </div>

                    {/* Beneficios del cambio */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-green-600" />
                            ¿Por qué cambiarla ahora?
                        </h3>

                        <div className="space-y-2 ml-6 text-xs sm:text-sm">
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
                                <p className="text-gray-700">
                                    <strong>Seguridad exponencial:</strong> Tu nueva contraseña tardaría
                                    <span className="text-green-700 font-semibold"> siglos en ser crackeada</span>,
                                    vs. tu NIF que cualquiera puede conocer.
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                                <p className="text-gray-700">
                                    <strong>Proceso guiado:</strong> Te ayudamos a crear una contraseña
                                    fuerte y fácil de recordar.
                                </p>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0"></div>
                                <p className="text-gray-700">
                                    <strong>Protección inmediata:</strong> El cambio es instantáneo y
                                    cierra todas las sesiones en otros dispositivos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tiempo estimado */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-900">
                                Tiempo estimado: <span className="font-bold">solo 2 minutos</span>
                            </p>
                            <p className="text-xs text-blue-700">
                                Seguirás conectado, no perderás tu sesión
                            </p>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                        <button
                            onClick={onChangeNow}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                        >
                            <Shield className="w-5 h-5" />
                            Cambiar contraseña ahora (Recomendado)
                        </button>

                        <button
                            onClick={onContinue}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                        >
                            Continuar de momento
                            <span className="text-xs text-gray-500">(Se mostrará en el próximo login)</span>
                        </button>
                    </div>

                    {/* Nota de seguridad */}
                    <p className="text-xs text-gray-500 text-center border-t pt-3">
                        Este aviso aparecerá en cada inicio de sesión hasta que actualices tu contraseña.
                        Es por tu seguridad y la protección de tu información.
                    </p>
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
