#!/usr/bin/env node
/**
 * PURGA DE CURRÍCULUMS ANTIGUOS — Maripepa
 * ========================================
 * Borra los ficheros PDF de candidaturas con más de 12 meses de antigüedad y
 * limpia la referencia del CV en JAVIER.ADMIN_APPLICATIONS. La fila de la
 * candidatura NO se elimina: se conserva el registro histórico y solo se
 * vacían CV_URL y CV_NAME, marcando CV_PURGED_AT.
 *
 * Qué hace, en orden, por cada candidatura candidata:
 *   1. Resuelve el fichero dentro de backend/private/cv (donde los guarda
 *      adminController.publicCv) y comprueba que la ruta queda confinada ahí.
 *      Si la URL no es un PDF de esa carpeta, no se toca nada: unsafe_path.
 *   2. Borra el fichero del disco si existe. Si ya no está, sigue igual.
 *   3. Vacía CV_URL y CV_NAME y sella CV_PURGED_AT y UPDATED_AT.
 *   4. Si hubo purgas, deja UNA fila resumen en JAVIER.ADMIN_ACTIVITY.
 *
 * Modo de ejecución:
 *   - Por defecto es SIMULACIÓN (dry-run): no borra ficheros ni escribe en la
 *     base. Solo lista lo que haría.
 *   - Con --apply ejecuta la purga real.
 *
 *   node scripts/purge-cv.js            # simulación
 *   node scripts/purge-cv.js --apply    # purga real
 *
 * Se lanza desde backend/ (la ruta del .env y de private/cv se resuelven con
 * __dirname, así que también funciona desde otra carpeta).
 *
 * Programación:
 *   Cron mensual, primer día a las 03:30 (zona del servidor):
 *   30 3 1 * * cd /var/www/mari-pepa/backend && /usr/bin/node scripts/purge-cv.js --apply >> /var/log/mari-pepa/purge-cv.log 2>&1
 *   El script abre una conexión ODBC, hace su trabajo y sale: no deja pool,
 *   ni timers, ni jobs QZDASOINIT vivos. No carga el módulo de configuración
 *   ODBC del backend a propósito (ese módulo arranca pool compartido y un
 *   heartbeat cada 90 s).
 *
 * Requiere:
 *   - ODBC_CONNECTION_STRING en el entorno o en backend/.env.
 *   - Columna JAVIER.ADMIN_APPLICATIONS.CV_PURGED_AT (la añade la migración).
 *
 * Códigos de salida: 0 si todo fue bien, 1 si hubo error.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// .env del backend. Si no existe, dotenv no falla y se usan las variables de entorno.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const odbc = require('odbc');

// Carpeta real de los CV: backend/private/cv (ver adminController.publicCv).
const CV_ROOT = path.resolve(__dirname, '..', 'private', 'cv');
const APPLY = process.argv.includes('--apply');

// Mismo patrón de nombre que acepta adminController.downloadCv.
const CV_FILENAME_RE = /^[A-Za-z0-9._-]+\.pdf$/i;

const CANDIDATE_SQL = `SELECT ID, CV_URL, CV_NAME, CREATED_AT
      FROM JAVIER.ADMIN_APPLICATIONS
     WHERE CV_URL IS NOT NULL
       AND CV_URL <> ''
       AND CV_PURGED_AT IS NULL
       AND CREATED_AT < CURRENT TIMESTAMP - 12 MONTHS`;

// CV_URL/CV_NAME son NOT NULL DEFAULT '': tras la purga quedan en cadena vacía,
// así que el filtro CV_PURGED_AT IS NULL es lo que impide reprocesarlas cada mes.
const PURGED_COUNT_SQL = `SELECT COUNT(*) AS N
      FROM JAVIER.ADMIN_APPLICATIONS
     WHERE CV_PURGED_AT IS NOT NULL`;

const COLUMNS_SQL = `SELECT COLUMN_NAME, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
     WHERE TABLE_SCHEMA = 'JAVIER'
       AND TABLE_NAME = 'ADMIN_APPLICATIONS'
       AND COLUMN_NAME IN ('CV_URL', 'CV_NAME', 'CV_PURGED_AT')`;

/**
 * Traduce CV_URL (/api/admin/cv/<fichero>.pdf) a una ruta de disco confinada.
 * Devuelve { ok:false, reason } cuando la URL no es un PDF de private/cv.
 */
