/**
 * Script para probar el login del usuario de prueba JAVIER
 */

const authServiceSecure = require('../app/services/authServiceSecure');

async function testLoginJavier() {
    console.log('='.repeat(80));
    console.log('TEST: LOGIN CLIENTE JAVIER');
    console.log('='.repeat(80));

    try {
        const customerCode = 'TEST_JAVIER';
        const password = 'TEST123';
        const ipAddress = '127.0.0.1';
        const userAgent = 'Test Script - Login Javier';

        console.log('\n📋 Intentando login...');
        console.log('   - customerCode:', customerCode);
        console.log('   - password:', password);

        const result = await authServiceSecure.login(
            customerCode,
            password,
            ipAddress,
            userAgent
        );

        console.log('\n✅ Login exitoso!');
        console.log('\n📊 Resultado completo:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n' + '='.repeat(80));
        console.log('✅ PRUEBA DE LOGIN COMPLETADA EXITOSAMENTE');
        console.log('='.repeat(80));

        console.log('\n📝 INFORMACIÓN IMPORTANTE:');
        console.log('-'.repeat(80));
        console.log('✅ showPasswordChangeModal:', result.showPasswordChangeModal);
        console.log('   ↳ Esto indica que el usuario debe cambiar su contraseña');
        console.log('\n✅ accessToken generado:', result.tokens.accessToken ? 'Sí' : 'No');
        console.log('✅ refreshToken generado:', result.tokens.refreshToken ? 'Sí' : 'No');
        console.log('\n✅ Datos del cliente:');
        console.log('   - ID:', result.customer.id);
        console.log('   - Código:', result.customer.code);
        console.log('   - Nombre:', result.customer.fullName);
        console.log('   - Email:', result.customer.email);
        console.log('   - Legacy Password:', result.customer.isLegacyPassword);

        console.log('\n💡 SIGUIENTE PASO:');
        console.log('-'.repeat(80));
        console.log('   Usar el accessToken para probar el cambio de contraseña');
        console.log('   Ejecuta: node backend/scripts/test-change-password-javier.js');

    } catch (error) {
        console.error('\n❌ Error en login:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testLoginJavier();
