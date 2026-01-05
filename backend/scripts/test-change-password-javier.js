/**
 * Script para probar el cambio de contraseña del usuario JAVIER
 */

const authServiceSecure = require('../app/services/authServiceSecure');

async function testChangePasswordJavier() {
    console.log('='.repeat(80));
    console.log('TEST: CAMBIO DE CONTRASEÑA CLIENTE JAVIER');
    console.log('='.repeat(80));

    try {
        const customerId = 999999; // ID del usuario TEST_JAVIER
        const currentPassword = 'TEST123';
        const newPassword = 'MiNuevaContraseñaSuper123!';
        const ipAddress = '127.0.0.1';
        const userAgent = 'Test Script - Change Password';

        console.log('\n📋 Intentando cambiar contraseña...');
        console.log('   - customerId:', customerId);
        console.log('   - currentPassword:', currentPassword);
        console.log('   - newPassword:', newPassword);

        const result = await authServiceSecure.changePassword(
            customerId,
            currentPassword,
            newPassword,
            ipAddress,
            userAgent
        );

        console.log('\n✅ Cambio de contraseña exitoso!');
        console.log('\n📊 Resultado completo:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n' + '='.repeat(80));
        console.log('✅ PRUEBA DE CAMBIO DE CONTRASEÑA COMPLETADA EXITOSAMENTE');
        console.log('='.repeat(80));

        console.log('\n📝 INFORMACIÓN IMPORTANTE:');
        console.log('-'.repeat(80));
        console.log('✅ Puntuación de fortaleza:', result.strengthScore);
        console.log('✅ Tiempo estimado para crackear:', result.crackTimeDisplay);
        console.log('✅ Mensaje:', result.message);

        console.log('\n💡 SIGUIENTE PASO:');
        console.log('-'.repeat(80));
        console.log('   Probar login con la nueva contraseña');
        console.log('   Ejecuta: node backend/scripts/test-login-new-password-javier.js');

    } catch (error) {
        console.error('\n❌ Error cambiando contraseña:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);

        if (error.message.includes('Debes esperar')) {
            console.log('\n⚠️  NOTA:');
            console.log('   Este error es ESPERADO si ya cambiaste la contraseña anteriormente.');
            console.log('   El sistema previene cambios de contraseña frecuentes (cooldown de 30 días).');
        }
    } finally {
        process.exit(0);
    }
}

testChangePasswordJavier();
