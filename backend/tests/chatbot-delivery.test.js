const {
  normalizePhone,
  normalizeName,
} = require('../app/services/customerProfileService');
const { buildIdempotencyKey } = require('../app/services/outboxService');
const {
  normalizeInvoiceNumber,
  maskEmail,
  maskPhone,
  isValidEmail,
} = require('../app/security/sendTools');
const { __test } = require('../app/controllers/chatbotController');

describe('chatbot delivery helpers', () => {
  test('normaliza teléfonos españoles e internacionales', () => {
    expect(normalizePhone('639778656')).toBe('+34639778656');
    expect(normalizePhone('+34 639 77 86 56')).toBe('+34639778656');
    expect(normalizePhone('0034612345678')).toBe('+34612345678');
    expect(normalizePhone('')).toBeNull();
  });

  test('normaliza nombres vacíos', () => {
    expect(normalizeName('  ')).toBeNull();
    expect(normalizeName(' Ana ')).toBe('Ana');
  });

  test('normaliza números de factura', () => {
    expect(normalizeInvoiceNumber('F-1234')).toBe('1234');
    expect(normalizeInvoiceNumber('factura 99')).toBe('99');
    expect(normalizeInvoiceNumber('abc')).toBeNull();
  });

  test('enmascara email y teléfono', () => {
    expect(maskEmail('cliente@example.com')).toBe('c***@example.com');
    expect(maskPhone('+34639778656')).toBe('***656');
    expect(maskEmail('sin-arroba')).toBe('***');
  });

  test('valida emails', () => {
    expect(isValidEmail('cliente@example.com')).toBe(true);
    expect(isValidEmail('cliente@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('idempotency key es estable y cambia por canal', () => {
    const base = {
      customerCode: '4300000000',
      documentId: 'F/F/1/2026',
      channel: 'email',
      recipient: 'cliente@example.com',
      date: '2026-11-13',
    };
    expect(buildIdempotencyKey(base)).toBe(buildIdempotencyKey({ ...base }));
    expect(buildIdempotencyKey(base)).not.toBe(
      buildIdempotencyKey({ ...base, channel: 'whatsapp' }),
    );
  });

  test('normaliza entidades HTML y acentos para intenciones', () => {
    const text = __test.normalizeIntentText(
      'env&iacute;a mi &uacute;ltima factura por email',
    );
    expect(text).toContain('envia');
    expect(text).toContain('ultima');
    expect(text).toContain('factura');
    expect(__test.extractInvoiceNumber('F-1234')).toBe('F-1234');
  });

  test('whoami responde con el nombre verificado', () => {
    const reply = __test.whoAmIReply(
      { codigoCliente: '4300000000', nombre: 'Ana' },
      'es',
    );
    expect(reply).toContain('Ana');
    expect(reply).toContain('0000');
  });

  test('sendStatusReply no afirma envío si falló', () => {
    const sent = __test.sendStatusReply(
      {
        success: true,
        status: 'SENT',
        channel: 'email',
        toMasked: 'c***@example.com',
        providerMessageId: 'id-123',
        invoice: { numero: '1' },
      },
      'es',
    );
    expect(sent).toContain('He enviado');
    expect(sent).toContain('id-123');

    const failed = __test.sendStatusReply(
      {
        success: false,
        code: 'CHANNEL_NOT_CONFIGURED',
        fallbackUrl: 'https://wa.me/34600000000',
      },
      'es',
    );
    expect(failed).toContain('no está configurado');
    expect(failed).toContain('https://wa.me/');
  });
});
