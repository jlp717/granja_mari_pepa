/**
 * CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
 * =======================================
 * API real respaldada por IBM i (esquema JAVIER).
 * Sesión por cookie httpOnly + SameSite=Strict, además de la puerta de red.
 */

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const adminService = require('../services/adminService');
const contentEvents = require('../services/contentEvents');
const logger = require('../utils/logger');

const COOKIE_NAME = 'gmp_admin_session';
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'admin');
const CV_DIR = path.join(__dirname, '..', '..', 'private', 'cv');

function cookieOptions(req) {
  const forwarded = String(req?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const secure = forwarded === "https" || Boolean(req?.secure);
  return {
    httpOnly: true,
    sameSite: "strict",
    secure,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    priority: "high",
  };
}

function actor(req) {
  return (
    (req.admin && (req.admin.name || req.admin.email)) ||
    req.adminIp ||
    'panel'
  );
}

function fail(res, status, message, code) {
  return res.status(status).json({ success: false, message, code });
}

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error('Error en API de administración', {
        message: error.message,
        stack: error.stack,
        path: req.path,
      });
      if (!res.headersSent) {
        fail(res, 500, 'No se pudo completar la operación en la base de datos.');
      }
    }
  };
}

async function requireSession(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  const session = await adminService.getSession(token);
  if (!session) {
    return fail(res, 401, 'Sesión caducada o no iniciada.', 'SESSION_REQUIRED');
  }
  req.admin = session;
  req.adminToken = token;
  return next();
}

async function health(_req, res) {
  return res.json({ success: true, service: 'admin', schema: adminService.SCHEMA });
}

const login = wrap(async (req, res) => {
  const body = req.body || {};
  const identifier = body.username || body.email;
  const { password } = body;
  if (!identifier || !password) {
    return fail(res, 400, 'Introduce tu usuario y tu contraseña.');
  }
  const result = await adminService.authenticate(
    identifier,
    password,
    req.adminIp || '',
    req.headers['user-agent'] || '',
  );
  if (result.error === 'locked') {
    return fail(
      res,
      429,
      'Demasiados intentos fallidos. Espera 15 minutos o contacta con el administrador.',
      'LOGIN_LOCKED',
    );
  }
  if (result.error) {
    return fail(res, 401, 'Usuario o contraseña incorrectos.', 'BAD_CREDENTIALS');
  }
  res.cookie(COOKIE_NAME, result.token, cookieOptions(req));
  return res.json({ success: true, user: result.user });
});

const logout = wrap(async (req, res) => {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  await adminService.destroySession(token);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(req), maxAge: undefined });
  return res.json({ success: true });
});

const session = wrap(async (req, res) => {
  const token = req.cookies ? req.cookies[COOKIE_NAME] : null;
  const current = await adminService.getSession(token);
  if (!current) {
    return res.json({ success: true, authenticated: false, network: { ip: req.adminIp } });
  }
  return res.json({
    success: true,
    authenticated: true,
    user: current,
    network: { ip: req.adminIp },
  });
});

const bootstrap = wrap(async (req, res) => {
  const data = await adminService.bootstrap(actor(req));
  return res.json({ success: true, ...data });
});

const sessions = wrap(async (req, res) => {
  const rows = await adminService.listSessions(req.adminToken);
  return res.json({ success: true, sessions: rows });
});

const revokeSession = wrap(async (req, res) => {
  const done = await adminService.revokeSession(
    String(req.params.token || '').slice(0, 128),
    actor(req),
  );
  if (!done) return fail(res, 404, 'La sesión ya no existe.');
  return res.json({ success: true });
});

const revokeOtherSessions = wrap(async (req, res) => {
  await adminService.revokeOtherSessions(
    req.admin.id,
    req.adminToken,
    actor(req),
  );
  return res.json({ success: true });
});

/* ------------------------------------------------------------------ jobs */

const createJob = wrap(async (req, res) => {
  const job = await adminService.createJob(req.body || {}, actor(req));
  contentEvents.publishAdmin('jobs', 'created');
  contentEvents.publishPublic('jobs', 'created');
  return res.status(201).json({ success: true, job });
});

const updateJob = wrap(async (req, res) => {
  const job = await adminService.updateJob(req.params.id, req.body || {}, actor(req));
  if (!job) return fail(res, 404, 'La oferta ya no existe.');
  contentEvents.publishAdmin('jobs', 'updated');
  contentEvents.publishPublic('jobs', 'updated');
  return res.json({ success: true, job });
});

const jobStatus = wrap(async (req, res) => {
  const status = req.body && req.body.status === 'published' ? 'published' : 'draft';
  const job = await adminService.setJobStatus(req.params.id, status, actor(req));
  if (!job) return fail(res, 404, 'La oferta ya no existe.');
  contentEvents.publishAdmin('jobs', 'updated');
  contentEvents.publishPublic('jobs', 'updated');
  return res.json({ success: true, job });
});

