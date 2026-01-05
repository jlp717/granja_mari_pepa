/**
 * Script para probar el login del cliente REAL 4300009900
 */

const authServiceSecure = require('../app/services/authServiceSecure');
const databaseService = require('../app/services/databaseService');

async function testClienteReal() {
    console.log('='.repeat(80));
    console.log('TEST: CLIENTE REAL 4300009900');
    console.log('='.repeat(80));

    try {
        // 1. Verificar datos en la base de datos
        console.log('\n📋 Paso 1: Verificar datos en base de datos');
        console.log('-'.repeat(80));

        const query = `
            SELECT
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                ACCOUNT_STATUS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = '4300009900'
        `;

        const result = await databaseService.executeQuery(query);

        if (result.length === 0) {
            console.log('❌ No se encontró el cliente 4300009900');
            process.exit(1);
        }

        const customer = result[0];
        console.log('✅ Cliente encontrado:');
        console.log('   CUSTOMER_CODE:', customer.CUSTOMER_CODE);
        console.log('   FULL_NAME:', customer.FULL_NAME);
        console.log('   PASSWORD_HASH:', customer.PASSWORD_HASH);
        console.log('   PASSWORD_ALGORITHM:', customer.PASSWORD_ALGORITHM);
        console.log('   IS_LEGACY_PASSWORD:', customer.IS_LEGACY_PASSWORD);

        // 2. Verificar el formato del hash
        console.log('\n📋 Paso 2: Verificar formato de contraseña');
        console.log('-'.repeat(80));

        const expectedNif = '23224478K';
        const expectedHash = `LEGACY_${expectedNif}`;
        const storedHash = customer.PASSWORD_HASH.trim();

        console.log('   NIF esperado:', expectedNif);
        console.log('   Hash esperado:', expectedHash);
        console.log('   Hash almacenado:', storedHash);

        if (storedHash !== expectedHash) {
            console.log('   ⚠️  WARNING: El hash NO coincide exactamente');
            console.log('   Esto puede causar problemas en el login');
        } else {
            console.log('   ✅ El hash coincide perfectamente');
        }

        // 3. Probar login
        console.log('\n📋 Paso 3: Probar login con NIF');
        console.log('-'.repeat(80));

        const customerCode = '4300009900';
        const password = expectedNif;
        const ipAddress = '127.0.0.1';
        const userAgent = 'Test Script - Cliente Real';

        console.log('   Intentando login...');
        console.log('   customerCode:', customerCode);
        console.log('   password:', password);

        try {
            const loginResult = await authServiceSecure.login(
                customerCode,
                password,
                ipAddress,
                userAgent
            );

            console.log('\n✅ Login exitoso!');
            console.log('\n📊 Resultado:');
            console.log('   success:', loginResult.success);
            console.log('   customer.id:', loginResult.customer.id);
            console.log('   customer.code:', loginResult.customer.code);
            console.log('   customer.fullName:', loginResult.customer.fullName);
            console.log('   customer.isLegacyPassword:', loginResult.customer.isLegacyPassword);
            console.log('   showPasswordChangeModal:', loginResult.showPasswordChangeModal);

            if (loginResult.showPasswordChangeModal) {
                console.log('\n💡 Este cliente verá el modal recomendando cambiar su contraseña.');
            }

        } catch (loginError) {
            console.log('\n❌ Error en login:', loginError.message);
            console.log('\n🔍 Diagnóstico:');

            if (loginError.message === 'Credenciales inválidas') {
                console.log('   El problema es que la contraseña no coincide.');
                console.log('   Causas posibles:');
                console.log('   1. El hash almacenado no es el formato esperado');
                console.log('   2. El NIF no es correcto');
                console.log('   3. La función de verificación tiene un bug');
            }
        }

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

testClienteReal();
