/**
 * Parser único de referencias de factura/albarán.
 * Acepta: F-1234, F/1234/2025, F 1234 2025, 1234/2025, 2025-1234, 1234.
 * No consulta la base de datos; solo normaliza la referencia.
 */

function parseInvoiceReference(raw) {
  let text = String(raw || '').trim().toUpperCase();
  if (!text) return { serie: 'F', numero: null, ejercicio: null, raw: '' };

  text = text
    .replace(/^(FACTURA|ALBARAN|ALBARÁN|FAC)\s*[:#-]?\s*/i, '')
    .trim();

  let match = text.match(/^F[\/\-\s]?(\d{1,6})[\/\-\s](\d{4})$/);
  if (match) return { serie: 'F', numero: match[1], ejercicio: Number(match[2]), raw: text };

  match = text.match(/^F[\/\-\s]?(\d{4})[\/\-\s](\d{1,6})$/);
  if (match) return { serie: 'F', numero: match[2], ejercicio: Number(match[1]), raw: text };

  match = text.match(/^(\d{4})[\/\-\s](\d{1,6})$/);
  if (match && Number(match[1]) >= 1900 && Number(match[1]) <= 2100) {
    return { serie: 'F', numero: match[2], ejercicio: Number(match[1]), raw: text };
  }

  match = text.match(/^(\d{1,6})[\/\-\s](\d{4})$/);
  if (match) return { serie: 'F', numero: match[1], ejercicio: Number(match[2]), raw: text };

  match = text.match(/^F[\/\-\s]?(\d{1,6})$/);
  if (match) return { serie: 'F', numero: match[1], ejercicio: null, raw: text };

  match = text.match(/^(\d{4})[\/\-\s]?(\d{1,6})$/);
  if (match && Number(match[1]) >= 1900 && Number(match[1]) <= 2100) {
    return { serie: 'F', numero: match[2], ejercicio: Number(match[1]), raw: text };
  }

  match = text.match(/^(\d{1,6})$/);
  if (match) return { serie: 'F', numero: match[1], ejercicio: null, raw: text };

  const digits = text.replace(/\D/g, '');
  if (digits.length >= 1 && digits.length <= 6) {
    return { serie: 'F', numero: digits, ejercicio: null, raw: text };
  }

  return { serie: 'F', numero: null, ejercicio: null, raw: text };
}

module.exports = { parseInvoiceReference };
