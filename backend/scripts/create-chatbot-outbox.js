/**
 * Crea la tabla de outbox del chatbot en JAVIER.
 * Solo DDL en JAVIER; no toca DSEDAC.
 *
 * Uso: node scripts/create-chatbot-outbox.js
 */

require('dotenv').config();
const odbcPool = require('../app/config/odbcConfig');
const logger = require('../app/utils/logger');

function alreadyExists(error) {
  const code = error && error.odbcErrors && error.odbcErrors[0] && error.odbcErrors[0].code;
  return code === -601 || /already exists|ya existe/i.test(String(error.message));
}

(async () => {
  try {
    try {
      await odbcPool.query(`
        CREATE TABLE JAVIER.CHATBOT_OUTBOX (
          ID BIGINT GENERATED ALWAYS AS IDENTITY,
          IDEMPOTENCY_KEY VARCHAR(128) NOT NULL,
          CUSTOMER_CODE VARCHAR(20) NOT NULL,
          CHANNEL VARCHAR(20) NOT NULL,
          RECIPIENT VARCHAR(255) NOT NULL,
          DOCUMENT_ID VARCHAR(60) NOT NULL,
          STATUS VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
          PROVIDER_MESSAGE_ID VARCHAR(255),
          ATTEMPTS INTEGER NOT NULL DEFAULT 0,
          LAST_ERROR VARCHAR(1000),
          CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT TIMESTAMP,
          UPDATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT TIMESTAMP
        )
      `);
      logger.info('CHATBOT_OUTBOX_TABLE_CREATED');
    } catch (error) {
      if (!alreadyExists(error)) throw error;
      logger.info('CHATBOT_OUTBOX_TABLE_ALREADY_EXISTS');
    }

    try {
      await odbcPool.query(
        'CREATE UNIQUE INDEX JAVIER.CHATBOT_OUTBOX_IDEMP ON JAVIER.CHATBOT_OUTBOX (IDEMPOTENCY_KEY)',
      );
      logger.info('CHATBOT_OUTBOX_INDEX_CREATED');
    } catch (error) {
      if (!alreadyExists(error)) throw error;
      logger.info('CHATBOT_OUTBOX_INDEX_ALREADY_EXISTS');
    }

    const rows = await odbcPool.query(
      `SELECT COUNT(*) AS N FROM QSYS2.SYSTABLES
       WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CHATBOT_OUTBOX'`,
    );
    console.log('OUTBOX_TABLE_OK', rows[0]?.N ?? '?');
  } catch (error) {
    console.error('OUTBOX_TABLE_FAIL', error.message);
    process.exitCode = 1;
  } finally {
    try { await odbcPool.close(); } catch (_) {}
    setTimeout(() => process.exit(process.exitCode || 0), 300);
  }
})();
