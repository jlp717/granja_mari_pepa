/**
 * Herramientas de entrega del chatbot.
 * Efectos reales: email (SMTP noreply) y WhatsApp Cloud API.
 * Nunca se confía en el LLM para el destinatario: se toma del perfil del JWT.
 * Solo escribe en JAVIER.CHATBOT_OUTBOX (esquema permitido).
 */

const crypto = require('crypto');
const databaseService = require('../services/databaseService');
const customerProfileService = require('../services/customerProfileService');
const { parseInvoiceReference } = require('../services/invoiceReference');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const outboxService = require('../services/outboxService');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

// WhatsApp de atencion al cliente que ya publica la web. Se usa como salida
// segura cuando no hay sesion automatica vinculada: el cliente abre el chat
// con la empresa y un humano responde. Nunca se usa el movil personal.
const COMPANY_WHATSAPP = String(
  process.env.COMPANY_WHATSAPP || '34639778655',
).replace(/\D/g, '');

const TOOL_DEFINITIONS = Object.freeze([
  {
    type: 'function',
    function: {
      name: 'enviar_factura_email',
      description:
        'Envía por email la factura indicada al correo del cliente autenticado. Solo acepta el número de factura. Devuelve providerMessageId solo si el servidor SMTP aceptó el envío.',
      parameters: {
        type: 'object',
        properties: {
          numero: {
            type: 'string',
            description: 'Número o referencia: 1234, F-1234, F/1234/2025.',
          },
        },
        required: ['numero'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'enviar_factura_whatsapp',
      description:
        'Envía por WhatsApp la factura indicada al teléfono del cliente autenticado. Solo acepta el número de factura. Devuelve wamid solo si WhatsApp Cloud API aceptó el envío.',
      parameters: {
        type: 'object',
        properties: {
          numero: {
            type: 'string',
            description: 'Número o referencia: 1234, F-1234, F/1234/2025.',
          },
        },
        required: ['numero'],
        additionalProperties: false,
      },
    },
  },
]);

const TOOL_NAMES = Object.freeze(TOOL_DEFINITIONS.map((tool) => tool.function.name));

function normalizeInvoiceNumber(raw) {
  return parseInvoiceReference(raw).numero;
}

function maskEmail(email) {
  const value = String(email || '');
  const [user, domain] = value.split('@');
  if (!domain) return '***';
  const visible = user.slice(0, 1);
  return `${visible}***@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? `***${digits.slice(-3)}` : '***';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || ''));
}

function requireClientCode(user) {
  const code = user && (user.codigoCliente || user.customerCode);
  if (!code) {
    const error = new Error('AUTH_REQUIRED');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  return String(code).trim();
}

function assertToolName(name) {
  if (typeof name !== 'string' || !TOOL_NAMES.includes(name)) {
    const error = new Error('TOOL_NOT_ALLOWED');
    error.code = 'TOOL_NOT_ALLOWED';
    throw error;
  }
  return name;
}

async function findInvoice(codigoCliente, numero, preferredYear) {
  const currentYear = new Date().getFullYear();
  const years = [
    ...new Set(
      [preferredYear, currentYear, currentYear - 1, currentYear - 2].filter(Boolean),
    ),
  ];
  for (const ejercicio of years) {
    try {
      const detail = await databaseService.getInvoiceDetail(
        'F',
        Number(numero),
        ejercicio,
        codigoCliente,
      );
      if (detail && detail.header) return { detail, ejercicio };
    } catch {
      // getInvoiceDetail valida propiedad y lanza "Factura no encontrada".
    }
  }
  return null;
}

function invoiceId(detail, numero) {
  const header = detail.header || {};
  return `F/${header.SERIEFACTURA || 'F'}/${numero}/${header.EJERCICIOFACTURA || ''}`;
}

function buildIdempotencyKey({ customerCode, documentId, channel, recipient }) {
  return outboxService.buildIdempotencyKey({
    customerCode,
    documentId,
    channel,
    recipient,
    date: new Date().toISOString().slice(0, 10),
  });
}

async function executeEmail({ profile, invoice, pdfBuffer, locale }) {
  const testRedirect = process.env.CHATBOT_DELIVERY_TEST_REDIRECT;
  const to = testRedirect || profile.email;

  if (!isValidEmail(to)) {
    return {
      success: false,
      code: 'NO_EMAIL',
      message: 'El cliente no tiene un email válido configurado.',
      channel: 'email',
    };
  }

  const documentId = invoiceId(invoice.detail, invoice.numero);
  const idempotencyKey = buildIdempotencyKey({
    customerCode: profile.codigoCliente,
    documentId,
    channel: 'email',
    recipient: to,
  });

  const outbox = await outboxService.enqueue({
    idempotencyKey,
    customerCode: profile.codigoCliente,
    channel: 'email',
    recipient: to,
    documentId,
  });

  if (outbox && outbox.STATUS === 'SENT' && outbox.PROVIDER_MESSAGE_ID) {
    return {
      success: true,
      status: 'SENT',
      channel: 'email',
      providerMessageId: outbox.PROVIDER_MESSAGE_ID,
      toMasked: maskEmail(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
      existing: true,
    };
  }

  if (outbox && outbox.STATUS === 'SENDING') {
    return {
      success: true,
      status: 'QUEUED',
      channel: 'email',
      toMasked: maskEmail(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
    };
  }

  const header = invoice.detail.header || {};
  const serie = header.SERIEFACTURA || 'F';
  const filename = `Factura_${serie}_${invoice.numero}_${invoice.ejercicio}.pdf`;
  const subjectPrefix = testRedirect ? '[TEST] ' : '';
  const subject = `${subjectPrefix}Factura ${serie}-${invoice.numero} - Granja Mari Pepa`;
  const text =
    locale === 'en'
      ? `Attached is invoice ${serie}-${invoice.numero}.`
      : `Adjuntamos su factura ${serie}-${invoice.numero}.`;

  try {
    await outboxService.markSending(outbox.ID);
    const sent = await emailService.sendInvoiceEmail({
      to,
      subject,
      text,
      html: `<p>${text}</p><p>Granja Mari Pepa · Lorca (Murcia)</p>`,
      pdfBuffer,
      filename,
    });

    if (!sent.messageId) {
      const error = new Error('SMTP no devolvió messageId');
      error.code = 'SMTP_NO_ID';
      throw error;
    }

    await outboxService.markSent(outbox.ID, sent.messageId);
    logger.info('DELIVERY_SENT', {
      channel: 'email',
      documentId,
      providerMessageId: sent.messageId,
      to: maskEmail(to),
      redirected: Boolean(testRedirect),
    });

    return {
      success: true,
      status: 'SENT',
      channel: 'email',
      providerMessageId: sent.messageId,
      toMasked: maskEmail(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
      redirected: Boolean(testRedirect),
    };
  } catch (error) {
    await outboxService.markFailed(outbox.ID, error.code || 'EMAIL_ERROR', error.message).catch(() => {});
    logger.warn('DELIVERY_FAILED', {
      channel: 'email',
      documentId,
      code: error.code || 'EMAIL_ERROR',
      message: error.message,
      to: maskEmail(to),
    });
    return {
      success: false,
      code: error.code || 'EMAIL_ERROR',
      message: error.message,
      channel: 'email',
      toMasked: maskEmail(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
    };
  }
}

async function executeWhatsApp({ profile, invoice, pdfBuffer, locale }) {
  const testRedirect = process.env.CHATBOT_WHATSAPP_TEST_REDIRECT;
  const to = testRedirect || profile.telefono;

  if (!to) {
    return {
      success: false,
      code: 'NO_PHONE',
      message: 'El cliente no tiene un teléfono válido configurado.',
      channel: 'whatsapp',
    };
  }

  if (!whatsappService.isConfigured()) {
    return {
      success: false,
      code: 'CHANNEL_NOT_CONFIGURED',
      message: 'WhatsApp Cloud API no está configurado en el servidor.',
      channel: 'whatsapp',
      toMasked: maskPhone(to),
      fallbackUrl: whatsappService.buildWaMeLink(
        COMPANY_WHATSAPP,
        'Hola, soy Pepa de Granja Maripepa. Necesito que me envieis mi factura por WhatsApp.',
      ),
    };
  }

  const documentId = invoiceId(invoice.detail, invoice.numero);
  const idempotencyKey = buildIdempotencyKey({
    customerCode: profile.codigoCliente,
    documentId,
    channel: 'whatsapp',
    recipient: to,
  });

  const outbox = await outboxService.enqueue({
    idempotencyKey,
    customerCode: profile.codigoCliente,
    channel: 'whatsapp',
    recipient: to,
    documentId,
  });

  if (outbox && outbox.STATUS === 'SENT' && outbox.PROVIDER_MESSAGE_ID) {
    return {
      success: true,
      status: 'SENT',
      channel: 'whatsapp',
      providerMessageId: outbox.PROVIDER_MESSAGE_ID,
      toMasked: maskPhone(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
      existing: true,
    };
  }

  if (outbox && outbox.STATUS === 'SENDING') {
    return {
      success: true,
      status: 'QUEUED',
      channel: 'whatsapp',
      toMasked: maskPhone(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
    };
  }

  const header = invoice.detail.header || {};
  const serie = header.SERIEFACTURA || 'F';
  const filename = `Factura_${serie}_${invoice.numero}_${invoice.ejercicio}.pdf`;
  const captionPrefix = testRedirect ? '[TEST] ' : '';
  const caption =
    locale === 'en'
      ? `${captionPrefix}Invoice ${serie}-${invoice.numero} - Granja Mari Pepa`
      : `${captionPrefix}Factura ${serie}-${invoice.numero} - Granja Mari Pepa`;

  try {
    await outboxService.markSending(outbox.ID);
    const sent = await whatsappService.sendInvoiceDocument({
      to,
      pdfBuffer,
      filename,
      caption,
    });

    if (!sent.success) {
      await outboxService
        .markFailed(outbox.ID, sent.code || 'WHATSAPP_ERROR', sent.message || 'Error')
        .catch(() => {});
      return {
        ...sent,
        channel: 'whatsapp',
        invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
      };
    }

    await outboxService.markSent(outbox.ID, sent.providerMessageId);
    logger.info('DELIVERY_SENT', {
      channel: 'whatsapp',
      documentId,
      providerMessageId: sent.providerMessageId,
      to: maskPhone(to),
      redirected: Boolean(testRedirect),
    });

    return {
      success: true,
      status: 'SENT',
      channel: 'whatsapp',
      providerMessageId: sent.providerMessageId,
      toMasked: maskPhone(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
      redirected: Boolean(testRedirect),
    };
  } catch (error) {
    await outboxService
      .markFailed(outbox.ID, error.code || 'WHATSAPP_ERROR', error.message)
      .catch(() => {});
    logger.warn('DELIVERY_FAILED', {
      channel: 'whatsapp',
      documentId,
      code: error.code || 'WHATSAPP_ERROR',
      message: error.message,
      to: maskPhone(to),
    });
    return {
      success: false,
      code: error.code || 'WHATSAPP_ERROR',
      message: error.message,
      channel: 'whatsapp',
      toMasked: maskPhone(to),
      invoice: { numero: invoice.numero, ejercicio: invoice.ejercicio },
    };
  }
}

/**
 * Ejecuta una herramienta de envío. No usa el contexto read-only de sqlGuard:
 * necesita escribir en JAVIER.CHATBOT_OUTBOX.
 */
async function executeSendTool(name, args, user, options = {}) {
  const tool = assertToolName(name);
  const codigoCliente = requireClientCode(user);
  const rawReference = String(
    (args && (args.numero || args.codigo || args.referencia)) || '',
  ).trim();
  const ref = parseInvoiceReference(rawReference);
  const numero = ref.numero;

  if (!numero) {
    return {
      success: false,
      code: 'INVALID_ARGUMENT',
      message: 'Número o referencia de factura inválida.',
      channel: tool.includes('whatsapp') ? 'whatsapp' : 'email',
    };
  }

  if (!ref.ejercicio && rawReference.replace(/\D/g, '') === codigoCliente) {
    return {
      success: false,
      code: 'INVALID_ARGUMENT',
      message:
        'Ese es tu código de cliente, no el número de factura. Dime el número o referencia de la factura.',
      channel: tool.includes('whatsapp') ? 'whatsapp' : 'email',
    };
  }

  const profile = await customerProfileService.getProfile(codigoCliente);
  if (!profile) {
    return { success: false, code: 'PROFILE_NOT_FOUND', message: 'No se pudo cargar el perfil.' };
  }

  const invoice = await findInvoice(codigoCliente, numero, ref.ejercicio);
  if (!invoice) {
    return {
      success: false,
      code: 'INVOICE_NOT_FOUND',
      message: 'La factura no existe o no pertenece a tu cuenta.',
      channel: tool.includes('whatsapp') ? 'whatsapp' : 'email',
      invoice: { numero },
    };
  }

  let pdfBuffer;
  try {
    pdfBuffer = await pdfService.generateInvoicePDF(invoice.detail);
  } catch (error) {
    logger.error('No se pudo generar el PDF de la factura', {
      numero,
      message: error.message,
    });
    return {
      success: false,
      code: 'PDF_ERROR',
      message: 'No se pudo generar el PDF de la factura.',
      channel: tool.includes('whatsapp') ? 'whatsapp' : 'email',
      invoice: { numero, ejercicio: invoice.ejercicio },
    };
  }

  const payload = {
    profile,
    invoice: { ...invoice, numero },
    pdfBuffer,
    locale: options.locale === 'en' ? 'en' : 'es',
  };

  return tool === 'enviar_factura_email'
    ? executeEmail(payload)
    : executeWhatsApp(payload);
}

// ---------------------------------------------------------------------------
// Enlaces de descarga (PDF suelto o ZIP de un grupo)
// ---------------------------------------------------------------------------

const LINK_TTL_MS = 15 * 60 * 1000;
const LINK_SECRET =
  process.env.DOCUMENT_LINK_SECRET || process.env.JWT_ACCESS_SECRET || 'chatbot-doc-link';

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

function signDocumentToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', LINK_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

function readDocumentToken(token) {
  try {
    const [body, signature] = String(token || '').split('.');
    if (!body || !signature) return null;
    const expected = crypto
      .createHmac('sha256', LINK_SECRET)
      .update(body)
      .digest('base64url');
    if (signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || !payload.exp || Date.now() > Number(payload.exp)) return null;
    if (!payload.c) return null;
    return payload;
  } catch {
    return null;
  }
}

async function buildDocumentBundle(payload) {
  const codigoCliente = String(payload.c || '').trim();
  if (!codigoCliente) return null;
  const ejercicio = Number(payload.e) || null;

  if (payload.n) {
    const detail = await databaseService.getInvoiceDetail(
      'F',
      Number(payload.n),
      ejercicio,
      codigoCliente,
    );
    if (!detail || !detail.header) return null;
    const buffer = await pdfService.generateInvoicePDF(detail);
    return {
      buffer,
      filename: `Factura_F_${payload.n}_${detail.header.EJERCICIOFACTURA || ''}.pdf`,
      contentType: 'application/pdf',
    };
  }

  const invoices = await databaseService.getInvoices(codigoCliente, 40, 0, ejercicio);
  const month = Number(payload.m) || null;
  const selected = (invoices || [])
    .filter((invoice) => {
      if (!month) return true;
      return String(invoice.FECHA || '').split('/')[1] === String(month).padStart(2, '0');
    })
    .slice(0, 20);
  if (!selected.length) return null;

  const archiver = require('archiver');
  const chunks = [];
  const archive = archiver('zip', { zlib: { level: 9 } });
  const finished = new Promise((resolve, reject) => {
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', resolve);
    archive.on('error', reject);
  });

  for (const invoice of selected) {
    try {
      const detail = await databaseService.getInvoiceDetail(
        invoice.SERIE,
        invoice.NUMERO,
        invoice.EJERCICIO,
        codigoCliente,
      );
      if (!detail || !detail.header) continue;
      const pdf = await pdfService.generateInvoicePDF(detail);
      archive.append(pdf, {
        name: `Factura_${invoice.SERIE}_${invoice.NUMERO}_${invoice.EJERCICIO}.pdf`,
      });
    } catch {
      /* se omite la factura que no se pueda generar */
    }
  }

  await archive.finalize();
  await finished;
  if (!chunks.length) return null;

  return {
    buffer: Buffer.concat(chunks),
    filename: `Facturas_${codigoCliente}${month ? `_${month}` : ''}${ejercicio ? `_${ejercicio}` : ''}.zip`,
    contentType: 'application/zip',
  };
}

async function buildDocumentLinks({ codigoCliente, message, locale }) {
  if (!codigoCliente) return null;
  const normalized = String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!/(factura|albaran|pdf|zip|documento)/.test(normalized)) return null;
  if (!/(descarg|bajar|pdf|zip|adjunt|enlace|link|mandame|enviame|pasame)/.test(normalized)) {
    return null;
  }

  const wantsLatest = /\b(ultima|ultimas|penultima|latest|last)\b/.test(normalized);

  const ref = parseInvoiceReference(normalized);
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const monthName = Object.keys(MONTHS).find((name) => normalized.includes(name));
  const month = monthName ? MONTHS[monthName] : null;
  const ejercicio = Number(ref.ejercicio) || (yearMatch ? Number(yearMatch[1]) : null);

  const payload = {
    c: String(codigoCliente).trim(),
    exp: Date.now() + LINK_TTL_MS,
  };

  if (ref.numero) {
    payload.n = Number(ref.numero);
    const currentYear = new Date().getFullYear();
    const candidates = ejercicio
      ? [ejercicio]
      : [currentYear, currentYear - 1, currentYear - 2];
    let detail = null;
    for (const year of candidates) {
      detail = await databaseService
        .getInvoiceDetail('F', payload.n, year, payload.c)
        .catch(() => null);
      if (detail && detail.header) {
        payload.e = year;
        break;
      }
    }
    if (!detail || !detail.header) {
      return {
        reply:
          locale === 'en'
            ? 'I cannot find that invoice in your account.'
            : 'No encuentro esa factura en tu cuenta.',
        attachments: [],
      };
    }
  } else if (wantsLatest) {
    // "descarga mi ultima factura" debe devolver el PDF mas reciente, no un ZIP
    // con todo el historico.
    const recent = await databaseService.getInvoices(payload.c, 1, 0, null);
    const latest = recent && recent[0];
    if (!latest) {
      return {
        reply:
          locale === 'en'
            ? 'I cannot find any invoice in your account.'
            : 'No encuentro ninguna factura en tu cuenta.',
        attachments: [],
      };
    }
    payload.n = Number(latest.NUMERO);
    payload.e = Number(latest.EJERCICIO) || undefined;
  } else {
    payload.m = month;
    payload.e = ejercicio;
    const invoices = await databaseService.getInvoices(payload.c, 40, 0, ejercicio);
    const matching = (invoices || []).filter((invoice) => {
      if (!month) return true;
      return String(invoice.FECHA || '').split('/')[1] === String(month).padStart(2, '0');
    });
    if (!matching.length) {
      return {
        reply:
          locale === 'en'
            ? 'There are no invoices for that period.'
            : 'No hay facturas en ese periodo.',
        attachments: [],
      };
    }
  }

  const token = signDocumentToken(payload);
  const url = `/api/chatbot/documento/${token}`;
  const isSingle = Boolean(payload.n);
  const monthLabel = month
    ? Object.keys(MONTHS).find((name) => MONTHS[name] === month) || null
    : null;
  const label = isSingle
    ? `Factura F-${payload.n}${ejercicio ? `/${ejercicio}` : ''}.pdf`
    : `Facturas${monthLabel ? ` ${monthLabel}` : ''}${ejercicio ? ` ${ejercicio}` : ''}.zip`;

  return {
    reply:
      locale === 'en'
        ? isSingle
          ? 'Here is your invoice. The link expires in 15 minutes.'
          : 'Here are your invoices in a ZIP. The link expires in 15 minutes.'
        : isSingle
          ? 'Aquí tienes tu factura. El enlace caduca en 15 minutos.'
          : 'Aquí tienes tus facturas en un ZIP. El enlace caduca en 15 minutos.',
    attachments: [{ label, url }],
  };
}

module.exports = {
  TOOL_DEFINITIONS,
  TOOL_NAMES,
  executeSendTool,
  normalizeInvoiceNumber,
  maskEmail,
  maskPhone,
  isValidEmail,
  findInvoice,
  buildDocumentLinks,
  readDocumentToken,
  buildDocumentBundle,
};
