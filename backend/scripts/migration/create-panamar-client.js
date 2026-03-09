/**
 * MIGRACIÓN: Crear cliente PANAMAR (9999999999)
 * ================================================
 * Crea las entradas necesarias para el modo especial PANAMAR:
 * 1. DSEDAC.CLI  → entrada de cliente con código 9999999999
 * 2. JAVIER.CUSTOMER_CREDENTIALS → credenciales de acceso
 *
 * Es idempotente: verifica si ya existe antes de insertar.
 *
 * Uso: node scripts/migration/create-panamar-client.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const odbcPool = require('../../app/config/odbcConfig');

const PANAMAR_CLIENT_CODE = '9999999999';
const PANAMAR_CLIENT_NAME = 'PANAMAR (Modo Especial)';
const PANAMAR_DEFAULT_PASSWORD = 'Panamar2025!';
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('📦 MIGRACIÓN: Crear cliente PANAMAR');
  console.log('====================================\n');

  try {
    await odbcPool.initialize();
    console.log('✅ Conexión a BD establecida\n');

    // ── 1. Verificar/crear en DSEDAC.CLI ────────────────────────────
    console.log('1️⃣  Verificando DSEDAC.CLI...');

    const existingCli = await odbcPool.query(
      `SELECT TRIM(CODIGOCLIENTE) AS CODIGO, TRIM(NOMBRECLIENTE) AS NOMBRE
       FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?`,
      [PANAMAR_CLIENT_CODE]
    );

    if (existingCli.length > 0) {
      console.log(`   ℹ️  Cliente ya existe en CLI: ${existingCli[0].CODIGO} - ${existingCli[0].NOMBRE}`);
    } else {
      console.log('   ➡️  Insertando en DSEDAC.CLI...');

      await odbcPool.query(
        `INSERT INTO DSEDAC.CLI (CODIGOCLIENTE, NOMBRECLIENTE, NIF, DIRECCION, POBLACION, PROVINCIA, CODIGOPOSTAL)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [PANAMAR_CLIENT_CODE, PANAMAR_CLIENT_NAME, '00000000P', 'MODO ESPECIAL PANAMAR', 'SISTEMA', 'SISTEMA', '00000']
      );

      console.log('   ✅ Cliente creado en DSEDAC.CLI');
    }

    // ── 2. Verificar/crear en JAVIER.CUSTOMER_CREDENTIALS ──────────
    console.log('\n2️⃣  Verificando JAVIER.CUSTOMER_CREDENTIALS...');

    const existingCreds = await odbcPool.query(
      `SELECT CUSTOMER_CODE, ACCOUNT_STATUS FROM JAVIER.CUSTOMER_CREDENTIALS WHERE TRIM(CUSTOMER_CODE) = ?`,
      [PANAMAR_CLIENT_CODE]
    );

    if (existingCreds.length > 0) {
      console.log(`   ℹ️  Credenciales ya existen. Estado: ${existingCreds[0].ACCOUNT_STATUS}`);
      console.log('   ➡️  Actualizando hash de contraseña...');

      const hash = await bcrypt.hash(PANAMAR_DEFAULT_PASSWORD, BCRYPT_ROUNDS);
      await odbcPool.query(
        `UPDATE JAVIER.CUSTOMER_CREDENTIALS
         SET PASSWORD_HASH = ?, IS_LEGACY_PASSWORD = 0, ACCOUNT_STATUS = 'ACTIVE',
             FAILED_LOGIN_ATTEMPTS = 0, ACCOUNT_LOCKED_UNTIL = NULL, UPDATED_AT = CURRENT_TIMESTAMP
         WHERE TRIM(CUSTOMER_CODE) = ?`,
        [hash, PANAMAR_CLIENT_CODE]
      );

      console.log('   ✅ Credenciales actualizadas');
    } else {
      console.log('   ➡️  Insertando credenciales...');

      const hash = await bcrypt.hash(PANAMAR_DEFAULT_PASSWORD, BCRYPT_ROUNDS);

      // Obtener el MAX(CUSTOMER_ID) para asignar el siguiente
      const maxId = await odbcPool.query(
        `SELECT MAX(CUSTOMER_ID) AS MAX_ID FROM JAVIER.CUSTOMER_CREDENTIALS`
      );
      const nextId = Number(maxId[0]?.MAX_ID || 0) + 1;

      await odbcPool.query(
        `INSERT INTO JAVIER.CUSTOMER_CREDENTIALS (
            CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME, EMAIL, EMAIL_VERIFIED,
            PASSWORD_HASH, PASSWORD_ALGORITHM, IS_LEGACY_PASSWORD,
            LAST_PASSWORD_CHANGE, ACCOUNT_STATUS, FAILED_LOGIN_ATTEMPTS,
            CREATED_AT, UPDATED_AT
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          nextId,
          PANAMAR_CLIENT_CODE,
          PANAMAR_CLIENT_NAME,
          'panamar@granjamripepa.local',
          '0',
          hash,
          'BCRYPT',
          0,
          'ACTIVE'
        ]
      );

      console.log('   ✅ Credenciales creadas');
    }

    // ── 3. Verificación final ──────────────────────────────────────
    console.log('\n3️⃣  Verificación final...');

    const verify = await odbcPool.query(
      `SELECT TRIM(CLI.CODIGOCLIENTE) AS CODIGO, TRIM(CLI.NOMBRECLIENTE) AS NOMBRE,
              CC.CUSTOMER_CODE, CC.ACCOUNT_STATUS
       FROM DSEDAC.CLI CLI
       LEFT JOIN JAVIER.CUSTOMER_CREDENTIALS CC ON TRIM(CLI.CODIGOCLIENTE) = TRIM(CC.CUSTOMER_CODE)
       WHERE TRIM(CLI.CODIGOCLIENTE) = ?`,
      [PANAMAR_CLIENT_CODE]
    );

    if (verify.length > 0) {
      const v = verify[0];
      console.log(`   ✅ CLI: ${v.CODIGO} - ${v.NOMBRE}`);
      console.log(`   ✅ CREDS: ${v.CUSTOMER_CODE || 'N/A'} - Estado: ${v.ACCOUNT_STATUS || 'N/A'}`);
    }

    console.log('\n====================================');
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('====================================');
    console.log(`
📋 DATOS DE ACCESO PANAMAR:
   Código Cliente: ${PANAMAR_CLIENT_CODE}
   Contraseña:     ${PANAMAR_DEFAULT_PASSWORD}
   
📝 NOTAS:
   - El cliente 9999999999 activa el "modo PANAMAR"
   - Ve documentos de TODOS los clientes con productos PANAMAR
   - Precios siempre de TARIFA 85
   - No muestra totales ni IVA (solo cabecera + líneas)
`);
  } catch (error) {
    console.error('\n❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await odbcPool.close();
    process.exit(0);
  }
}

main();
