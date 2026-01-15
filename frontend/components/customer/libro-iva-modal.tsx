'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, Mail, MessageCircle, Send, Phone, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import apiClient, { handleApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LibroIvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoCliente: string;
  userEmail?: string;
  userPhone?: string;
  clienteNombre?: string;
}

export default function LibroIvaModal({ isOpen, onClose, codigoCliente, userEmail, userPhone, clienteNombre }: LibroIvaModalProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Estados para compartir
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMethod, setShareMethod] = useState<'download' | 'email' | 'whatsapp'>('download');
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [phoneInput, setPhoneInput] = useState(userPhone || '');
  const [isSending, setIsSending] = useState(false);

  // Actualizar inputs cuando cambien los props
  useEffect(() => {
    if (userEmail) setEmailInput(userEmail);
    if (userPhone) setPhoneInput(userPhone);
  }, [userEmail, userPhone]);

  const handleGenerate = async () => {
    setError('');
    setIsGenerating(true);

    try {
      // El apiClient maneja automáticamente el token y su renovación
      const response = await apiClient.post(
        '/api/libro-iva',
        {
          codigoCliente,
          ejercicio: parseInt(selectedYear)
        },
        {
          responseType: 'blob',
          timeout: 45000 // 45 segundos para generación de PDF
        }
      );

      // Verificar que la respuesta es un PDF válido
      if (response.data.type !== 'application/pdf') {
        // Si no es PDF, puede ser un JSON de error
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Error desconocido');
        } catch {
          throw new Error('La respuesta del servidor no es válida');
        }
      }

      // Crear enlace de descarga
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `libro_iva_${codigoCliente}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Libro de IVA ${selectedYear} descargado correctamente`);

      // Cerrar modal con feedback positivo
      setTimeout(() => {
        onClose();
        setIsGenerating(false);
      }, 500);

    } catch (err: any) {
      console.error('Error generando libro IVA:', err);

      // Usar el helper centralizado para manejar errores
      let errorMessage = handleApiError(err);

      // Personalizar mensaje para 404 (sin facturas)
      if (err.response?.status === 404) {
        errorMessage = `No se encontraron facturas para el año ${selectedYear}. Verifica que tengas facturas registradas en ese período.`;
      }

      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Por favor, introduce un email válido');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const response = await apiClient.post('/api/libro-iva/enviar-email', {
        codigoCliente,
        ejercicio: parseInt(selectedYear),
        destinatario: emailInput,
        clienteNombre: clienteNombre || 'Cliente'
      });

      if (response.data.success) {
        toast.success(`Libro de IVA ${selectedYear} enviado a ${emailInput}`);
        onClose();
      } else {
        throw new Error(response.data.error || 'Error al enviar');
      }
    } catch (err: any) {
      console.error('Error enviando libro IVA por email:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsSending(true);
    setError('');

    try {
      // 1. Generar y obtener el PDF como Blob
      const response = await apiClient.post(
        '/api/libro-iva',
        {
          codigoCliente,
          ejercicio: parseInt(selectedYear)
        },
        {
          responseType: 'blob',
          timeout: 45000
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const file = new File([blob], `libro_iva_${selectedYear}.pdf`, { type: 'application/pdf' });

      // 2. Intentar usar Web Share API (Móviles: iOS/Android)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Libro IVA ${selectedYear}`,
            text: `Adjunto libro de IVA del ejercicio ${selectedYear} - Granja Mari Pepa`,
            files: [file]
          });
          toast.success('Abriendo menú de compartir...');
          onClose();
          return; // Éxito con share nativo
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            console.warn('Error al compartir nativamente:', shareError);
            // Si falla (no cancelado por usuario), seguimos con el fallback
          } else {
            setIsSending(false);
            return; // Cancelado por usuario
          }
        }
      }

      // 3. Fallback para PC / Navegadores sin soporte de archivos
      // Descargamos el archivo y abrimos WhatsApp Web
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `libro_iva_${codigoCliente}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // No revocamos URL inmediatamente para dar tiempo a la descarga

      const phone = phoneInput.replace(/[\s\-\(\)]/g, '');
      const mensaje = `📊 *Libro de IVA ${selectedYear}*\n\nHola,\nAdjunto el documento PDF descargado.\n\n_Granja Mari Pepa_`;

      let whatsappUrl = '';
      if (phone && phone.length >= 9) {
        whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
      } else {
        // Si no hay teléfono, ofrecemos abrir WhatsApp general
        whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
      }

      window.open(whatsappUrl, '_blank');

      toast.success(
        <div className="flex flex-col">
          <p className="font-semibold">✅ PDF Descargado</p>
          <p className="text-xs">Como estás en PC, arrastra el archivo descargado al chat de WhatsApp.</p>
        </div>
      );

      onClose();

    } catch (err: any) {
      console.error('Error preparación WhatsApp:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Libro de IVA Repercutido</h2>
                      <p className="text-sm text-blue-100">Genera y comparte tu libro de IVA</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Selector de año */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Ejercicio Fiscal
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    disabled={isGenerating || isSending}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Información */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold mb-2">
                    📊 Este documento incluye:
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4">
                    <li>• Todas las facturas del año seleccionado</li>
                    <li>• Agrupadas por serie (A, F, etc.)</li>
                    <li>• Base imponible, IVA y totales</li>
                  </ul>
                </div>

                {/* Opciones de envío */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ¿Cómo quieres obtener el documento?
                  </p>

                  {/* Selector de método */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setShareMethod('download')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${shareMethod === 'download'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <Download className={`w-5 h-5 ${shareMethod === 'download' ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${shareMethod === 'download' ? 'text-blue-700' : 'text-gray-600'}`}>
                        Descargar
                      </span>
                    </button>

                    <button
                      onClick={() => setShareMethod('email')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${shareMethod === 'email'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <Mail className={`w-5 h-5 ${shareMethod === 'email' ? 'text-purple-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${shareMethod === 'email' ? 'text-purple-700' : 'text-gray-600'}`}>
                        Email
                      </span>
                    </button>

                    <button
                      onClick={() => setShareMethod('whatsapp')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${shareMethod === 'whatsapp'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                    >
                      <MessageCircle className={`w-5 h-5 ${shareMethod === 'whatsapp' ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium ${shareMethod === 'whatsapp' ? 'text-green-700' : 'text-gray-600'}`}>
                        WhatsApp
                      </span>
                    </button>
                  </div>

                  {/* Input de email */}
                  {shareMethod === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-500" />
                        Email de destino
                      </label>
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="ejemplo@email.com"
                        className="h-11 bg-white dark:bg-gray-700"
                      />
                      {userEmail && emailInput === userEmail && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Email de tu perfil
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Input de teléfono */}
                  {shareMethod === 'whatsapp' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500" />
                        Número de WhatsApp
                      </label>
                      <Input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+34 666 555 444"
                        className="h-11 bg-white dark:bg-gray-700"
                      />
                      <p className="text-xs text-gray-500">
                        Puedes introducir otro número diferente al de tu perfil
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                  >
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ {error}
                    </p>
                  </motion.div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={onClose}
                    disabled={isGenerating || isSending}
                    className="flex-1 rounded-xl h-12 font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                  >
                    Cancelar
                  </Button>

                  {shareMethod === 'download' && (
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Descargar PDF
                        </>
                      )}
                    </Button>
                  )}

                  {shareMethod === 'email' && (
                    <Button
                      onClick={handleSendEmail}
                      disabled={isSending || !emailInput}
                      className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl"
                    >
                      {isSending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar por Email
                        </>
                      )}
                    </Button>
                  )}

                  {shareMethod === 'whatsapp' && (
                    <Button
                      onClick={handleSendWhatsApp}
                      disabled={isSending || !phoneInput}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl"
                    >
                      {isSending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Enviar WhatsApp
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