const duplicateJob = wrap(async (req, res) => {
  const job = await adminService.duplicateJob(req.params.id, actor(req));
  if (!job) return fail(res, 404, 'La oferta ya no existe.');
  contentEvents.publishAdmin('jobs', 'created');
  contentEvents.publishPublic('jobs', 'created');
  return res.status(201).json({ success: true, job });
});

const deleteJob = wrap(async (req, res) => {
  const done = await adminService.deleteJob(req.params.id, actor(req));
  if (!done) return fail(res, 404, 'La oferta ya no existe.');
  contentEvents.publishAdmin('jobs', 'deleted');
  contentEvents.publishPublic('jobs', 'deleted');
  return res.json({ success: true });
});

/* ------------------------------------------------------------- magazines */

const createMagazine = wrap(async (req, res) => {
  const magazine = await adminService.createMagazine(req.body || {}, actor(req));
  contentEvents.publishAdmin('magazines', 'created');
  contentEvents.publishPublic('magazines', 'created');
  return res.status(201).json({ success: true, magazine });
});

const updateMagazine = wrap(async (req, res) => {
  const magazine = await adminService.updateMagazine(req.params.id, req.body || {}, actor(req));
  if (!magazine) return fail(res, 404, 'La revista ya no existe.');
  contentEvents.publishAdmin('magazines', 'updated');
  contentEvents.publishPublic('magazines', 'updated');
  return res.json({ success: true, magazine });
});

const magazineStatus = wrap(async (req, res) => {
  const status = req.body && req.body.status === 'published' ? 'published' : 'draft';
  const magazine = await adminService.setMagazineStatus(req.params.id, status, actor(req));
  if (!magazine) return fail(res, 404, 'La revista ya no existe.');
  contentEvents.publishAdmin('magazines', 'updated');
  contentEvents.publishPublic('magazines', 'updated');
  return res.json({ success: true, magazine });
});

const deleteMagazine = wrap(async (req, res) => {
  const done = await adminService.deleteMagazine(req.params.id, actor(req));
  if (!done) return fail(res, 404, 'La revista ya no existe.');
  contentEvents.publishAdmin('magazines', 'deleted');
  contentEvents.publishPublic('magazines', 'deleted');
  return res.json({ success: true });
});

/* ---------------------------------------------------------- applications */

const updateApplication = wrap(async (req, res) => {
  await adminService.updateApplication(req.params.id, req.body || {}, actor(req));
  contentEvents.publishAdmin('applications', 'updated');
  return res.json({ success: true });
});

const deleteApplication = wrap(async (req, res) => {
  const done = await adminService.deleteApplication(req.params.id, actor(req));
  if (!done) return fail(res, 404, 'La candidatura ya no existe.');
  contentEvents.publishAdmin('applications', 'deleted');
  return res.json({ success: true });
});

/* ------------------------------------------------------------------ team */

const inviteMember = wrap(async (req, res) => {
  const result = await adminService.inviteUser(req.body || {}, actor(req));
  if (result.error === 'exists') {
    return fail(res, 409, 'Ese email ya tiene acceso o una invitación pendiente.');
  }
  if (result.error === 'weak') {
    return fail(res, 400, 'La contraseña temporal debe tener al menos 10 caracteres.');
  }
  if (result.error) return fail(res, 400, 'Introduce un email válido.');
  contentEvents.publishAdmin('team', 'created');
  return res.status(201).json({ success: true });
});

const revokeMember = wrap(async (req, res) => {
  const done = await adminService.revokeUser(req.params.id, actor(req));
  if (!done) return fail(res, 404, 'Ese acceso ya no existe.');
  contentEvents.publishAdmin('team', 'deleted');
  return res.json({ success: true });
});

const resendInvite = wrap(async (req, res) => {
  const { email } = req.body || {};
  await adminService.logActivity({
    kind: 'invite',
    entity: 'Equipo',
    detail: `Invitación reenviada a ${String(email || '').slice(0, 160)}`,
    actor: actor(req),
  });
  contentEvents.publishAdmin('team', 'updated');
  return res.json({ success: true });
});

/* -------------------------------------------------------------- settings */

const saveSettings = wrap(async (req, res) => {
  const settings = await adminService.saveSettings(req.body || {}, actor(req));
  contentEvents.publishAdmin('settings', 'updated');
  contentEvents.publishPublic('settings', 'updated');
  return res.json({ success: true, settings });
});

const changePassword = wrap(async (req, res) => {
  const { currentPassword, nextPassword } = req.body || {};
  const result = await adminService.changePassword(
    req.admin.id,
    currentPassword,
    nextPassword,
  );
  if (result.error === 'current') return fail(res, 400, 'La contraseña actual no es correcta.');
  if (result.error === 'weak') return fail(res, 400, 'La nueva contraseña debe tener al menos 10 caracteres.');
  if (result.error) return fail(res, 404, 'La cuenta ya no existe.');
  await adminService.logActivity({
    kind: 'settings',
    entity: 'Acceso',
    detail: 'Contraseña del panel actualizada',
    actor: actor(req),
  });
  return res.json({ success: true });
});

