/**
 * Script para resetear el usuario TEST_JAVIER a estado inicial
 * - Contraseña: TEST_JAVIER (usando bcrypt)
 * - Sin historial de login ni cambio de contraseña
 * - Email y teléfono vacíos
 * 
 * Ejecutar: node scripts/debug/reset-test-javier.js
 */
require('dotenv').config();
const odbc = require('odbc');
const bcrypt = require('bcryptjs');

async function resetTestJavier() {
    console.log('========================================');
    console.log('🔄 RESET DE USUARIO TEST_JAVIER');
    console.log('========================================\n');

    const customerCode = 'TEST_JAVIER';
    const newPassword = 'TEST_JAVIER';
    const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';

    let cn;
    try {
        cn = await odbc.connect(connectionString);

        // 1. Generar hash de contraseña
        console.log('1️⃣ Generando hash de contraseña...');
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        console.log(`   ✅ Hash generado: ${passwordHash.substring(0, 20)}...`);

        // 2. Actualizar CUSTOMER_CREDENTIALS
        console.log('\n2️⃣ Reseteando CUSTOMER_CREDENTIALS...');
        const updateQuery = `
      UPDATE JAVIER.CUSTOMER_CREDENTIALS
      SET 
        PASSWORD_HASH = ?,
        PASSWORD_ALGORITHM = 'BCRYPT',
        IS_LEGACY_PASSWORD = 1,
        PASSWORD_LAST_CHANGED = NULL,
        PASSWORD_CHANGE_COUNT = 0,
        PASSWORD_WARNING_DISMISSALS = 0,
        EMAIL = NULL,
        EMAIL_VERIFIED = 0,
        PHONE = NULL,
        PHONE_VERIFIED = 0,
        LAST_LOGIN_AT = NULL,
        LAST_LOGIN_IP = NULL,
        LAST_LOGIN_USER_AGENT = NULL,
        FAILED_LOGIN_ATTEMPTS = 0,
        LAST_FAILED_LOGIN = NULL,
        ACCOUNT_LOCKED_UNTIL = NULL,
        ACCOUNT_STATUS = 'ACTIVE',
        UPDATED_AT = CURRENT_TIMESTAMP
      WHERE TRIM(CUSTOMER_CODE) = ?`;

        await cn.query(updateQuery, [passwordHash, customerCode]);
        console.log('   ✅ CUSTOMER_CREDENTIALS reseteado');

        // 3. Eliminar códigos de verificación anteriores
        console.log('\n3️⃣ Eliminando códigos de verificación...');
        try {
            const deleteCodesQuery = `
        DELETE FROM JAVIER.VERIFICATION_CODES
        WHERE CUSTOMER_ID IN (
          SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS
          WHERE TRIM(CUSTOMER_CODE) = ?
        )`;
            await cn.query(deleteCodesQuery, [customerCode]);
            console.log('   ✅ Códigos de verificación eliminados');
        } catch (e) {
            console.log('   ⚠️ No se pudieron eliminar códigos (puede que no existan)');
        }

        // 4. Eliminar historial de contraseñas
        console.log('\n4️⃣ Eliminando historial de contraseñas...');
        try {
            const deleteHistoryQuery = `
        DELETE FROM JAVIER.PASSWORD_HISTORY
        WHERE CUSTOMER_ID IN (
          SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS
          WHERE TRIM(CUSTOMER_CODE) = ?
        )`;
            await cn.query(deleteHistoryQuery, [customerCode]);
            console.log('   ✅ Historial de contraseñas eliminado');
        } catch (e) {
            console.log('   ⚠️ No se pudo eliminar historial (puede que no exista)');
        }

        // 5. Eliminar eventos de auditoría
        console.log('\n5️⃣ Eliminando eventos de auditoría...');
        try {
            const deleteAuditQuery = `
        DELETE FROM JAVIER.SECURITY_AUDIT_EVENTS
        WHERE CUSTOMER_ID IN (
          SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS
          WHERE TRIM(CUSTOMER_CODE) = ?
        )`;
            await cn.query(deleteAuditQuery, [customerCode]);
            console.log('   ✅ Eventos de auditoría eliminados');
        } catch (e) {
            console.log('   ⚠️ No se pudieron eliminar eventos (puede que no existan)');
        }

        // 6. Verificar el resultado
        console.log('\n6️⃣ Verificando resultado...');
        const verifyQuery = `
      SELECT 
        CUSTOMER_CODE, FULL_NAME, EMAIL, PHONE,
        IS_LEGACY_PASSWORD, PASSWORD_CHANGE_COUNT,
        LAST_LOGIN_AT, ACCOUNT_STATUS
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE TRIM(CUSTOMER_CODE) = ?`;
        const result = await cn.query(verifyQuery, [customerCode]);

        if (result && result.length > 0) {
            const user = result[0];
            console.log('\n   📋 Estado actual del usuario:');
            console.log(`      - Código: ${user.CUSTOMER_CODE}`);
            console.log(`      - Nombre: ${user.FULL_NAME}`);
            console.log(`      - Email: ${user.EMAIL || '(vacío)'}`);
            console.log(`      - Teléfono: ${user.PHONE || '(vacío)'}`);
            console.log(`      - Es legacy: ${user.IS_LEGACY_PASSWORD}`);
            console.log(`      - Cambios de contraseña: ${user.PASSWORD_CHANGE_COUNT}`);
            console.log(`      - Último login: ${user.LAST_LOGIN_AT || '(nunca)'}`);
            console.log(`      - Estado: ${user.ACCOUNT_STATUS}`);
        }

        console.log('\n========================================');
        console.log('✅ RESET COMPLETADO');
        console.log('========================================');
        console.log(`\n📝 Credenciales de acceso:`);
        console.log(`   Usuario: ${customerCode}`);
        console.log(`   Contraseña: ${newPassword}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.odbcErrors) {
            console.error('   ODBC Errors:', error.odbcErrors);
        }
    } finally {
        if (cn) await cn.close();
    }
}

resetTestJavier();
