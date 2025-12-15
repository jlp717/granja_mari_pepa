/**
 * VALIDADORES DE SEGURIDAD
 * ==========================
 * Funciones para validar y sanitizar inputs
 */

/**
 * Validar email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar código de cliente (formato numérico)
 */
function isValidClientCode(code) {
  const codeRegex = /^\d{10,13}$/;
  return codeRegex.test(code);
}

/**
 * Sanitizar string (prevenir SQLi y XSS)
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover < >
    .replace(/['";]/g, '') // Remover comillas
    .substring(0, 255); // Limitar longitud
}

/**
 * Validar número de factura
 */
function isValidInvoiceNumber(numero) {
  return /^\d{1,10}$/.test(numero);
}

/**
 * Validar serie de factura
 */
function isValidSerie(serie) {
  return /^[A-Z0-9]{1,10}$/.test(serie);
}

/**
 * Detectar patrones maliciosos (SQLi, XSS, etc.)
 */
function containsMaliciousPattern(input) {
  const maliciousPatterns = [
    /(\bor\b|\band\b).*?=.*?=/i, // SQL injection
    /<script/i, // XSS
    /javascript:/i, // XSS
    /onerror=/i, // XSS
    /onload=/i, // XSS
    /eval\(/i, // Code injection
    /union.*select/i, // SQL injection
    /drop.*table/i, // SQL injection
    /insert.*into/i, // SQL injection
    /delete.*from/i, // SQL injection
    /update.*set/i // SQL injection
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
}

module.exports = {
  isValidEmail,
  isValidClientCode,
  sanitizeString,
  isValidInvoiceNumber,
  isValidSerie,
  containsMaliciousPattern
};
