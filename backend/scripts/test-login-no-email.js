/**
 * Script para probar login con un usuario sin email
 */

const authService = require('../app/services/authServiceSecure');

async function testLoginNoEmail() {
    try {
        console.log('='.repeat(80));
        console.log('TEST: Login con usuario sin email (4300009900)');
        console.log('='.repeat(80));

        const customerCode = '4300009900';
        const password = '23224478K'; // NIF usado como contraseña legacy
        const ipAddress = '127.0.0.1';
        const userAgent = 'Test Script';

        console.log('\n📋 Intentando login...');
        console.log('   - customerCode:', customerCode);
        console.log('   - password:', password);

        const result = await authService.login(
            customerCode,
            password,
            ipAddress,
            userAgent
        );

        console.log('\n✅ Login exitoso!');
        console.log('\nRespuesta:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n✅ El login funciona correctamente incluso sin email');

    } catch (error) {
        console.error('\n❌ Error en login:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);

        console.log('\n⚠️  Este error puede estar relacionado con el email vacío');
    } finally {
        process.exit(0);
    }
}

testLoginNoEmail();
