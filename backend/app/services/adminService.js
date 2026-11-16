/**
 * SERVICIO DE ADMINISTRACIÓN WEB
 * ==============================
 * Ofertas de empleo, revistas, candidaturas, equipo y ajustes del panel
 * interno. Persistencia real en IBM i (esquema JAVIER).
 *
 * Reglas:
 * - Ningún borrado físico: ACTIVE = 0 y DELETED_AT.
 * - Fechas de auditoría: CREATED_AT / UPDATED_AT / DELETED_AT.
 * - Toda mutación deja rastro en ADMIN_ACTIVITY.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('../config/odbcConfig');
const logger = require('../utils/logger');
const emailService = require('./emailService');

const SCHEMA = 'JAVIER';
const SESSION_HOURS = 8;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

const DEFAULT_SETTINGS = {
  rrhh_email: 'cv.rrhh@maripepa.es',
  phone: '968 46 75 14',
  offers_public: '1',
  applications_open: '1',
  internal_note:
    'Responder candidaturas en un máximo de 10 días laborables. Prioridad a perfiles de Lorca.'
};

function table(name) {
  return `${SCHEMA}.${name}`;
}

function iso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(' ', 'T');
}

function listToText(items) {
  const list = Array.isArray(items) ? items.filter((item) => typeof item === 'string') : [];
  return JSON.stringify(list.map((item) => item.slice(0, 400)));
}

function textToList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function str(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max);
}

function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/* ------------------------------------------------------------------ jobs */

function parseDetails(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        label: str(item && item.label, 80),
        value: str(item && item.value, 400),
      }))
      .filter((item) => item.label || item.value);
  } catch {
    return [];
  }
}

function serializeDetails(value) {
  if (!Array.isArray(value)) return '';
  const clean = value
    .map((item) => ({
      label: str(item && item.label, 80),
      value: str(item && item.value, 400),
    }))
    .filter((item) => item.label || item.value);
  return (clean.length ? JSON.stringify(clean) : '').slice(0, 3000);
}

function mapJob(row) {
  return {
    id: String(row.ID).trim(),
    slug: String(row.SLUG).trim(),
    title: String(row.TITLE).trim(),
    department: String(row.DEPARTMENT).trim(),
    location: String(row.LOCATION).trim(),
    type: String(row.JOB_TYPE).trim(),
    schedule: String(row.SCHEDULE).trim(),
    description: String(row.DESCRIPTION).trim(),
    responsibilities: textToList(String(row.RESPONSIBILITIES)),
    requirements: textToList(String(row.REQUIREMENTS)),
    offers: textToList(String(row.OFFERS)),
    details: parseDetails(row.DETAILS),
    icon: String(row.ICON).trim(),
    accent: String(row.ACCENT).trim(),
    status: String(row.STATUS).trim(),
    createdAt: iso(row.CREATED_AT),
    updatedAt: iso(row.UPDATED_AT),
    createdBy: String(row.CREATED_BY || '').trim(),
    updatedBy: String(row.UPDATED_BY || '').trim(),
  };
}

const JOB_COLUMNS = `ID, SLUG, TITLE, DEPARTMENT, LOCATION, JOB_TYPE, SCHEDULE, DESCRIPTION,
  RESPONSIBILITIES, REQUIREMENTS, OFFERS, DETAILS, ICON, ACCENT, STATUS,
  CREATED_AT, UPDATED_AT, CREATED_BY, UPDATED_BY`;

async function listJobs({ includeDeleted = false } = {}) {
  const sql = `SELECT ${JOB_COLUMNS} FROM ${table('ADMIN_JOB_OFFERS')}
    WHERE ${includeDeleted ? '1 = 1' : 'ACTIVE = 1'} ORDER BY UPDATED_AT DESC`;
  const rows = await query(sql);
  return rows.map(mapJob);
}

