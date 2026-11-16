/**
 * Perfil de cliente para el chatbot.
 * Une DSEDAC.CLI (nombre/telefono) con JAVIER.CUSTOMER_CREDENTIALS (email/telefono verificado).
 * Cachea 5 minutos para no golpear DB2 en cada mensaje.
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function normalizePhone(raw) {
  let digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!digits) return null;
  if (digits.startsWith('34') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9) return `+34${digits}`;
  if (digits.length > 9 && digits.length <= 15) return `+${digits}`;
  return null;
}

function normalizeName(value) {
  const name = String(value || '').trim();
  return name.length > 1 ? name : null;
}

async function loadProfile(codigoCliente) {
  const code = String(codigoCliente || '').trim();
  if (!code) return null;

  const rows = await odbcPool.query(
    `SELECT
       TRIM(C.CODIGOCLIENTE) AS CODE,
       COALESCE(NULLIF(TRIM(CR.FULL_NAME), ''), NULLIF(TRIM(C.NOMBRECLIENTE), '')) AS NAME,
       NULLIF(TRIM(CR.EMAIL), '') AS EMAIL,
       COALESCE(NULLIF(TRIM(CR.PHONE), ''), NULLIF(TRIM(C.TELEFONO1), '')) AS PHONE,
       CR.EMAIL_VERIFIED,
       CR.PHONE_VERIFIED
     FROM DSEDAC.CLI C
     LEFT JOIN JAVIER.CUSTOMER_CREDENTIALS CR
       ON TRIM(CR.CUSTOMER_CODE) = TRIM(C.CODIGOCLIENTE)
     WHERE TRIM(C.CODIGOCLIENTE) = ?
     FETCH FIRST 1 ROW ONLY`,
    [code],
  );

  const row = rows[0] || {};
  return {
    codigoCliente: code,
    nombre: normalizeName(row.NAME),
    email: row.EMAIL ? String(row.EMAIL).trim() : null,
    telefono: normalizePhone(row.PHONE),
    role: 'cliente',
    emailVerified: String(row.EMAIL_VERIFIED || '') === '1',
    phoneVerified: String(row.PHONE_VERIFIED || '') === '1',
  };
}

async function getProfile(codigoCliente) {
  const code = String(codigoCliente || '').trim();
  if (!code) return null;

  const cached = cache.get(code);
  if (cached && cached.expiresAt > Date.now()) return cached.profile;

  try {
    const profile = await loadProfile(code);
    if (profile) cache.set(code, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    return profile;
  } catch (error) {
    logger.error('No se pudo cargar el perfil del cliente', {
      codigoCliente: code,
      message: error.message,
    });
    return {
      codigoCliente: code,
      nombre: null,
      email: null,
      telefono: null,
      role: 'cliente',
      emailVerified: false,
      phoneVerified: false,
    };
  }
}

function clearProfileCache(codigoCliente) {
  if (codigoCliente) cache.delete(String(codigoCliente).trim());
  else cache.clear();
}

module.exports = {
  getProfile,
  clearProfileCache,
  normalizePhone,
  normalizeName,
};
