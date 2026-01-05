'use client';

import React from 'react';
import { AlertTriangle, Shield, XCircle, Lock } from 'lucide-react';

interface FinalSecurityWarningModalProps {
    isOpen: boolean;
    onChangeNow: () => void;
    onAcceptRisk: () => void;
}

/**
 * Modal de advertencia FINAL antes de permitir continuar con contraseña insegura
 * 
 * Este es el último aviso antes de que el usuario continúe con una contraseña NIF.
 * Refuerza la importancia de cambiar la contraseña y deja claro que:
 * - Esta es la última vez que el sistema lo pedirá automáticamente
 * - Los riesgos de seguridad son graves
 * - La empresa no se hace responsable de accesos no autorizados
 */
export default function FinalSecurityWarningModal({
    isOpen,
    onChangeNow,
    onAcceptRisk
}: FinalSecurityWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
            {/* Container compacto con scroll */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                {/* Header con advertencia crítica */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5 text-white flex-shrink-0">
                    <div className="flex items-start gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold mb-1">
                                Última advertencia de seguridad
                            </h2>
                            <p className="text-red-50 text-xs sm:text-sm">
                                Esta será la última vez que te pediremos cambiar tu contraseña
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contenido scrollable */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Advertencia principal */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-900 font-bold text-sm sm:text-base mb-1">
                                    Riesgo crítico identificado
                                </p>
                                <p className="text-red-800 text-xs sm:text-sm leading-relaxed">
                                    Tu contraseña actual es tu <span className="font-bold">NIF</span>, un dato público
                                    que aparece en documentos oficiales, facturas y bases de datos.
                                    <span className="font-bold"> Cualquier persona podría acceder a tu cuenta.</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Consecuencias potenciales */}
                    <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                            <Lock className="w-4 h-4 text-orange-600" />
                            ¿Qué podría pasar?
                        </h3>

                        <div className="space-y-2 ml-6 text-xs sm:text-sm">
                            <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="font-semibold text-gray-900">Acceso no autorizado</p>
                                    <p className="text-gray-700 text-xs">
                                        Facturas, pedidos y datos personales accesibles por terceros.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="font-semibold text-gray-900">Pedidos fraudulentos</p>
                                    <p className="text-gray-700 text-xs">
                                        Alguien podría realizar pedidos a tu nombre.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="font-semibold text-gray-900">Tu responsabilidad</p>
                                    <p className="text-gray-700 text-xs">
                                        Al mantener contraseña insegura, asumes la responsabilidad.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deslinde de responsabilidad */}
                    <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs">
                        <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            Aviso Legal
                        </h4>
                        <p className="leading-relaxed text-gray-200">
                            <strong>Granja Mari Pepa</strong> no se hace responsable de accesos no autorizados
                            o filtraciones de datos por mantener una contraseña insegura.
                        </p>
                    </div>

                    {/* Estadística de tiempo */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-3 text-white text-center">
                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-90" />
                        <p className="text-xs text-green-100 mb-0.5">
                            Solo te llevará
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold">
                            2 minutos
                        </p>
                        <p className="text-green-100 text-xs font-medium">
                            Proteger tu cuenta para siempre
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                        <button
                            onClick={onChangeNow}
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
                        >
                            <Shield className="w-5 h-5" />
                            Cambiar mi contraseña ahora
                        </button>

                        <button
                            onClick={onAcceptRisk}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition-all text-xs"
                        >
                            Entiendo los riesgos, continuar de todos modos
                        </button>
                    </div>

                    {/* Nota final */}
                    <p className="text-xs text-gray-500 text-center border-t pt-3">
                        Podrás cambiar tu contraseña en cualquier momento desde tu perfil.
                        Este aviso no volverá a aparecer.
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
