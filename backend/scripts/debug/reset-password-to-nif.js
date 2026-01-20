/**
 * Script para resetear la contraseña de un usuario a su NIF
 * ========================================================
 * Uso: node scripts/debug/reset-password-to-nif.js [CODIGO_CLIENTE]
 * Ejemplo: node scripts/debug/reset-password-to-nif.js 4300063236
 */

require('dotenv').config();
const odbc = require('odbc');
const bcrypt = require('bcryptjs');

async function resetPasswordToNif() {
    const customerCode = process.argv[2] || 'TEST_JAVIER';

    console.log('========================================');
    console.log(`🔄 RESET PASSWORD A NIF PARA: ${customerCode}`);
    console.log('========================================\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
    let cn;

    try {
        cn = await odbc.connect(connectionString);

        // 1. Obtener NIF del cliente
        console.log('1️⃣ Obteniendo NIF del cliente...');
        const nifQuery = `SELECT NIF FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?`;
        const nifResult = await cn.query(nifQuery, [customerCode]);

        if (!nifResult || nifResult.length === 0 || !nifResult[0].NIF) {
            console.error('❌ Error: Cliente no encontrado o sin NIF');
            process.exit(1);
        }

        const nif = nifResult[0].NIF.trim();
        console.log(`   ✅ NIF encontrado: ${nif}`);

        // 2. Generar hash del NIF
        console.log('\n2️⃣ Generando hash del NIF...');
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(nif, salt);
        console.log(`   ✅ Hash generado`);

        // 3. Actualizar credenciales
        console.log('\n3️⃣ Actualizando JAVIER.CUSTOMER_CREDENTIALS...');

        // Primero verificamos si existe el registro
        const checkQuery = `SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE TRIM(CUSTOMER_CODE) = ?`;
        const checkResult = await cn.query(checkQuery, [customerCode]);

        if (checkResult && checkResult.length > 0) {
            // UPDATE
            const updateQuery = `
        UPDATE JAVIER.CUSTOMER_CREDENTIALS
        SET 
          PASSWORD_HASH = ?,
          IS_LEGACY_PASSWORD = 1,      -- Forzar flag de legacy
          PASSWORD_LAST_CHANGED = NULL,
          FAILED_LOGIN_ATTEMPTS = 0,
          ACCOUNT_LOCKED_UNTIL = NULL,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE TRIM(CUSTOMER_CODE) = ?
      `;
            await cn.query(updateQuery, [passwordHash, customerCode]);
            console.log('   ✅ Registro ACTUALIZADO');
        } else {
            console.error('❌ Error: El usuario no tiene entrada en CUSTOMER_CREDENTIALS. Debe crearse primero.');
            // Opcionalmente podríamos hacer un INSERT aquí si fuera necesario
        }

        // 4. Verificar
        console.log('\n4️⃣ Verificando resultado...');
        const verifyQuery = `
      SELECT CUSTOMER_CODE, IS_LEGACY_PASSWORD 
      FROM JAVIER.CUSTOMER_CREDENTIALS 
      WHERE TRIM(CUSTOMER_CODE) = ?`;
        const verifyResult = await cn.query(verifyQuery, [customerCode]);

        console.log('   Resultado:', verifyResult[0]);
        console.log('\n========================================');
        console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
        console.log(`   Usuario: ${customerCode}`);
        console.log(`   Nueva Password: ${nif} (Su NIF)`);
        console.log('========================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (cn) await cn.close();
    }
}

resetPasswordToNif();