/* ---------------------------------------------------------------- uploads */

const EXTENSIONS = {
  pdf: '.pdf',
  png: '.png',
  jpg: '.jpg',
  webp: '.webp',
};

function detectExtension(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString('ascii') === '%PDF') return EXTENSIONS.pdf;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return EXTENSIONS.png;
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return EXTENSIONS.jpg;
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return EXTENSIONS.webp;
  }
  return null;
}

const upload = wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return fail(res, 400, 'No se recibió ningún archivo.');
  }
  if (req.body.length > 25 * 1024 * 1024) {
    return fail(res, 413, 'El archivo supera el límite de 25 MB.');
  }
  const extension = detectExtension(req.body);
  if (!extension) {
    return fail(res, 400, 'Formato no admitido. Usa PDF, PNG, JPG o WEBP.');
  }
  const original = String(req.query.name || 'archivo')
    .replace(/[^\w.\- ]+/g, '')
    .slice(0, 60)
    .replace(/\s+/g, '-');
  const base = original.replace(/\.[^.]+$/, '') || 'archivo';
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${extension}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), req.body);
  return res.status(201).json({
    success: true,
    name: `${base}${extension}`,
    url: `/uploads/admin/${filename}`,
    bytes: req.body.length,
  });
});

/* ---------------------------------------------------------------- public */

const publicJobs = wrap(async (_req, res) => {
  const jobs = await adminService.listPublicJobs();
  return res.json({ success: true, jobs });
});

const publicJob = wrap(async (req, res) => {
  const job = await adminService.getPublicJob(req.params.slug);
  if (!job) return fail(res, 404, 'Oferta no encontrada.');
  return res.json({ success: true, job });
});

const publicMagazines = wrap(async (_req, res) => {
  const magazines = await adminService.listPublicMagazines();
  return res.json({ success: true, magazines });
});

const publicApplication = wrap(async (req, res) => {
  const payload = req.body || {};
  if (!payload.name || !payload.email) {
    return fail(res, 400, 'El nombre y el email son obligatorios.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) {
    return fail(res, 400, 'El email no es válido.');
  }
  const settings = await adminService.getSettings();
  if (!settings.applicationsOpen) {
    return fail(res, 403, 'Las candidaturas están cerradas en este momento.', 'APPLICATIONS_CLOSED');
  }
  const id = await adminService.createApplication(payload, { ip: req.adminIp });
  if (!id) return fail(res, 400, 'No se pudo registrar la candidatura.');
  contentEvents.publishAdmin('applications', 'created');
  return res.status(201).json({ success: true, id });
});

const publicCv = wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return fail(res, 400, 'No se recibió ningún archivo.');
  }
  if (req.body.length > 10 * 1024 * 1024) {
    return fail(res, 413, 'El currículum no puede superar 10 MB.');
  }
  if (req.body.subarray(0, 4).toString('ascii') !== '%PDF') {
    return fail(res, 400, 'El currículum debe ser un PDF.');
  }
  const original = String(req.query.name || 'cv')
    .replace(/[^\w.\- ]+/g, '')
    .slice(0, 60)
    .replace(/\s+/g, '-')
    .replace(/\.pdf$/i, '');
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${original || 'cv'}.pdf`;
  await fs.mkdir(CV_DIR, { recursive: true });
  await fs.writeFile(path.join(CV_DIR, filename), req.body);
  return res.status(201).json({
    success: true,
    name: `${original || 'cv'}.pdf`,
    url: `/api/admin/cv/${filename}`,
    bytes: req.body.length,
  });
});

const downloadCv = wrap(async (req, res) => {
  const file = String(req.params.file || '');
  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(file)) {
    return fail(res, 400, 'Archivo no válido.');
  }
  const full = path.join(CV_DIR, file);
  try {
    await fs.access(full);
  } catch {
    return fail(res, 404, 'El currículum ya no está disponible.');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${file}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
  return res.sendFile(full);
});

const adminEvents = (req, res) => contentEvents.streamAdmin(req, res);
const publicEvents = (req, res) => contentEvents.streamPublic(req, res);

module.exports = {
  health,
  adminEvents,
  publicEvents,
  requireSession,
  login,
  logout,
  session,
  bootstrap,
  sessions,
  revokeSession,
  revokeOtherSessions,
  createJob,
  updateJob,
  jobStatus,
  duplicateJob,
  deleteJob,
  createMagazine,
  updateMagazine,
  magazineStatus,
  deleteMagazine,
  updateApplication,
  deleteApplication,
  inviteMember,
  revokeMember,
  resendInvite,
  saveSettings,
  changePassword,
  upload,
  publicJobs,
  publicJob,
  publicMagazines,
  publicApplication,
  publicCv,
  downloadCv,
  COOKIE_NAME,
};
