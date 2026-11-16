/**
 * Anade la columna DETAILS a JAVIER.ADMIN_JOB_OFFERS.
 *
 * Solo toca el esquema JAVIER. Idempotente: si ya existe, no hace nada.
 * DETAILS guarda los campos personalizados de cada oferta en JSON.
 *
 * VARCHAR(3000) y no 8000: la fila ya ronda los 27 KB y el maximo de IBM i
 * son 32.766 bytes. Con 8000 el ALTER falla con SQL0101.
 *
 * Uso: node scripts/setup/add-job-details-column.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const odbc = require('odbc');

const ENV_STRING = process.env.ODBC_CONNECTION_STRING || '';
const USABLE = ENV_STRING.length > 0 && !ENV_STRING.includes('CAMBIAR_');

const connectionString = USABLE
  ? ENV_STRING
  : `DSN=${process.env.ODBC_DSN || 'GMP'};UID=${process.env.ODBC_UID || ''};PWD=${process.env.ODBC_PWD || ''}`;

async function main() {
  const connection = await odbc.connect(connectionString);
  try {
    const existing = await connection.query(
      "SELECT COLUMN_NAME FROM QSYS2.SYSCOLUMNS WHERE TABLE_SCHEMA='JAVIER' AND TABLE_NAME='ADMIN_JOB_OFFERS' AND COLUMN_NAME='DETAILS'",
    );
    if (existing.length > 0) {
      console.log('DETAILS ya existe. Nada que hacer.');
      return;
    }
    await connection.query(
      'ALTER TABLE JAVIER.ADMIN_JOB_OFFERS ADD COLUMN DETAILS VARCHAR(3000)',
    );
    console.log('DETAILS anadida a JAVIER.ADMIN_JOB_OFFERS.');
  } finally {
    await connection.close();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error('ERROR', error.message || error);
    process.exit(1);
  },
);
