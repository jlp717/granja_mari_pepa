/**
 * Script para debuggear el usuario TEST_JAVIER
 */

const databaseService = require('../app/services/databaseService');

async function debugTestJavier() {
    console.log('='.repeat(80));
    console.log('DEBUG: USUARIO TEST_JAVIER');
    console.log('='.repeat(80));

    try {
        const query = `
            SELECT
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                ACCOUNT_STATUS,
                FAILED_LOGIN_ATTEMPTS,
                LAST_LOGIN_AT
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        const result = await databaseService.executeQuery(query);

        if (result.length === 0) {
            console.log('❌ No se encontró el usuario TEST_JAVIER');
            process.exit(1);
        }

        const customer = result[0];

        console.log('\n📋 Datos del usuario en la base de datos:');
        console.log('-'.repeat(80));
        console.log('CUSTOMER_ID:', customer.CUSTOMER_ID);
        console.log('CUSTOMER_CODE:', customer.CUSTOMER_CODE);
        console.log('FULL_NAME:', customer.FULL_NAME);
        console.log('EMAIL:', customer.EMAIL);
        console.log('\n🔑 Información de contraseña:');
        console.log('PASSWORD_HASH:', `"${customer.PASSWORD_HASH}"`);
        console.log('PASSWORD_HASH (length):', customer.PASSWORD_HASH ? customer.PASSWORD_HASH.length : 0);
        console.log('PASSWORD_HASH (trimmed):', `"${customer.PASSWORD_HASH ? customer.PASSWORD_HASH.trim() : ''}"`);
        console.log('PASSWORD_ALGORITHM:', `"${customer.PASSWORD_ALGORITHM}"`);
        console.log('IS_LEGACY_PASSWORD:', `"${customer.IS_LEGACY_PASSWORD}"`);
        console.log('ACCOUNT_STATUS:', customer.ACCOUNT_STATUS);
        console.log('FAILED_LOGIN_ATTEMPTS:', customer.FAILED_LOGIN_ATTEMPTS);
        console.log('LAST_LOGIN_AT:', customer.LAST_LOGIN_AT);

        console.log('\n🧪 Prueba de verificación manual:');
        console.log('-'.repeat(80));

        const plainPassword = 'TEST123';
        const expectedHash = `LEGACY_${plainPassword}`;
        const storedHash = customer.PASSWORD_HASH ? customer.PASSWORD_HASH.trim() : '';

        console.log('plainPassword:', `"${plainPassword}"`);
        console.log('expectedHash:', `"${expectedHash}"`);
        console.log('storedHash:', `"${storedHash}"`);
        console.log('\nComparación directa:', storedHash === expectedHash ? '✅ IGUAL' : '❌ DIFERENTE');

        if (storedHash !== expectedHash) {
            console.log('\n❌ PROBLEMA DETECTADO:');
            console.log('   El hash almacenado NO coincide con el formato esperado');
            console.log('\n   Esperado: "LEGACY_TEST123"');
            console.log('   Encontrado:', `"${storedHash}"`);

            // Verificar si tiene espacios
            if (storedHash.includes(' ')) {
                console.log('   ⚠️  El hash contiene ESPACIOS');
            }

            // Mostrar cada carácter
            console.log('\n   Caracteres del hash almacenado:');
            for (let i = 0; i < storedHash.length; i++) {
                console.log(`     [${i}]: "${storedHash[i]}" (código: ${storedHash.charCodeAt(i)})`);
            }
        } else {
            console.log('\n✅ El hash es correcto, debería funcionar el login');
        }

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

debugTestJavier();
