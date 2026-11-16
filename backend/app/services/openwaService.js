/**
 * OpenWA (open-wa.org) - gateway self-hosted MIT.
 * Envía documentos por la API REST de OpenWA.
 *
 * Variables:
 *  OPENWA_BASE_URL=http://127.0.0.1:2785
 *  OPENWA_API_KEY=owa_...
 *  OPENWA_SESSION_ID=<uuid>
 *  WHATSAPP_PROVIDER=openwa|cloud|auto
 *
 * Aviso: OpenWA es una automatización no oficial de WhatsApp Web.
 * Meta puede banear el número. Usa un número dedicado, no el principal.
 */

const logger = require('../utils/logger');
const { normalizePhone } = require('./customerProfileService');

const BASE_URL = (process.env.OPENWA_BASE_URL || 'http://127.0.0.1:2785').replace(/\/$/, '');
const API_KEY = process.env.OPENWA_API_KEY;
const SESSION_ID = process.env.OPENWA_SESSION_ID;

function isConfigured() {
  return Boolean(API_KEY && SESSION_ID);
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? `***${digits.slice(-3)}` : '***';
}

function buildWaMeLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(String(text || ''))}`;
}

async function openwaRequest(path, options = {}) {
  return fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(options.headers || {}),
    },
  });
}

async function getSession() {
  if (!isConfigured()) return null;
  try {
    const response = await openwaRequest(`/sessions/${SESSION_ID}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { status: 'error', httpStatus: response.status, data };
    return data;
  } catch (error) {
    logger.warn('OpenWA no responde al consultar la sesión', {
      message: error.message,
    });
    return { status: 'unreachable', error: error.message };
  }
}

async function sendInvoiceDocument({ to, pdfBuffer, filename, caption }) {
  const recipient = normalizePhone(to);
  if (!recipient) {
    return { success: false, code: 'NO_PHONE', message: 'El cliente no tiene un teléfono válido.' };
  }

  if (!isConfigured()) {
    return {
      success: false,
      code: 'CHANNEL_NOT_CONFIGURED',
      message: 'OpenWA no está configurado.',
      provider: 'openwa',
      toMasked: maskPhone(recipient),
      fallbackUrl: buildWaMeLink(
        recipient,
        'Hola, soy Pepa de Granja Maripepa. ¿Te envío tu factura por aquí?',
      ),
    };
  }

  const chatId = `${String(recipient).replace(/\D/g, '')}@c.us`;
  try {
    const response = await openwaRequest(
      `/sessions/${SESSION_ID}/messages/send-document`,
      {
        method: 'POST',
        body: JSON.stringify({
          chatId,
          base64: pdfBuffer.toString('base64'),
          mimetype: 'application/pdf',
          filename,
          caption: String(caption || '').slice(0, 1024),
        }),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code =
        response.status === 409
          ? 'OPENWA_NOT_READY'
          : response.status === 400
            ? 'OPENWA_BAD_REQUEST'
            : 'OPENWA_ERROR';
      logger.warn('OpenWA rechazó el documento', {
        status: response.status,
        code,
        to: maskPhone(recipient),
      });
      return {
        success: false,
        code,
        status: response.status,
        message:
          data.message ||
          data.error ||
          'OpenWA no pudo enviar el documento. Revisa que la sesión esté vinculada.',
        provider: 'openwa',
        toMasked: maskPhone(recipient),
        fallbackUrl: buildWaMeLink(
          String(process.env.COMPANY_WHATSAPP || '34639778655').replace(/\D/g, ''),
          'Hola, soy Pepa de Granja Maripepa. Necesito que me envieis mi factura por WhatsApp.',
        ),
      };
    }

    const messageId = data.messageId || data.id;
    if (!messageId) {
      return {
        success: false,
        code: 'OPENWA_NO_ID',
        message: 'OpenWA no devolvió el identificador del mensaje.',
        provider: 'openwa',
        toMasked: maskPhone(recipient),
      };
    }

    return {
      success: true,
      providerMessageId: messageId,
      provider: 'openwa',
      toMasked: maskPhone(recipient),
    };
  } catch (error) {
    logger.error('Error enviando documento por OpenWA', {
      message: error.message,
      to: maskPhone(recipient),
    });
    return {
      success: false,
      code: 'OPENWA_ERROR',
      message: error.message,
      provider: 'openwa',
      toMasked: maskPhone(recipient),
    };
  }
}

module.exports = {
  isConfigured,
  getSession,
  sendInvoiceDocument,
  buildWaMeLink,
  maskPhone,
  BASE_URL,
};
