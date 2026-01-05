/**
 * Script para BORRAR el cliente de prueba JAVIER
 * Usar después de terminar las pruebas
 */

const databaseService = require('../app/services/databaseService');

async function deleteTestUserJavier() {
    console.log('='.repeat(80));
    console.log('BORRAR CLIENTE DE PRUEBA: JAVIER');
    console.log('='.repeat(80));

    try {
        // 1. Verificar si existe
        console.log('\n📋 Verificando si existe el cliente...');

        const checkQuery = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME, CREATED_AT
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        const existing = await databaseService.executeQuery(checkQuery);

        if (existing.length === 0) {
            console.log('ℹ️  El cliente TEST_JAVIER no existe en la base de datos.');
            process.exit(0);
            return;
        }

        console.log('✅ Cliente encontrado:');
        console.log('   ID:', existing[0].CUSTOMER_ID);
        console.log('   Código:', existing[0].CUSTOMER_CODE);
        console.log('   Nombre:', existing[0].FULL_NAME);
        console.log('   Creado:', existing[0].CREATED_AT);

        // 2. Borrar registros relacionados (se borrarán automáticamente por CASCADE)
        console.log('\n🗑️  Borrando cliente y todos sus registros relacionados...');

        const deleteQuery = `
            DELETE FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        await databaseService.executeQuery(deleteQuery);

        console.log('✅ Cliente TEST_JAVIER borrado exitosamente!');

        // 3. Verificar borrado
        console.log('\n📊 Verificando borrado...');

        const verifyQuery = `
            SELECT COUNT(*) as COUNT
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
        `;

        const result = await databaseService.executeQuery(verifyQuery);

        if (result[0].COUNT === 0) {
            console.log('✅ Confirmado: Cliente ya no existe en la base de datos');
        } else {
            console.log('⚠️  Advertencia: Aún hay registros en la base de datos');
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ PROCESO DE BORRADO COMPLETADO');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Error borrando cliente de prueba:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

deleteTestUserJavier();
