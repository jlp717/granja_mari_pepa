/**
 * WhatsApp Cloud API (Meta) - envío de documentos.
 * Sin dependencias: usa fetch/FormData/Blob de Node 20.
 *
 * Variables:
 *  WHATSAPP_TOKEN
 *  WHATSAPP_PHONE_NUMBER_ID
 *  WHATSAPP_API_VERSION (opcional, v21.0)
 *  WHATSAPP_APP_SECRET (solo para webhooks)
 */

const logger = require('../utils/logger');
const { normalizePhone } = require('./customerProfileService');
const openwa = require('./openwaService');

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

function cloudConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

function isConfigured() {
  return openwa.isConfigured() || cloudConfigured();
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

async function uploadMedia(pdfBuffer, filename) {
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);

  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: form,
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) {
    const error = new Error(data.error?.message || 'No se pudo subir el PDF a WhatsApp');
    error.code = 'WHATSAPP_MEDIA_ERROR';
    error.providerCode = data.error?.code;
    throw error;
  }
  return data.id;
}

async function sendCloudDocument({ to, pdfBuffer, filename, caption }) {
  const recipient = normalizePhone(to);
  if (!recipient) {
    return { success: false, code: 'NO_PHONE', message: 'El cliente no tiene un teléfono válido.' };
  }

  if (!cloudConfigured()) {
    return {
      success: false,
      code: 'CHANNEL_NOT_CONFIGURED',
      message: 'WhatsApp Cloud API no está configurado.',
      provider: 'cloud',
      toMasked: maskPhone(recipient),
      fallbackUrl: buildWaMeLink(
        recipient,
        'Hola, soy Pepa de Maripepa. ¿Te envío tu factura por aquí?',
      ),
    };
  }

  try {
    const mediaId = await uploadMedia(pdfBuffer, filename);
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'document',
          document: {
            id: mediaId,
            filename,
            caption: String(caption || '').slice(0, 1024),
          },
        }),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.warn('WhatsApp API rechazó el envío', {
        status: response.status,
        code: data.error?.code,
        message: data.error?.message,
        to: maskPhone(recipient),
      });
      return {
        success: false,
        code: 'WHATSAPP_API_ERROR',
        providerCode: data.error?.code,
        message: data.error?.message || 'WhatsApp rechazó el envío.',
        toMasked: maskPhone(recipient),
      };
    }

    const wamid = data.messages?.[0]?.id;
    if (!wamid) {
      return {
        success: false,
        code: 'WHATSAPP_NO_ID',
        message: 'WhatsApp no devolvió el identificador del mensaje.',
        toMasked: maskPhone(recipient),
      };
    }

    return {
      success: true,
      providerMessageId: wamid,
      provider: 'cloud',
      toMasked: maskPhone(recipient),
    };
  } catch (error) {
    logger.error('Error enviando documento por WhatsApp', {
      code: error.code || 'WHATSAPP_ERROR',
      message: error.message,
      to: maskPhone(recipient),
    });
    return {
      success: false,
      code: error.code || 'WHATSAPP_ERROR',
      message: error.message,
      toMasked: maskPhone(recipient),
    };
  }
}

async function sendInvoiceDocument(args) {
  const provider = String(process.env.WHATSAPP_PROVIDER || 'auto').toLowerCase();

  if ((provider === 'openwa' || provider === 'auto') && openwa.isConfigured()) {
    return openwa.sendInvoiceDocument(args);
  }

  if ((provider === 'cloud' || provider === 'auto') && cloudConfigured()) {
    return sendCloudDocument(args);
  }

  const recipient = normalizePhone(args && args.to);
  return {
    success: false,
    code: 'CHANNEL_NOT_CONFIGURED',
    message: 'WhatsApp no está configurado (ni OpenWA ni Cloud API).',
    toMasked: recipient ? maskPhone(recipient) : null,
    fallbackUrl: recipient
      ? buildWaMeLink(
          recipient,
          'Hola, soy Pepa de Maripepa. ¿Te envío tu factura por aquí?',
        )
      : null,
  };
}

module.exports = {
  isConfigured,
  cloudConfigured,
  sendInvoiceDocument,
  sendCloudDocument,
  buildWaMeLink,
  maskPhone,
};
