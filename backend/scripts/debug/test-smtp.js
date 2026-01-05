/**
 * SCRIPT DE PRUEBA SMTP
 * ======================
 * Verifica que el servicio de email funciona correctamente
 * 
 * Uso: node scripts/debug/test-smtp.js
 */

require('dotenv').config();
const emailService = require('../../app/services/emailService');

async function testSMTP() {
    console.log('========================================');
    console.log('🧪 TEST DE CONEXIÓN SMTP');
    console.log('========================================\n');

    // 1. Mostrar configuración (sin password)
    console.log('📧 Configuración actual:');
    console.log(`   - Host: ${process.env.SMTP_HOST || 'mail.mari-pepa.com'}`);
    console.log(`   - Port: ${process.env.SMTP_PORT || '587'}`);
    console.log(`   - Secure: ${process.env.SMTP_SECURE || 'false'}`);
    console.log(`   - User: ${process.env.SMTP_USER || 'noreply@mari-pepa.com'}`);
    console.log(`   - Password: ${process.env.SMTP_PASSWORD ? '***configurado***' : '❌ NO CONFIGURADO'}`);
    console.log('');

    // 2. Verificar conexión
    console.log('🔌 Verificando conexión SMTP...');
    try {
        const result = await emailService.verifyConnection();
        if (result.success) {
            console.log('✅ Conexión SMTP verificada correctamente\n');
        } else {
            console.log('❌ Error en conexión SMTP:', result.message);
            return;
        }
    } catch (error) {
        console.log('❌ Error verificando conexión:', error.message);
        console.log('\n💡 Posibles causas:');
        console.log('   - Host SMTP incorrecto');
        console.log('   - Puerto bloqueado por firewall');
        console.log('   - Credenciales inválidas');
        console.log('   - El servidor requiere TLS/SSL diferente');
        return;
    }

    // 3. Enviar email de prueba (opcional - descomenta si quieres probar)
    const TEST_EMAIL = process.argv[2]; // Pasar email como argumento

    if (TEST_EMAIL) {
        console.log(`📤 Enviando email de prueba a: ${TEST_EMAIL}`);
        try {
            const testCode = '123456';
            const result = await emailService.sendVerificationCodeEmail(
                TEST_EMAIL,
                testCode,
                'Usuario de Prueba'
            );

            if (result.success) {
                console.log('✅ Email enviado correctamente');
                console.log(`   Message ID: ${result.messageId}`);
            } else {
                console.log('❌ Error enviando email');
            }
        } catch (error) {
            console.log('❌ Error enviando email:', error.message);
        }
    } else {
        console.log('ℹ️  Para enviar un email de prueba, ejecuta:');
        console.log('   node scripts/debug/test-smtp.js tu@email.com');
    }

    console.log('\n========================================');
    console.log('🏁 TEST COMPLETADO');
    console.log('========================================');
}

testSMTP().catch(console.error);
