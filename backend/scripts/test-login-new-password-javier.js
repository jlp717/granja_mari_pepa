/**
 * Script para probar el login con la NUEVA contraseña del usuario JAVIER
 */

const authServiceSecure = require('../app/services/authServiceSecure');

async function testLoginNewPasswordJavier() {
    console.log('='.repeat(80));
    console.log('TEST: LOGIN CON NUEVA CONTRASEÑA - CLIENTE JAVIER');
    console.log('='.repeat(80));

    try {
        const customerCode = 'TEST_JAVIER';
        const password = 'MiNuevaContraseñaSuper123!';
        const ipAddress = '127.0.0.1';
        const userAgent = 'Test Script - Login with New Password';

        console.log('\n📋 Intentando login con nueva contraseña...');
        console.log('   - customerCode:', customerCode);
        console.log('   - password:', password);

        const result = await authServiceSecure.login(
            customerCode,
            password,
            ipAddress,
            userAgent
        );

        console.log('\n✅ Login exitoso con nueva contraseña!');
        console.log('\n📊 Resultado completo:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n' + '='.repeat(80));
        console.log('✅ PRUEBA DE LOGIN CON NUEVA CONTRASEÑA EXITOSA');
        console.log('='.repeat(80));

        console.log('\n📝 INFORMACIÓN IMPORTANTE:');
        console.log('-'.repeat(80));
        console.log('✅ showPasswordChangeModal:', result.showPasswordChangeModal);
        console.log('   ↳ Ahora debería ser FALSE porque ya cambió la contraseña');
        console.log('\n✅ accessToken generado:', result.tokens.accessToken ? 'Sí' : 'No');
        console.log('✅ refreshToken generado:', result.tokens.refreshToken ? 'Sí' : 'No');
        console.log('\n✅ Datos del cliente:');
        console.log('   - ID:', result.customer.id);
        console.log('   - Código:', result.customer.code);
        console.log('   - Nombre:', result.customer.fullName);
        console.log('   - Email:', result.customer.email);
        console.log('   - Legacy Password:', result.customer.isLegacyPassword);
        console.log('     ↳ Ahora debería ser FALSE');

        if (result.customer.isLegacyPassword === false) {
            console.log('\n✅ ¡PERFECTO! El usuario ya no tiene contraseña legacy.');
            console.log('   El sistema ahora reconoce que usa una contraseña moderna.');
        }

        console.log('\n💡 SIGUIENTE PASO:');
        console.log('-'.repeat(80));
        console.log('   Probar recuperación de contraseña olvidada');
        console.log('   (Flujo: solicitar código → verificar código → cambiar contraseña)');

    } catch (error) {
        console.error('\n❌ Error en login:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testLoginNewPasswordJavier();
