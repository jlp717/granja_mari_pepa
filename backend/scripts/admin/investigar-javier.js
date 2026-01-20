/**
 * INVESTIGAR ESTADO ACTUAL DE TABLAS JAVIER
 * ==========================================
 * Ver qué datos hay actualmente para entender qué resetear
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       INVESTIGAR ESTADO ACTUAL DE TABLAS JAVIER                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // 1. CUSTOMER_CREDENTIALS - La tabla principal
    console.log('1️⃣ JAVIER.CUSTOMER_CREDENTIALS:');
    console.log('─'.repeat(70));
    try {
        const credentialsCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.CUSTOMER_CREDENTIALS
        `);
        console.log(`   Total registros: ${credentialsCount[0].TOTAL}`);

        // Ver estructura de la tabla
        const columns = await connection.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_PRECISION
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('\n   Columnas:');
        columns.forEach(c => {
            console.log(`     - ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
        });

        // Ver datos de muestra
        const sampleData = await connection.query(`
            SELECT 
                CUSTOMER_CODE,
                COALESCE(EMAIL, '') AS EMAIL,
                COALESCE(PHONE, '') AS PHONE,
                IS_LEGACY_PASSWORD,
                PASSWORD_CHANGED_AT,
                PASSWORD_WARNING_DISMISSALS,
                LAST_LOGIN_AT,
                LOGIN_COUNT,
                FAILED_LOGIN_ATTEMPTS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            FETCH FIRST 10 ROWS ONLY
        `);
        console.log('\n   Muestra de datos (primeros 10):');
        sampleData.forEach(row => {
            console.log(`     ${row.CUSTOMER_CODE}: Email='${row.EMAIL}' Phone='${row.PHONE}' Legacy=${row.IS_LEGACY_PASSWORD} Dismissals=${row.PASSWORD_WARNING_DISMISSALS} Logins=${row.LOGIN_COUNT}`);
        });

        // Estadísticas relevantes
        const stats = await connection.query(`
            SELECT 
                SUM(CASE WHEN COALESCE(EMAIL, '') <> '' THEN 1 ELSE 0 END) AS CON_EMAIL,
                SUM(CASE WHEN COALESCE(PHONE, '') <> '' THEN 1 ELSE 0 END) AS CON_PHONE,
                SUM(CASE WHEN IS_LEGACY_PASSWORD = 0 THEN 1 ELSE 0 END) AS CONTRASEÑA_CAMBIADA,
                SUM(CASE WHEN IS_LEGACY_PASSWORD = 1 THEN 1 ELSE 0 END) AS CONTRASEÑA_LEGACY,
                SUM(CASE WHEN PASSWORD_WARNING_DISMISSALS > 0 THEN 1 ELSE 0 END) AS HAN_DESCARTADO_MODAL,
                SUM(CASE WHEN PASSWORD_CHANGED_AT IS NOT NULL THEN 1 ELSE 0 END) AS CON_FECHA_CAMBIO
            FROM JAVIER.CUSTOMER_CREDENTIALS
        `);
        console.log('\n   📊 Estadísticas:');
        console.log(`     - Con email configurado: ${stats[0].CON_EMAIL}`);
        console.log(`     - Con teléfono configurado: ${stats[0].CON_PHONE}`);
        console.log(`     - Con contraseña cambiada (no legacy): ${stats[0].CONTRASEÑA_CAMBIADA}`);
        console.log(`     - Con contraseña legacy (NIF): ${stats[0].CONTRASEÑA_LEGACY}`);
        console.log(`     - Han descartado modal de contraseña: ${stats[0].HAN_DESCARTADO_MODAL}`);
        console.log(`     - Con fecha de cambio de contraseña: ${stats[0].CON_FECHA_CAMBIO}`);

    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    // 2. CUSTOMER_EMAILS - Tabla separada de emails
    console.log('\n\n2️⃣ JAVIER.CUSTOMER_EMAILS:');
    console.log('─'.repeat(70));
    try {
        const emailsCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.CUSTOMER_EMAILS
        `);
        console.log(`   Total registros: ${emailsCount[0].TOTAL}`);

        const emailsSample = await connection.query(`
            SELECT * FROM JAVIER.CUSTOMER_EMAILS FETCH FIRST 10 ROWS ONLY
        `);
        if (emailsSample.length > 0) {
            console.log('   Muestra:');
            emailsSample.forEach(row => {
                console.log(`     ${JSON.stringify(row)}`);
            });
        }
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    // 3. CUSTOMER_PASSWORDS - Historial de contraseñas
    console.log('\n\n3️⃣ JAVIER.CUSTOMER_PASSWORDS:');
    console.log('─'.repeat(70));
    try {
        const pwdCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.CUSTOMER_PASSWORDS
        `);
        console.log(`   Total registros: ${pwdCount[0].TOTAL}`);

        const pwdSample = await connection.query(`
            SELECT CUSTOMER_CODE, CREATED_AT FROM JAVIER.CUSTOMER_PASSWORDS
            ORDER BY CREATED_AT DESC FETCH FIRST 10 ROWS ONLY
        `);
        if (pwdSample.length > 0) {
            console.log('   Últimos cambios de contraseña:');
            pwdSample.forEach(row => {
                console.log(`     ${row.CUSTOMER_CODE}: ${row.CREATED_AT}`);
            });
        }
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    // 4. LOGIN_ATTEMPTS - Historial de logins
    console.log('\n\n4️⃣ JAVIER.LOGIN_ATTEMPTS:');
    console.log('─'.repeat(70));
    try {
        const loginCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.LOGIN_ATTEMPTS
        `);
        console.log(`   Total registros: ${loginCount[0].TOTAL}`);
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    // 5. SECURITY_AUDIT - Auditoría de seguridad
    console.log('\n\n5️⃣ JAVIER.SECURITY_AUDIT:');
    console.log('─'.repeat(70));
    try {
        const auditCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.SECURITY_AUDIT
        `);
        console.log(`   Total registros: ${auditCount[0].TOTAL}`);
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    // 6. REFRESH_TOKENS - Tokens activos
    console.log('\n\n6️⃣ JAVIER.REFRESH_TOKENS:');
    console.log('─'.repeat(70));
    try {
        const tokenCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.REFRESH_TOKENS
        `);
        console.log(`   Total registros: ${tokenCount[0].TOTAL}`);
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    // 7. PASSWORD_RESET_TOKENS
    console.log('\n\n7️⃣ JAVIER.PASSWORD_RESET_TOKENS:');
    console.log('─'.repeat(70));
    try {
        const resetCount = await connection.query(`
            SELECT COUNT(*) AS TOTAL FROM JAVIER.PASSWORD_RESET_TOKENS
        `);
        console.log(`   Total registros: ${resetCount[0].TOTAL}`);
    } catch (e) {
        console.log(`   ❌ Error o tabla no existe: ${e.message.substring(0, 50)}`);
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE RESETEO NECESARIO:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Para dejar todo "como si nadie hubiera tocado nada":');
    console.log('  1. CUSTOMER_CREDENTIALS:');
    console.log('     - EMAIL = NULL');
    console.log('     - PHONE = NULL');
    console.log('     - IS_LEGACY_PASSWORD = 1 (contraseña = NIF)');
    console.log('     - PASSWORD_CHANGED_AT = NULL');
    console.log('     - PASSWORD_WARNING_DISMISSALS = 0');
    console.log('     - LOGIN_COUNT = 0');
    console.log('  2. CUSTOMER_EMAILS: DELETE ALL');
    console.log('  3. CUSTOMER_PASSWORDS: DELETE ALL');
    console.log('  4. LOGIN_ATTEMPTS: DELETE ALL');
    console.log('  5. SECURITY_AUDIT: DELETE ALL');
    console.log('  6. REFRESH_TOKENS: DELETE ALL');
    console.log('  7. PASSWORD_RESET_TOKENS: DELETE ALL');
    console.log('═══════════════════════════════════════════════════════════════');

    await connection.close();
    console.log('\n✅ Investigación completada');
}

main().catch(e => console.error('Error:', e));