async function getJob(id) {
  const rows = await query(
    `SELECT ${JOB_COLUMNS} FROM ${table('ADMIN_JOB_OFFERS')} WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  return rows.length ? mapJob(rows[0]) : null;
}

async function jobSlugTaken(slug, exceptId) {
  const rows = await query(
    `SELECT ID FROM ${table('ADMIN_JOB_OFFERS')} WHERE SLUG = ? AND ACTIVE = 1`,
    [slug],
  );
  return rows.some((row) => String(row.ID).trim() !== exceptId);
}

async function uniqueJobSlug(base, exceptId) {
  const root = slugify(base) || 'oferta';
  let candidate = root;
  let index = 2;
  while (await jobSlugTaken(candidate, exceptId)) {
    candidate = `${root}-${index}`;
    index += 1;
  }
  return candidate;
}

async function createJob(payload, actor) {
  const now = new Date().toISOString();
  const id = str(payload.id, 64) || newId('job');
  const slug = await uniqueJobSlug(payload.slug || payload.title, id);
  await query(
    `INSERT INTO ${table('ADMIN_JOB_OFFERS')}
      (ID, SLUG, TITLE, DEPARTMENT, LOCATION, JOB_TYPE, SCHEDULE, DESCRIPTION,
       RESPONSIBILITIES, REQUIREMENTS, OFFERS, DETAILS, ICON, ACCENT, STATUS, ACTIVE,
       CREATED_BY, UPDATED_BY)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [
      id,
      slug,
      str(payload.title, 160),
      str(payload.department, 80),
      str(payload.location, 80),
      str(payload.type, 80),
      str(payload.schedule, 80),
      str(payload.description, 2000),
      listToText(payload.responsibilities),
      listToText(payload.requirements),
      listToText(payload.offers),
      serializeDetails(payload.details),
      str(payload.icon, 24) || 'warehouse',
      str(payload.accent, 24) || '#C24A1F',
      payload.status === 'published' ? 'published' : 'draft',
      actor,
      actor,
    ],
  );
  await logActivity({
    kind: 'create',
    entity: 'Oferta',
    detail: `${str(payload.title, 160) || 'Oferta'} · creada`,
    actor,
  });
  return getJob(id);
}

async function updateJob(id, payload, actor) {
  const current = await getJob(id);
  if (!current) return null;
  const slug = await uniqueJobSlug(payload.slug || payload.title || current.title, id);
  await query(
    `UPDATE ${table('ADMIN_JOB_OFFERS')} SET
      SLUG = ?, TITLE = ?, DEPARTMENT = ?, LOCATION = ?, JOB_TYPE = ?, SCHEDULE = ?,
      DESCRIPTION = ?, RESPONSIBILITIES = ?, REQUIREMENTS = ?, OFFERS = ?, DETAILS = ?,
      ICON = ?, ACCENT = ?, STATUS = ?, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
     WHERE ID = ? AND ACTIVE = 1`,
    [
      slug,
      str(payload.title, 160),
      str(payload.department, 80),
      str(payload.location, 80),
      str(payload.type, 80),
      str(payload.schedule, 80),
      str(payload.description, 2000),
      listToText(payload.responsibilities),
      listToText(payload.requirements),
      listToText(payload.offers),
      serializeDetails(payload.details),
      str(payload.icon, 24) || 'warehouse',
      str(payload.accent, 24) || '#C24A1F',
      payload.status === 'published' ? 'published' : 'draft',
      actor,
      id,
    ],
  );
  await logActivity({
    kind: 'update',
    entity: 'Oferta',
    detail: `${str(payload.title, 160) || current.title} · actualizada`,
    actor,
  });
  return getJob(id);
}

async function setJobStatus(id, status, actor) {
  const current = await getJob(id);
  if (!current) return null;
  const next = status === 'published' ? 'published' : 'draft';
  await query(
    `UPDATE ${table('ADMIN_JOB_OFFERS')}
       SET STATUS = ?, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
     WHERE ID = ? AND ACTIVE = 1`,
    [next, actor, id],
  );
  await logActivity({
    kind: next === 'published' ? 'publish' : 'status',
    entity: 'Oferta',
    detail:
      next === 'published'
        ? `${current.title} · publicada`
        : `${current.title} · pasada a borrador`,
    actor,
  });
  return getJob(id);
}

async function deleteJob(id, actor) {
  const current = await getJob(id);
  if (!current) return false;
  await query(
    `UPDATE ${table('ADMIN_JOB_OFFERS')}
       SET ACTIVE = 0, DELETED_AT = CURRENT TIMESTAMP, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
     WHERE ID = ? AND ACTIVE = 1`,
    [actor, id],
  );
  await logActivity({
    kind: 'delete',
    entity: 'Oferta',
    detail: `${current.title} · eliminada`,
    actor,
  });
  return true;
}

async function duplicateJob(id, actor) {
  const current = await getJob(id);
  if (!current) return null;
  return createJob(
    {
      ...current,
      id: newId('job'),
      slug: `${current.slug}-copia`,
      title: `${current.title} (copia)`,
      status: 'draft',
    },
    actor,
  );
}

/* ------------------------------------------------------------- magazines */

function mapMagazine(row) {
  return {
    id: String(row.ID).trim(),
    title: String(row.TITLE).trim(),
    edition: String(row.EDITION).trim(),
    date: row.PUB_DATE ? String(row.PUB_DATE).slice(0, 10) : '',
    description: String(row.DESCRIPTION).trim(),
    pdfUrl: String(row.PDF_URL || '').trim(),
    pdfName: String(row.PDF_NAME || '').trim(),
    coverUrl: String(row.COVER_URL || '').trim(),
    status: String(row.STATUS).trim(),
    createdAt: iso(row.CREATED_AT),
    updatedAt: iso(row.UPDATED_AT),
    createdBy: String(row.CREATED_BY || '').trim(),
    updatedBy: String(row.UPDATED_BY || '').trim(),
  };
}