function resolveCvPath(cvUrl) {
  const raw = String(cvUrl || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };

  // Quita querystring/fragmento y normaliza separadores antes de leer el nombre.
  const clean = raw.split(/[?#]/)[0].replace(/\\/g, '/');
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  if (!CV_FILENAME_RE.test(name)) return { ok: false, reason: 'unsafe_path' };

  const fullPath = path.resolve(CV_ROOT, name);
  // Confinamiento doble: la ruta resuelta debe ser un hijo directo de private/cv.
  if (fullPath !== path.join(CV_ROOT, name) || path.dirname(fullPath) !== CV_ROOT) {
    return { ok: false, reason: 'unsafe_path' };
  }
  return { ok: true, fullPath, name };
}

function fileExists(fullPath) {
  try {
    return fs.statSync(fullPath).isFile();
  } catch (_) {
    return false;
  }
}

async function main() {
  const connectionString = process.env.ODBC_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('ODBC_CONNECTION_STRING no está configurada (entorno o backend/.env).');
  }

  const stats = {
    candidates: 0,
    yaPurgadas: 0,
    purged: 0,
    wouldPurge: 0,
    filesRemoved: 0,
    filesMissing: 0,
    unsafe: 0,
    empty: 0,
    errors: 0,
  };

  console.log('=== Purga de CV — Maripepa ===');
  console.log(`Modo: ${APPLY ? 'APLICAR (borra de verdad)' : 'SIMULACIÓN (dry-run, no toca nada)'}`);
  console.log(`Carpeta de CV: ${CV_ROOT}`);
  console.log('');

  let connection;
  let hasPurgedAtColumn = false;
  const nullable = { CV_URL: false, CV_NAME: false };

  try {
    connection = await odbc.connect(connectionString);

    // Preflight: sin CV_PURGED_AT el UPDATE fallaría y dejaríamos ficheros
    // borrados sin registrar. Se aborta antes de tocar disco.
    const columns = await connection.query(COLUMNS_SQL);
    columns.forEach((col) => {
      const name = String(col.COLUMN_NAME || '').trim().toUpperCase();
      const isNullable = String(col.IS_NULLABLE || '').trim().toUpperCase() === 'Y';
      if (name === 'CV_PURGED_AT') hasPurgedAtColumn = true;
      if (name in nullable) nullable[name] = isNullable;
    });

    if (!hasPurgedAtColumn) {
      throw new Error(
        'Falta la columna JAVIER.ADMIN_APPLICATIONS.CV_PURGED_AT. Ejecuta la migración antes de purgar.',
      );
    }

    // El DDL original declara CV_URL/CV_NAME como NOT NULL: si la columna sigue
    // así se vacía con cadena vacía, nunca con NULL, para no romper la restricción.
    // CV_PURGED_AT y UPDATED_AT se sellan en la MISMA sentencia, sea cual sea la
    // rama de vaciado: por eso la fila no vuelve a entrar como candidata.
    const blank = (name) => (nullable[name] ? 'NULL' : "''");
    const purgeSql = `UPDATE JAVIER.ADMIN_APPLICATIONS
            SET CV_URL = ${blank('CV_URL')}, CV_NAME = ${blank('CV_NAME')},
                CV_PURGED_AT = CURRENT TIMESTAMP,
                UPDATED_AT = CURRENT TIMESTAMP
          WHERE ID = ?`;

    const rows = await connection.query(CANDIDATE_SQL);
    stats.candidates = rows.length;

    // Filas que ya se purgaron en una ejecución anterior: el filtro
    // CV_PURGED_AT IS NULL las excluye, aquí solo se cuentan.
    const purgedRows = await connection.query(PURGED_COUNT_SQL);
    const purgedFirst = purgedRows[0] || {};
    stats.yaPurgadas = Number(purgedFirst.N ?? purgedFirst.n ?? 0) || 0;

    console.log(`Candidaturas candidatas (CV y más de 12 meses): ${stats.candidates}`);
    console.log(`Ya purgadas en ejecuciones previas (se omiten): ${stats.yaPurgadas}`);
    console.log(`CV_URL se limpia con: ${nullable.CV_URL ? 'NULL' : "cadena vacía (columna NOT NULL)"}`);
    console.log('');

    for (const row of rows) {
      const id = String(row.ID || '').trim();
      const cvUrl = String(row.CV_URL || '').trim();
      const resolved = resolveCvPath(cvUrl);

      if (!resolved.ok && resolved.reason === 'empty') {
        stats.empty += 1;
        console.log(`- ${id}: sin CV_URL, se omite`);
        continue;
      }

      if (!resolved.ok) {
        stats.unsafe += 1;
        console.log(`- ${id}: ruta no confinada a private/cv, NO se borra (${cvUrl})`);
        continue;
      }

      const exists = fileExists(resolved.fullPath);

      if (!APPLY) {
        stats.wouldPurge += 1;
        console.log(
          exists
            ? `- ${id}: borraría ${resolved.name} y limpiaría la fila`
            : `- ${id}: sin fichero ${resolved.name}, solo limpiaría la fila`,
        );
        continue;
      }

      try {
        if (exists) {
          fs.unlinkSync(resolved.fullPath);
          stats.filesRemoved += 1;
        } else {
          stats.filesMissing += 1;
        }

        await connection.query(purgeSql, [id]);
        stats.purged += 1;
        console.log(`- ${id}: ${exists ? 'borrado' : 'limpiado'} ${resolved.name}`);
      } catch (error) {
        stats.errors += 1;
        console.error(`- ${id}: ERROR ${error.message}`);
      }
    }

    if (APPLY && stats.purged > 0) {
      // Mismo patrón que logActivity de adminService.
      await connection.query(
        `INSERT INTO JAVIER.ADMIN_ACTIVITY
          (ID, KIND, ENTITY, DETAIL, USER_EMAIL, USER_NAME, ACTIVE)
         VALUES (?,?,?,?,?,?,1)`,
        [
          `act-${crypto.randomUUID()}`,
          'purge',
          'Candidaturas',
          `Purga de CV: ${stats.purged} archivos eliminados (más de 12 meses)`,
          'sistema',
          'sistema',
        ],
      );
    }
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (_) {
        /* la conexión ya estaba cerrada */
      }
    }
  }

  console.log('');
  console.log('=== Resumen ===');
  console.log(`Modo                  : ${APPLY ? 'aplicado' : 'simulación'}`);
  console.log(`Candidatas            : ${stats.candidates}`);
  console.log(`Ya purgadas           : ${stats.yaPurgadas}`);
  console.log(
    APPLY
      ? `Filas limpiadas       : ${stats.purged}`
      : `Se purgarían          : ${stats.wouldPurge}`,
  );
  console.log(`Ficheros borrados     : ${stats.filesRemoved}`);
  console.log(`Sin fichero en disco  : ${stats.filesMissing}`);
  console.log(`Ruta insegura         : ${stats.unsafe}`);
  console.log(`Sin CV_URL            : ${stats.empty}`);
  console.log(`Errores               : ${stats.errors}`);

  return stats.errors;
}

main()
  .then((errors) => {
    process.exit(errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('ERROR:', error.message || error);
    process.exit(1);
  });
