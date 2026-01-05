/**
 * Script para crear cliente de prueba JAVIER
 * Este cliente servirá para probar:
 * - Login por primera vez con contraseña legacy
 * - Cambio de contraseña obligatorio
 * - Recuperación de contraseña
 * - Todos los flujos del sistema de autenticación
 */

const databaseService = require('../app/services/databaseService');

async function createTestUserJavier() {
    console.log('='.repeat(80));
    console.log('CREAR CLIENTE DE PRUEBA: JAVIER');
    console.log('='.repeat(80));

    try {
        // 1. Verificar si ya existe
        console.log('\n📋 Verificando si ya existe el cliente...');

        const checkQuery = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        const existing = await databaseService.executeQuery(checkQuery);

        if (existing.length > 0) {
            console.log('⚠️  El cliente TEST_JAVIER ya existe:');
            console.log('   ID:', existing[0].CUSTOMER_ID);
            console.log('   Código:', existing[0].CUSTOMER_CODE);
            console.log('   Nombre:', existing[0].FULL_NAME);
            console.log('\n   Borrando cliente existente...');

            // Borrar cliente existente
            const deleteQuery = `
                DELETE FROM JAVIER.CUSTOMER_CREDENTIALS
                WHERE CUSTOMER_CODE = 'TEST_JAVIER'
            `;

            await databaseService.executeQuery(deleteQuery);
            console.log('   ✅ Cliente existente borrado');
        }

        // 2. Crear el nuevo cliente
        console.log('\n🔧 Creando nuevo cliente TEST_JAVIER...');

        const insertQuery = `
            INSERT INTO JAVIER.CUSTOMER_CREDENTIALS (
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                EMAIL_VERIFIED,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                LAST_PASSWORD_CHANGE,
                ACCOUNT_STATUS,
                CREATED_AT,
                UPDATED_AT
            ) VALUES (
                999999,
                'TEST_JAVIER',
                'JAVIER (Cliente de Prueba)',
                'javier@test.com',
                '1',
                'LEGACY_TEST123',
                'LEGACY',
                '1',
                CURRENT_TIMESTAMP,
                'ACTIVE',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
        `;

        await databaseService.executeQuery(insertQuery);

        console.log('✅ Cliente creado exitosamente!');

        // 3. Verificar creación
        console.log('\n📊 Datos del cliente creado:');
        console.log('-'.repeat(80));

        const verifyQuery = `
            SELECT
                CUSTOMER_ID,
                CUSTOMER_CODE,
                FULL_NAME,
                EMAIL,
                EMAIL_VERIFIED,
                PASSWORD_HASH,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                ACCOUNT_STATUS,
                CREATED_AT
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        const result = await databaseService.executeQuery(verifyQuery);

        if (result.length > 0) {
            const customer = result[0];
            console.log('📋 CUSTOMER_ID:', customer.CUSTOMER_ID);
            console.log('📋 CUSTOMER_CODE:', customer.CUSTOMER_CODE);
            console.log('📋 FULL_NAME:', customer.FULL_NAME);
            console.log('📋 EMAIL:', customer.EMAIL);
            console.log('📋 EMAIL_VERIFIED:', customer.EMAIL_VERIFIED);
            console.log('📋 PASSWORD_HASH:', customer.PASSWORD_HASH);
            console.log('📋 PASSWORD_ALGORITHM:', customer.PASSWORD_ALGORITHM);
            console.log('📋 IS_LEGACY_PASSWORD:', customer.IS_LEGACY_PASSWORD);
            console.log('📋 ACCOUNT_STATUS:', customer.ACCOUNT_STATUS);
            console.log('📋 CREATED_AT:', customer.CREATED_AT);
        }

        // 4. Instrucciones de uso
        console.log('\n' + '='.repeat(80));
        console.log('✅ CLIENTE DE PRUEBA CREADO EXITOSAMENTE');
        console.log('='.repeat(80));
        console.log('\n📝 CREDENCIALES PARA PROBAR:');
        console.log('-'.repeat(80));
        console.log('   Código de cliente: TEST_JAVIER');
        console.log('   Contraseña inicial: TEST123');
        console.log('\n💡 FLUJOS A PROBAR:');
        console.log('-'.repeat(80));
        console.log('   1. Login por primera vez (mostrará modal de cambio de contraseña)');
        console.log('   2. Cambiar contraseña a una segura (ej: "MiNuevaContraseñaSuper123!")');
        console.log('   3. Logout y login con nueva contraseña');
        console.log('   4. Intentar cambiar contraseña antes de 30 días (debería fallar)');
        console.log('   5. Solicitar recuperación de contraseña');
        console.log('\n⚠️  IMPORTANTE:');
        console.log('-'.repeat(80));
        console.log('   Este cliente es TEMPORAL y debe ser BORRADO después de las pruebas.');
        console.log('   Usa: node backend/scripts/delete-test-user-javier.js');
        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error creando cliente de prueba:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

createTestUserJavier();