const MAGAZINE_COLUMNS = `ID, TITLE, EDITION, PUB_DATE, DESCRIPTION, PDF_URL, PDF_NAME,
  COVER_URL, STATUS, CREATED_AT, UPDATED_AT, CREATED_BY, UPDATED_BY`;

const ADMIN_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'admin');

function readUploadedPdf(pdfUrl) {
  const match = /^\/uploads\/admin\/([A-Za-z0-9._-]+\.pdf)$/.exec(String(pdfUrl || ''));
  if (!match) return null;
  try {
    return fs.readFileSync(path.join(ADMIN_UPLOAD_DIR, match[1]));
  } catch {
    return null;
  }
}

async function listMagazines() {
  const rows = await query(
    `SELECT ${MAGAZINE_COLUMNS} FROM ${table('ADMIN_MAGAZINES')}
      WHERE ACTIVE = 1 ORDER BY PUB_DATE DESC, UPDATED_AT DESC`,
  );
  return rows.map(mapMagazine);
}

async function getMagazine(id) {
  const rows = await query(
    `SELECT ${MAGAZINE_COLUMNS} FROM ${table('ADMIN_MAGAZINES')} WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  return rows.length ? mapMagazine(rows[0]) : null;
}

async function createMagazine(payload, actor) {
  const id = str(payload.id, 64) || newId('mag');
  const pdfData = readUploadedPdf(payload.pdfUrl);
  await query(
    `INSERT INTO ${table('ADMIN_MAGAZINES')}
      (ID, TITLE, EDITION, PUB_DATE, DESCRIPTION, PDF_URL, PDF_NAME, COVER_URL,
       STATUS, PDF_DATA, ACTIVE, CREATED_BY, UPDATED_BY)
     VALUES (?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [
      id,
      str(payload.title, 160),
      str(payload.edition, 80),
      str(payload.date, 10) || null,
      str(payload.description, 2000),
      str(payload.pdfUrl, 500),
      str(payload.pdfName, 255),
      str(payload.coverUrl, 500),
      payload.status === 'published' ? 'published' : 'draft',
      pdfData,
      actor,
      actor,
    ],
  );
  await logActivity({
    kind: 'create',
    entity: 'Revista',
    detail: `${str(payload.title, 160) || 'Revista'} · ${str(payload.edition, 80)} añadida`,
    actor,
  });
  return getMagazine(id);
}

async function updateMagazine(id, payload, actor) {
  const current = await getMagazine(id);
  if (!current) return null;
  const pdfData = readUploadedPdf(payload.pdfUrl);
  if (pdfData) {
    await query(
      `UPDATE ${table('ADMIN_MAGAZINES')} SET
        TITLE = ?, EDITION = ?, PUB_DATE = ?, DESCRIPTION = ?, PDF_URL = ?, PDF_NAME = ?,
        COVER_URL = ?, STATUS = ?, PDF_DATA = ?,
        UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
       WHERE ID = ? AND ACTIVE = 1`,
      [
        str(payload.title, 160),
        str(payload.edition, 80),
        str(payload.date, 10) || null,
        str(payload.description, 2000),
        str(payload.pdfUrl, 500),
        str(payload.pdfName, 255),
        str(payload.coverUrl, 500),
        payload.status === 'published' ? 'published' : 'draft',
        pdfData,
        actor,
        id,
      ],
    );
  } else {
    await query(
      `UPDATE ${table('ADMIN_MAGAZINES')} SET
        TITLE = ?, EDITION = ?, PUB_DATE = ?, DESCRIPTION = ?, PDF_URL = ?, PDF_NAME = ?,
        COVER_URL = ?, STATUS = ?, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
       WHERE ID = ? AND ACTIVE = 1`,
      [
        str(payload.title, 160),
        str(payload.edition, 80),
        str(payload.date, 10) || null,
        str(payload.description, 2000),
        str(payload.pdfUrl, 500),
        str(payload.pdfName, 255),
        str(payload.coverUrl, 500),
        payload.status === 'published' ? 'published' : 'draft',
        actor,
        id,
      ],
    );
  }
  await logActivity({
    kind: 'update',
    entity: 'Revista',
    detail: `${str(payload.title, 160) || current.title} · ${str(payload.edition, 80) || current.edition} actualizada`,
    actor,
  });
  return getMagazine(id);
}

async function setMagazineStatus(id, status, actor) {
  const current = await getMagazine(id);
  if (!current) return null;
  const next = status === 'published' ? 'published' : 'draft';
  await query(
    `UPDATE ${table('ADMIN_MAGAZINES')}
       SET STATUS = ?, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
     WHERE ID = ? AND ACTIVE = 1`,
    [next, actor, id],
  );
  await logActivity({
    kind: next === 'published' ? 'publish' : 'status',
    entity: 'Revista',
    detail: `${current.title} · ${next === 'published' ? 'publicada' : 'pasada a borrador'}`,
    actor,
  });
  return getMagazine(id);
}

async function deleteMagazine(id, actor) {
  const current = await getMagazine(id);
  if (!current) return false;
  await query(
    `UPDATE ${table('ADMIN_MAGAZINES')}
       SET ACTIVE = 0, DELETED_AT = CURRENT TIMESTAMP, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
     WHERE ID = ? AND ACTIVE = 1`,
    [actor, id],
  );
  await logActivity({
    kind: 'delete',
    entity: 'Revista',
    detail: `${current.title} · ${current.edition} eliminada`,
    actor,
  });
  return true;
}

/* ---------------------------------------------------------- applications */

function mapApplication(row) {
  return {
    id: String(row.ID).trim(),
    jobId: String(row.JOB_ID || '').trim(),
    jobTitle: String(row.JOB_TITLE || '').trim(),
    name: String(row.NAME).trim(),
    email: String(row.EMAIL || '').trim(),
    phone: String(row.PHONE || '').trim(),
    sector: String(row.SECTOR || '').trim(),
    message: String(row.MESSAGE || '').trim(),
    cvName: String(row.CV_NAME || '').trim(),
    cvUrl: String(row.CV_URL || '').trim(),
    status: String(row.STATUS).trim(),
    notes: String(row.NOTES || '').trim(),
    createdAt: iso(row.CREATED_AT),
    updatedAt: iso(row.UPDATED_AT),
  };
}

async function listApplications() {
  const rows = await query(
    `SELECT ID, JOB_ID, JOB_TITLE, NAME, EMAIL, PHONE, SECTOR, MESSAGE, CV_NAME, CV_URL,
            STATUS, NOTES, CREATED_AT, UPDATED_AT
       FROM ${table('ADMIN_APPLICATIONS')}
      WHERE ACTIVE = 1 ORDER BY CREATED_AT DESC`,
  );
  return rows.map(mapApplication);
}

async function updateApplication(id, payload, actor) {
  const allowed = ['new', 'review', 'interview', 'rejected', 'hired'];
  const status = allowed.includes(payload.status) ? payload.status : 'new';
  await query(
    `UPDATE ${table('ADMIN_APPLICATIONS')}
       SET STATUS = ?, NOTES = ?, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ? AND ACTIVE = 1`,
    [status, str(payload.notes, 4000), id],
  );
  await logActivity({
    kind: 'status',
    entity: 'Candidatura',
    detail: `${str(payload.name, 160) || 'Candidatura'} · ${status}`,
    actor,
  });
  return true;
}

async function deleteApplication(id, actor) {
  const rows = await query(
    `SELECT NAME FROM ${table('ADMIN_APPLICATIONS')} WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  if (!rows.length) return false;
  await query(
    `UPDATE ${table('ADMIN_APPLICATIONS')}
       SET ACTIVE = 0, DELETED_AT = CURRENT TIMESTAMP, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  await logActivity({
    kind: 'delete',
    entity: 'Candidatura',
    detail: `${String(rows[0].NAME).trim()} · eliminada`,
    actor,
  });
  return true;
}

async function createApplication(payload, meta = {}) {
  const id = newId('app');
  const name = str(payload.name, 160);
  if (!name) return null;
  const jobId = str(payload.jobId, 64);
  let jobTitle = str(payload.jobTitle, 160);
  if (jobId && !jobTitle) {
    const job = await getJob(jobId);
    jobTitle = job ? job.title : '';
  }
  const candidateUrl = str(payload.cvUrl, 500);
  const cvUrl = /^\/api\/admin\/cv\/[A-Za-z0-9._-]+\.pdf$/.test(candidateUrl)
    ? candidateUrl
    : '';
  await query(
    `INSERT INTO ${table('ADMIN_APPLICATIONS')}
      (ID, JOB_ID, JOB_TITLE, NAME, EMAIL, PHONE, SECTOR, MESSAGE, CV_NAME, CV_URL, STATUS, NOTES, ACTIVE)
     VALUES (?,?,?,?,?,?,?,?,?,?,'new','',1)`,
    [
      id,
      jobId,
      jobTitle,
      name,
      str(payload.email, 160),
      str(payload.phone, 40),
      str(payload.sector, 80),
      str(payload.message, 4000),
      str(payload.cvName, 255),
      cvUrl,
    ],
  );
  await logActivity({
    kind: 'create',
    entity: 'Candidatura',
    detail: `${name} · candidatura recibida${meta.ip ? ` desde ${meta.ip}` : ''}`,
    actor: name,
  });

  const settings = await getSettings().catch(() => null);
  const inbox = (settings && settings.rrhhEmail) || 'cv.rrhh@maripepa.es';
  emailService
    .sendApplicationNotification(
      {
        name,
        email: str(payload.email, 160),
        phone: str(payload.phone, 40),
        sector: str(payload.sector, 80),
        message: str(payload.message, 4000),
        jobTitle,
        cvName: str(payload.cvName, 255),
      },
      inbox,
    )
    .catch((error) => {
      logger.warn('Aviso de candidatura no enviado', { message: error.message });
    });

  return id;
}

/* ------------------------------------------------------------ team/users */

function mapUser(row) {
  return {
    id: String(row.ID).trim(),
    name: String(row.NAME || '').trim(),
    email: String(row.EMAIL).trim(),
    username: usernameOf(row),
    role: String(row.ROLE).trim(),
    status: String(row.STATUS).trim(),
    lastAccess: iso(row.LAST_ACCESS),
    createdAt: iso(row.CREATED_AT),
  };
}

async function listUsers() {
  const rows = await query(
    `SELECT ID, NAME, EMAIL, ROLE, STATUS, LAST_ACCESS, CREATED_AT
       FROM ${table('ADMIN_USERS')} WHERE ACTIVE = 1 ORDER BY CREATED_AT ASC`,
  );
  return rows.map(mapUser);
}

async function findUserByEmail(email) {
  const rows = await query(
    `SELECT ID, NAME, EMAIL, ROLE, STATUS, PASSWORD_HASH, LAST_ACCESS, CREATED_AT
       FROM ${table('ADMIN_USERS')}
      WHERE LOWER(EMAIL) = ? AND ACTIVE = 1`,
    [String(email || '').trim().toLowerCase()],
  );
  return rows.length ? rows[0] : null;
}

async function inviteUser(payload, actor) {
  const email = str(payload.email, 160).toLowerCase();
  if (!email) return { error: 'email' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'email' };
  const existing = await findUserByEmail(email);
  if (existing) return { error: 'exists' };
  const name =
    str(payload.name, 120) ||
    email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  const temporary = str(payload.password, 120);
  if (temporary && temporary.length < 10) return { error: 'weak' };
  const hash = await bcrypt.hash(
    temporary || crypto.randomUUID(),
    BCRYPT_ROUNDS,
  );
  const status = temporary ? 'active' : 'invited';
  await query(
    `INSERT INTO ${table('ADMIN_USERS')}
      (ID, EMAIL, NAME, ROLE, PASSWORD_HASH, STATUS, ACTIVE)
     VALUES (?,?,?,?,?,?,1)`,
    [newId('team'), email, name, payload.role === 'admin' ? 'admin' : 'editor', hash, status],
  );
  await logActivity({
    kind: temporary ? 'create' : 'invite',
    entity: 'Equipo',
    detail: temporary
      ? `Acceso creado para ${email}`
      : `Invitación pendiente para ${email}`,
    actor,
  });
  return { ok: true };
}

async function revokeUser(id, actor) {
  const rows = await query(
    `SELECT NAME, EMAIL FROM ${table('ADMIN_USERS')} WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  if (!rows.length) return false;
  await query(
    `UPDATE ${table('ADMIN_USERS')}
       SET ACTIVE = 0, DELETED_AT = CURRENT TIMESTAMP, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ? AND ACTIVE = 1`,
    [id],
  );
  await query(
    `UPDATE ${table('ADMIN_SESSIONS')} SET ACTIVE = 0 WHERE USER_ID = ? AND ACTIVE = 1`,
    [id],
  );
  await logActivity({
    kind: 'delete',
    entity: 'Equipo',
    detail: `Acceso revocado a ${String(rows[0].NAME).trim()}`,
    actor,
  });
  return true;
}

/* -------------------------------------------------------------- activity */

async function logActivity({ kind, entity, detail, actor }) {
  try {
    await query(
      `INSERT INTO ${table('ADMIN_ACTIVITY')}
        (ID, KIND, ENTITY, DETAIL, USER_EMAIL, USER_NAME, ACTIVE)
       VALUES (?,?,?,?,?,?,1)`,
      [
        newId('act'),
        str(kind, 24) || 'update',
        str(entity, 40),
        str(detail, 500),
        str(actor, 160),
        str(actor, 120),
      ],
    );
  } catch (error) {
    logger.warn('No se pudo registrar actividad del panel', { message: error.message });
  }
}

async function listActivity() {
  const rows = await query(
    `SELECT ID, KIND, ENTITY, DETAIL, USER_EMAIL, USER_NAME, CREATED_AT
       FROM ${table('ADMIN_ACTIVITY')}
      WHERE ACTIVE = 1 ORDER BY CREATED_AT DESC
      FETCH FIRST 80 ROWS ONLY`,
  );
  return rows.map((row) => ({
    id: String(row.ID).trim(),
    kind: String(row.KIND).trim(),
    entity: String(row.ENTITY).trim(),
    detail: String(row.DETAIL).trim(),
    user: String(row.USER_NAME || row.USER_EMAIL || '').trim(),
    at: iso(row.CREATED_AT),
  }));
}

/* -------------------------------------------------------------- settings */

async function getSettings() {
  const rows = await query(
    `SELECT SETTING_KEY, SETTING_VALUE FROM ${table('ADMIN_SETTINGS')}`,
  );
  const stored = {};
  rows.forEach((row) => {
    stored[String(row.SETTING_KEY).trim()] = String(row.SETTING_VALUE ?? '');
  });
  const merged = { ...DEFAULT_SETTINGS, ...stored };
  return {
    rrhhEmail: merged.rrhh_email,
    phone: merged.phone,
    offersPublic: merged.offers_public === '1',
    applicationsOpen: merged.applications_open === '1',
    internalNote: merged.internal_note,
  };
}

async function saveSettings(settings, actor) {
  const entries = {
    rrhh_email: str(settings.rrhhEmail, 160) || DEFAULT_SETTINGS.rrhh_email,
    phone: str(settings.phone, 40),
    offers_public: settings.offersPublic ? '1' : '0',
    applications_open: settings.applicationsOpen ? '1' : '0',
    internal_note: str(settings.internalNote, 4000),
  };
  for (const [key, value] of Object.entries(entries)) {
    const existing = await query(
      `SELECT SETTING_KEY FROM ${table('ADMIN_SETTINGS')} WHERE SETTING_KEY = ?`,
      [key],
    );
    if (existing.length) {
      await query(
        `UPDATE ${table('ADMIN_SETTINGS')}
            SET SETTING_VALUE = ?, UPDATED_AT = CURRENT TIMESTAMP, UPDATED_BY = ?
          WHERE SETTING_KEY = ?`,
        [value, actor, key],
      );
    } else {
      await query(
        `INSERT INTO ${table('ADMIN_SETTINGS')}
          (SETTING_KEY, SETTING_VALUE, UPDATED_BY) VALUES (?,?,?)`,
        [key, value, actor],
      );
    }
  }
  await logActivity({
    kind: 'settings',
    entity: 'Ajustes',
    detail: 'Configuración de RRHH actualizada',
    actor,
  });
  return getSettings();
}

/* ------------------------------------------------------------------ auth */

async function recordAttempt(email, ip, success) {
  try {
    await query(
      `INSERT INTO ${table('ADMIN_LOGIN_ATTEMPTS')} (ID, EMAIL, IP, SUCCESS)
       VALUES (?,?,?,?)`,
      [newId('login'), str(email, 160).toLowerCase(), str(ip, 64), success ? 1 : 0],
    );
  } catch (error) {
    logger.warn('No se pudo registrar intento de acceso', { message: error.message });
  }
}

async function failedAttempts(email, ip) {
  const rows = await query(
    `SELECT COUNT(*) AS N FROM ${table('ADMIN_LOGIN_ATTEMPTS')}
      WHERE LOWER(EMAIL) = ? AND IP = ? AND SUCCESS = 0
        AND CREATED_AT > CURRENT TIMESTAMP - ${ATTEMPT_WINDOW_MINUTES} MINUTES`,
    [String(email || '').trim().toLowerCase(), str(ip, 64)],
  );
  return Number(rows[0] ? rows[0].N : 0);
}

async function createSession(user, ip, userAgent) {
  const token = crypto.randomBytes(32).toString('hex');
  const stored = hashToken(token);
  await query(
    `DELETE FROM ${table('ADMIN_SESSIONS')}
      WHERE EXPIRES_AT <= CURRENT TIMESTAMP OR ACTIVE = 0`,
  );
  await query(
    `INSERT INTO ${table('ADMIN_SESSIONS')}
      (TOKEN, USER_ID, EMAIL, IP, USER_AGENT, ACTIVE, EXPIRES_AT)
     VALUES (?,?,?,?,?,1,CURRENT TIMESTAMP + ${SESSION_HOURS} HOURS)`,
    [stored, user.id, user.email, str(ip, 64), str(userAgent, 300)],
  );
  await query(
    `UPDATE ${table('ADMIN_USERS')} SET LAST_ACCESS = CURRENT TIMESTAMP WHERE ID = ?`,
    [user.id],
  );
  return token;
}

async function getSession(token) {
  if (!token) return null;
  const rows = await query(
    `SELECT S.USER_ID, S.EMAIL, S.EXPIRES_AT, U.NAME, U.ROLE
       FROM ${table('ADMIN_SESSIONS')} S
       JOIN ${table('ADMIN_USERS')} U ON U.ID = S.USER_ID
      WHERE S.TOKEN = ? AND S.ACTIVE = 1 AND U.ACTIVE = 1
        AND S.EXPIRES_AT > CURRENT TIMESTAMP`,
    [hashToken(token)],
  );
  if (!rows.length) return null;
  return {
    id: String(rows[0].USER_ID).trim(),
    email: String(rows[0].EMAIL).trim(),
    name: String(rows[0].NAME).trim(),
    role: String(rows[0].ROLE).trim(),
    expiresAt: iso(rows[0].EXPIRES_AT),
  };
}

async function destroySession(token) {
  if (!token) return;
  await query(
    `UPDATE ${table('ADMIN_SESSIONS')}
       SET ACTIVE = 0, UPDATED_AT = CURRENT TIMESTAMP
     WHERE TOKEN = ? AND ACTIVE = 1`,
    [hashToken(token)],
  );
}

async function listSessions(currentToken) {
  await query(
    `DELETE FROM ${table('ADMIN_SESSIONS')}
      WHERE EXPIRES_AT <= CURRENT TIMESTAMP OR ACTIVE = 0`,
  );
  const rows = await query(
    `SELECT S.TOKEN, S.EMAIL, S.IP, S.USER_AGENT, S.CREATED_AT, S.EXPIRES_AT,
            U.NAME, U.ROLE
       FROM ${table('ADMIN_SESSIONS')} S
       JOIN ${table('ADMIN_USERS')} U ON U.ID = S.USER_ID
      WHERE S.ACTIVE = 1 AND U.ACTIVE = 1 AND S.EXPIRES_AT > CURRENT TIMESTAMP
      ORDER BY S.CREATED_AT DESC`,
  );
  const currentHash = currentToken ? hashToken(currentToken) : '';
  return rows.map((row) => ({
    token: String(row.TOKEN).trim(),
    email: String(row.EMAIL).trim(),
    name: String(row.NAME || '').trim(),
    role: String(row.ROLE || '').trim(),
    ip: String(row.IP || '').trim(),
    userAgent: String(row.USER_AGENT || '').trim(),
    createdAt: iso(row.CREATED_AT),
    expiresAt: iso(row.EXPIRES_AT),
    current: String(row.TOKEN).trim() === currentHash,
  }));
}

async function revokeSession(tokenHash, actor) {
  const rows = await query(
    `SELECT EMAIL FROM ${table('ADMIN_SESSIONS')} WHERE TOKEN = ? AND ACTIVE = 1`,
    [tokenHash],
  );
  if (!rows.length) return false;
  await query(
    `UPDATE ${table('ADMIN_SESSIONS')}
        SET ACTIVE = 0, UPDATED_AT = CURRENT TIMESTAMP
      WHERE TOKEN = ? AND ACTIVE = 1`,
    [tokenHash],
  );
  await logActivity({
    kind: 'security',
    entity: 'Sesión',
    detail: `Sesión revocada para ${String(rows[0].EMAIL).trim()}`,
    actor,
  });
  return true;
}

async function revokeOtherSessions(userId, currentToken, actor) {
  const currentHash = currentToken ? hashToken(currentToken) : '';
  await query(
    `UPDATE ${table('ADMIN_SESSIONS')}
        SET ACTIVE = 0, UPDATED_AT = CURRENT TIMESTAMP
      WHERE ACTIVE = 1 AND TOKEN <> ?`,
    [currentHash],
  );
  await logActivity({
    kind: 'security',
    entity: 'Sesión',
    detail: `Resto de sesiones revocadas (${String(userId || '').slice(0, 64)})`,
    actor,
  });
}

function fold(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function usernameOf(row) {
  return fold(String(row.NAME || '').split(/\s+/)[0]);
}

/**
 * Acepta usuario o email. El usuario es el nombre de pila del equipo
 * (javier, diego, marirola, martin) sin distinguir mayúsculas ni tildes.
 * Si hay dos personas con el mismo nombre, hay que entrar con el email.
 */
async function resolveLoginUser(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;
  if (raw.includes('@')) return findUserByEmail(raw.toLowerCase());
  const wanted = fold(raw);
  const rows = await query(
    `SELECT ID, EMAIL, NAME, ROLE, STATUS, PASSWORD_HASH, LAST_ACCESS, CREATED_AT
       FROM ${table('ADMIN_USERS')} WHERE ACTIVE = 1`,
  );
  const matches = rows.filter(
    (row) =>
      wanted === usernameOf(row) ||
      wanted === fold(String(row.EMAIL).split('@')[0]) ||
      wanted === fold(String(row.NAME)),
  );
  return matches.length === 1 ? matches[0] : null;
}

async function authenticate(identifier, password, ip, userAgent) {
  const address = fold(identifier);
  const attempts = await failedAttempts(address, ip);
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return { error: 'locked' };
  }
  const user = await resolveLoginUser(identifier);
  if (!user || user.STATUS === 'invited') {
    await recordAttempt(address, ip, false);
    return { error: 'credentials' };
  }
  const valid = await bcrypt.compare(String(password || ''), String(user.PASSWORD_HASH));
  if (!valid) {
    await recordAttempt(address, ip, false);
    return { error: 'credentials' };
  }
  await recordAttempt(address, ip, true);
  await query(
    `UPDATE ${table('ADMIN_USERS')}
       SET STATUS = 'active', LAST_ACCESS = CURRENT TIMESTAMP
     WHERE ID = ? AND ACTIVE = 1`,
    [String(user.ID).trim()],
  );
  const token = await createSession(
    { id: String(user.ID).trim(), email: String(user.EMAIL).trim() },
    ip,
    userAgent,
  );
  await logActivity({
    kind: 'login',
    entity: 'Acceso',
    detail: `${address} · sesión iniciada`,
    actor: String(user.NAME || address).trim(),
  });
  return {
    token,
    user: {
      id: String(user.ID).trim(),
      email: String(user.EMAIL).trim(),
      name: String(user.NAME).trim(),
      role: String(user.ROLE).trim(),
    },
  };
}

async function changePassword(userId, currentPassword, nextPassword) {
  const rows = await query(
    `SELECT PASSWORD_HASH FROM ${table('ADMIN_USERS')} WHERE ID = ? AND ACTIVE = 1`,
    [userId],
  );
  if (!rows.length) return { error: 'notfound' };
  const valid = await bcrypt.compare(
    String(currentPassword || ''),
    String(rows[0].PASSWORD_HASH),
  );
  if (!valid) return { error: 'current' };
  if (String(nextPassword || '').length < 10) return { error: 'weak' };
  const hash = await bcrypt.hash(String(nextPassword), BCRYPT_ROUNDS);
  await query(
    `UPDATE ${table('ADMIN_USERS')}
       SET PASSWORD_HASH = ?, STATUS = 'active', UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ?`,
    [hash, userId],
  );
  return { ok: true };
}

/* ---------------------------------------------------------------- public */

async function listPublicJobs() {
  const settings = await getSettings();
  if (!settings.offersPublic) return [];
  const rows = await query(
    `SELECT ${JOB_COLUMNS} FROM ${table('ADMIN_JOB_OFFERS')}
      WHERE ACTIVE = 1 AND STATUS = 'published' ORDER BY UPDATED_AT DESC`,
  );
  return rows.map(mapJob);
}

async function getPublicJob(slug) {
  const rows = await query(
    `SELECT ${JOB_COLUMNS} FROM ${table('ADMIN_JOB_OFFERS')}
      WHERE ACTIVE = 1 AND STATUS = 'published' AND SLUG = ?`,
    [slug],
  );
  return rows.length ? mapJob(rows[0]) : null;
}

async function listPublicMagazines() {
  const rows = await query(
    `SELECT ${MAGAZINE_COLUMNS} FROM ${table('ADMIN_MAGAZINES')}
      WHERE ACTIVE = 1 AND STATUS = 'published' ORDER BY PUB_DATE DESC`,
  );
  return rows.map(mapMagazine);
}

/* --------------------------------------------------------------- bootstrap */

async function bootstrap(actor) {
  const [jobs, magazines, applications, team, settings, activity] = await Promise.all([
    listJobs(),
    listMagazines(),
    listApplications(),
    listUsers(),
    getSettings(),
    listActivity(),
  ]);
  return {
    jobs,
    magazines,
    applications,
    team,
    settings,
    activity,
    meta: {
      actor,
      schema: SCHEMA,
      sessionHours: SESSION_HOURS,
      generatedAt: new Date().toISOString(),
    },
  };
}

async function ensureSeed(seedPassword) {
  const existing = await findUserByEmail('javier@mari-pepa.com');
  if (existing) return { created: false };
  const hash = await bcrypt.hash(seedPassword, BCRYPT_ROUNDS);
  await query(
    `INSERT INTO ${table('ADMIN_USERS')}
      (ID, EMAIL, NAME, ROLE, PASSWORD_HASH, STATUS, ACTIVE)
     VALUES (?,?,?,?,?,'active',1)`,
    [newId('team'), 'javier@mari-pepa.com', 'Javier', 'admin', hash],
  );
  return { created: true };
}

module.exports = {
  SCHEMA,
  iso,
  listJobs,
  getJob,
  createJob,
  updateJob,
  setJobStatus,
  deleteJob,
  duplicateJob,
  listMagazines,
  getMagazine,
  createMagazine,
  updateMagazine,
  setMagazineStatus,
  deleteMagazine,
  listApplications,
  updateApplication,
  deleteApplication,
  createApplication,
  listUsers,
  findUserByEmail,
  inviteUser,
  revokeUser,
  listActivity,
  logActivity,
  getSettings,
  saveSettings,
  authenticate,
  createSession,
  getSession,
  destroySession,
  listSessions,
  revokeSession,
  revokeOtherSessions,
  changePassword,
  failedAttempts,
  MAX_FAILED_ATTEMPTS,
  listPublicJobs,
  getPublicJob,
  listPublicMagazines,
  bootstrap,
  ensureSeed,
  slugify,
};
