/**
 * Puerta de red del panel de administración.
 * Solo permite tráfico originado en la red interna de la empresa o VPN.
 * La comprobación del frontend (middleware.ts) es la primera barrera; esta
 * segunda comprobación protege la API aunque se llame directamente.
 */

const crypto = require('crypto');

const PRIVATE_PREFIXES = [
  '10.',
  '192.168.',
  '::ffff:10.',
  '::ffff:192.168.',
];

const ADMIN_ACCESS_COOKIE = 'gmp_admin_access';

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (typeof header !== 'string' || !header) return '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
  return '';
}

/** Same stateless token the Next middleware issues after internal enrolment. */
function hasEnrolledDevice(req) {
  const secret = process.env.ADMIN_ACCESS_SECRET || '';
  if (secret.length < 32) return false;
  const token = readCookie(req, ADMIN_ACCESS_COOKIE);
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`v1.${parts[1]}.${parts[2]}`)
    .digest('hex');
  const provided = Buffer.from(parts[3], 'hex');
  const reference = Buffer.from(expected, 'hex');
  return (
    provided.length === reference.length &&
    crypto.timingSafeEqual(provided, reference)
  );
}

function normalize(ip) {
  return String(ip || '')
    .replace(/^::ffff:/i, '')
    .trim();
}

function isLoopback(ip) {
  return ip === '127.0.0.1' || ip.startsWith('127.') || ip === '::1';
}

// Solo el proxy local puede aportar cabeceras de reenvío fiables. Una petición
// directa desde otra IP no puede falsificar X-Real-IP para entrar al panel.
function peerIsLoopback(req) {
  return isLoopback(normalize(req.socket?.remoteAddress || ''));
}

function isPrivate172(ip) {
  const match = /^172\.(\d{1,3})\./.exec(ip);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

function isInternalIp(ip) {
  const value = normalize(ip);
  if (!value) return false;
  if (isLoopback(value)) {
    // En producción un loopback solo es válido si el proxy está configurado
    // explícitamente para confiar en él (health checks internos).
    return process.env.NODE_ENV !== 'production' || process.env.ADMIN_TRUST_LOOPBACK === '1';
  }
  const extra = (process.env.ADMIN_ALLOWED_CIDRS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (extra.some((prefix) => value === prefix || value.startsWith(prefix))) return true;
  if (PRIVATE_PREFIXES.some((prefix) => value.startsWith(prefix))) return true;
  return isPrivate172(value);
}

function clientIp(req) {
  const peer = normalize(req.socket?.remoteAddress || '');
  if (peerIsLoopback(req)) {
    const cf = req.headers['cf-connecting-ip'];
    if (typeof cf === 'string' && cf.length) {
      return normalize(cf);
    }
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real.length) return normalize(real);
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length) {
      return normalize(forwarded.split(',')[0]);
    }
  }
  return peer || normalize(req.ip || '');
}

function requireInternalNetwork(req, res, next) {
  const ip = clientIp(req);
  if (isInternalIp(ip) || hasEnrolledDevice(req)) {
    req.adminIp = ip;
    return next();
  }
  return res.status(403).json({
    success: false,
    code: 'NETWORK_NOT_ALLOWED',
    message:
      'El panel de administración solo está disponible desde la red interna de Granja Mari Pepa o su VPN.',
  });
}

module.exports = { requireInternalNetwork, clientIp, isInternalIp };
