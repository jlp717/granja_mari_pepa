/**
 * Script para verificar la estructura de CUSTOMER_CREDENTIALS
 * y diagnosticar el problema con las columnas
 */

const databaseService = require('../app/services/databaseService');

async function checkTableStructure() {
    try {
        console.log('='.repeat(80));
        console.log('VERIFICANDO ESTRUCTURA DE CUSTOMER_CREDENTIALS');
        console.log('='.repeat(80));

        // 1. Obtener metadata de columnas usando SYSCOLUMNS
        const metadataQuery = `
            SELECT
                COLUMN_NAME,
                ORDINAL_POSITION,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM QSYS2.SYSCOLUMNS
            WHERE TABLE_SCHEMA = 'JAVIER'
                AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
            ORDER BY ORDINAL_POSITION
        `;

        console.log('\n📋 Estructura de columnas (orden real en la base de datos):');
        console.log('-'.repeat(80));

        const columns = await databaseService.executeQuery(metadataQuery);

        columns.forEach((col, index) => {
            console.log(`${index + 1}. ${col.COLUMN_NAME.padEnd(30)} | Tipo: ${col.DATA_TYPE} | Posición: ${col.ORDINAL_POSITION}`);
        });

        // 2. Obtener un registro de ejemplo con todas las columnas explícitas
        const sampleQuery = `
            SELECT
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                EMAIL_VERIFIED,
                PHONE,
                PHONE_VERIFIED,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                LAST_PASSWORD_CHANGE,
                PASSWORD_EXPIRES_AT,
                PASSWORD_CHANGE_COUNT,
                LAST_ALLOWED_PASSWORD_CHANGE,
                ACCOUNT_STATUS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = '4300009900'
        `;

        console.log('\n📊 Datos del cliente 4300009900 (columnas explícitas):');
        console.log('-'.repeat(80));

        const sample = await databaseService.executeQuery(sampleQuery);

        if (sample.length > 0) {
            const customer = sample[0];
            console.log('CUSTOMER_ID:', customer.CUSTOMER_ID);
            console.log('CUSTOMER_CODE:', customer.CUSTOMER_CODE);
            console.log('FULL_NAME:', customer.FULL_NAME);
            console.log('EMAIL:', customer.EMAIL);
            console.log('EMAIL_VERIFIED:', customer.EMAIL_VERIFIED);
            console.log('PHONE:', customer.PHONE);
            console.log('PHONE_VERIFIED:', customer.PHONE_VERIFIED);
            console.log('PASSWORD_HASH:', customer.PASSWORD_HASH);
            console.log('PASSWORD_ALGORITHM:', customer.PASSWORD_ALGORITHM);
            console.log('IS_LEGACY_PASSWORD:', customer.IS_LEGACY_PASSWORD);
            console.log('LAST_PASSWORD_CHANGE:', customer.LAST_PASSWORD_CHANGE);
            console.log('ACCOUNT_STATUS:', customer.ACCOUNT_STATUS);

            console.log('\n✅ Diagnóstico:');
            if (!customer.EMAIL || customer.EMAIL === '09900' || !customer.EMAIL.includes('@')) {
                console.log('⚠️  PROBLEMA: EMAIL no tiene un valor válido:', customer.EMAIL);
                console.log('    Esto puede causar errores en el login porque el código espera un email.');
            } else {
                console.log('✅ EMAIL parece válido:', customer.EMAIL);
            }
        } else {
            console.log('❌ No se encontró el cliente 4300009900');
        }

        // 3. Verificar todos los clientes con emails inválidos
        const invalidEmailsQuery = `
            SELECT
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                IS_LEGACY_PASSWORD
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE EMAIL IS NOT NULL
                AND (EMAIL NOT LIKE '%@%' OR LENGTH(TRIM(EMAIL)) < 5)
            FETCH FIRST 10 ROWS ONLY
        `;

        console.log('\n📧 Clientes con emails potencialmente inválidos:');
        console.log('-'.repeat(80));

        const invalidEmails = await databaseService.executeQuery(invalidEmailsQuery);

        if (invalidEmails.length > 0) {
            console.log(`⚠️  Encontrados ${invalidEmails.length} clientes con emails inválidos:`);
            invalidEmails.forEach(c => {
                console.log(`   - ${c.CUSTOMER_CODE}: "${c.EMAIL}" (${c.FULL_NAME})`);
            });
        } else {
            console.log('✅ No se encontraron emails inválidos');
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Verificación completada');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error verificando estructura:', error);
    } finally {
        process.exit(0);
    }
}

checkTableStructure();
