'use client';

import React, { useState } from 'react';
import LegacyPasswordWarningModal from './LegacyPasswordWarningModal';
import FinalSecurityWarningModal from './FinalSecurityWarningModal';
import PasswordChangeForm from './PasswordChangeForm';
import PasswordChangeSuccessModal from './PasswordChangeSuccessModal';
import { secureFetch } from '@/lib/secureFetch';

interface AuthFlowManagerProps {
  showLegacyWarning: boolean;
  customerId: number;
  currentPassword: string;
  onFlowComplete: () => void;
}

/**
 * Gestor del flujo completo de cambio de contraseña
 *
 * Maneja la secuencia:
 * 1. LegacyPasswordWarningModal (si showLegacyWarning = true)
 * 2. FinalSecurityWarningModal (si usuario hace clic en "Continuar de momento")
 * 3. PasswordChangeForm (si usuario acepta cambiar)
 * 4. PasswordChangeSuccessModal (tras cambio exitoso)
 */
export default function AuthFlowManager({
  showLegacyWarning,
  customerId,
  currentPassword,
  onFlowComplete
}: AuthFlowManagerProps) {
  const [showWarning, setShowWarning] = useState(showLegacyWarning);
  const [showFinalWarning, setShowFinalWarning] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleChangeNow = () => {
    setShowWarning(false);
    setShowFinalWarning(false);
    setShowChangeForm(true);
  };

  const handleContinue = () => {
    setShowWarning(false);
    setShowFinalWarning(true);
  };

  const handleAcceptRisk = async () => {
    setShowFinalWarning(false);

    // Increment dismissal counter in backend (using secureFetch for CSRF token)
    try {
      console.log('🔄 Calling dismiss-password-warning...');

      const response = await secureFetch('/api/auth/dismiss-password-warning', {
        method: 'POST'
      });

      console.log('📤 Dismiss response:', response);

      if (response.ok) {
        console.log('✅ Password warning dismissed successfully', response.data);
      } else {
        console.error('❌ Dismiss failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error dismissing password warning:', error);
      // Continue anyway - non-critical error
    }

    console.log('🏁 Calling onFlowComplete...');
    onFlowComplete();
  };

  const handleChangeSuccess = (data: any) => {
    setShowChangeForm(false);
    setSuccessData(data);
    setShowSuccessModal(true);
  };

  const handleChangeCancel = () => {
    setShowChangeForm(false);
    onFlowComplete();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onFlowComplete();
  };

  return (
    <>
      {/* Modal de advertencia inicial de contraseña legacy */}
      <LegacyPasswordWarningModal
        isOpen={showWarning}
        onChangeNow={handleChangeNow}
        onContinue={handleContinue}
      />

      {/* Modal de advertencia final (última oportunidad) */}
      <FinalSecurityWarningModal
        isOpen={showFinalWarning}
        onChangeNow={handleChangeNow}
        onAcceptRisk={handleAcceptRisk}
      />

      {/* Formulario de cambio de contraseña */}
      {showChangeForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PasswordChangeForm
              customerId={customerId}
              currentPassword={currentPassword}
              isLegacyPasswordChange={true}
              onSuccess={handleChangeSuccess}
              onCancel={handleChangeCancel}
            />
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {successData && (
        <PasswordChangeSuccessModal
          isOpen={showSuccessModal}
          crackTimeDisplay={successData.crackTimeDisplay}
          strengthScore={successData.strengthScore}
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
}
