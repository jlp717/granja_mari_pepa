/**
 * Outbox de entregas del chatbot.
 * Solo escribe en JAVIER.CHATBOT_OUTBOX (esquema permitido).
 * No guarda PDFs ni cuerpos de correo; solo metadatos y estado.
 */

const crypto = require('crypto');
const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const TABLE = 'JAVIER.CHATBOT_OUTBOX';

function buildIdempotencyKey({ customerCode, documentId, channel, recipient, date }) {
  return crypto
    .createHash('sha256')
    .update(
      [customerCode, documentId, channel, recipient, date || new Date().toISOString().slice(0, 10)]
        .map((value) => String(value || '').trim().toLowerCase())
        .join('|'),
    )
    .digest('hex');
}

function isDuplicate(error) {
  const odbc = error && error.odbcErrors && error.odbcErrors[0];
  return (
    (odbc && odbc.code === -803) ||
    /SQL0803|duplicate|duplicad/i.test(String(error && error.message))
  );
}

async function findByIdempotencyKey(idempotencyKey) {
  const rows = await odbcPool.query(
    `SELECT ID, IDEMPOTENCY_KEY, CUSTOMER_CODE, CHANNEL, RECIPIENT, DOCUMENT_ID,
            STATUS, PROVIDER_MESSAGE_ID, ATTEMPTS, LAST_ERROR
     FROM ${TABLE}
     WHERE IDEMPOTENCY_KEY = ?
     FETCH FIRST 1 ROW ONLY`,
    [idempotencyKey],
  );
  return rows[0] || null;
}

async function enqueue({ idempotencyKey, customerCode, channel, recipient, documentId }) {
  try {
    await odbcPool.query(
      `INSERT INTO ${TABLE}
         (IDEMPOTENCY_KEY, CUSTOMER_CODE, CHANNEL, RECIPIENT, DOCUMENT_ID, STATUS)
       VALUES (?, ?, ?, ?, ?, 'QUEUED')`,
      [idempotencyKey, customerCode, channel, recipient, documentId],
    );
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }
  return findByIdempotencyKey(idempotencyKey);
}

async function markSending(id) {
  await odbcPool.query(
    `UPDATE ${TABLE}
     SET STATUS = 'SENDING', ATTEMPTS = ATTEMPTS + 1, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ? AND STATUS IN ('QUEUED', 'FAILED')`,
    [id],
  );
}

async function markSent(id, providerMessageId) {
  await odbcPool.query(
    `UPDATE ${TABLE}
     SET STATUS = 'SENT', PROVIDER_MESSAGE_ID = ?, LAST_ERROR = NULL, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ?`,
    [providerMessageId, id],
  );
}

async function markFailed(id, errorCode, errorMessage) {
  await odbcPool.query(
    `UPDATE ${TABLE}
     SET STATUS = 'FAILED', LAST_ERROR = ?, UPDATED_AT = CURRENT TIMESTAMP
     WHERE ID = ?`,
    [`${errorCode || 'ERROR'}: ${String(errorMessage || '').slice(0, 800)}`, id],
  );
}

async function markDelivered(providerMessageId) {
  await odbcPool.query(
    `UPDATE ${TABLE}
     SET STATUS = 'DELIVERED', UPDATED_AT = CURRENT TIMESTAMP
     WHERE PROVIDER_MESSAGE_ID = ?`,
    [providerMessageId],
  );
}

async function listPending(limit = 20) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  return odbcPool.query(
    `SELECT ID, IDEMPOTENCY_KEY, CUSTOMER_CODE, CHANNEL, RECIPIENT, DOCUMENT_ID,
            STATUS, PROVIDER_MESSAGE_ID, ATTEMPTS, LAST_ERROR
     FROM ${TABLE}
     WHERE STATUS IN ('QUEUED', 'FAILED') AND ATTEMPTS < 5
     ORDER BY CREATED_AT
     FETCH FIRST ${safeLimit} ROWS ONLY`,
  );
}

module.exports = {
  buildIdempotencyKey,
  enqueue,
  findByIdempotencyKey,
  markSending,
  markSent,
  markFailed,
  markDelivered,
  listPending,
  isDuplicate,
  TABLE,
};
