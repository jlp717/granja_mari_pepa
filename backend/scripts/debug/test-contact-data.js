/**
 * Debug script para verificar qué devuelve el endpoint de contacto
 * Ejecutar: node scripts/debug/test-contact-data.js
 */
require('dotenv').config();
const odbc = require('odbc');

async function testContactData() {
    console.log('========================================');
    console.log('🔍 TEST DE DATOS DE CONTACTO');
    console.log('========================================\n');

    const testCode = 'TEST_JAVIER';

    try {
        const cn = await odbc.connect(process.env.DB_CONNECTION_STRING);

        // 1. Query directa a CUSTOMER_CREDENTIALS
        console.log('1️⃣ Consultando CUSTOMER_CREDENTIALS...\n');
        const credentialsQuery = `
      SELECT 
        CUSTOMER_CODE,
        FULL_NAME,
        EMAIL,
        PHONE,
        EMAIL_VERIFIED,
        PHONE_VERIFIED
      FROM JAVIER.CUSTOMER_CREDENTIALS 
      WHERE TRIM(CUSTOMER_CODE) = ?`;

        const result = await cn.query(credentialsQuery, [testCode]);

        if (result && result.length > 0) {
            const row = result[0];
            console.log('✅ Usuario encontrado en CUSTOMER_CREDENTIALS:');
            console.log(`   - CUSTOMER_CODE: "${row.CUSTOMER_CODE}"`);
            console.log(`   - FULL_NAME: "${row.FULL_NAME}"`);
            console.log(`   - EMAIL: "${row.EMAIL || '(empty)'}"`);
            console.log(`   - PHONE: "${row.PHONE || '(empty)'}"`);
            console.log(`   - EMAIL_VERIFIED: ${row.EMAIL_VERIFIED}`);
            console.log(`   - PHONE_VERIFIED: ${row.PHONE_VERIFIED}`);
        } else {
            console.log('❌ Usuario NO encontrado en CUSTOMER_CREDENTIALS');
        }

        // 2. Query como la hace obtenerPerfil
        console.log('\n2️⃣ Query como la hace obtenerPerfil...\n');
        const perfilQuery = `
      SELECT 
        cc.CUSTOMER_CODE AS CODIGOCLIENTE,
        cc.FULL_NAME AS NOMBRECLIENTE,
        cc.EMAIL AS EMAIL,
        cc.PHONE AS TELEFONO
      FROM JAVIER.CUSTOMER_CREDENTIALS cc
      WHERE TRIM(cc.CUSTOMER_CODE) = ?`;

        const perfilResult = await cn.query(perfilQuery, [testCode]);

        if (perfilResult && perfilResult.length > 0) {
            const row = perfilResult[0];
            console.log('✅ Resultado de query perfil:');
            console.log(`   - CODIGOCLIENTE: "${row.CODIGOCLIENTE}"`);
            console.log(`   - NOMBRECLIENTE: "${row.NOMBRECLIENTE}"`);
            console.log(`   - EMAIL: "${row.EMAIL || '(null/empty)'}"`);
            console.log(`   - TELEFONO: "${row.TELEFONO || '(null/empty)'}"`);

            // Simular lo que hace el controller
            const emailValue = row.EMAIL ? row.EMAIL.trim() : '';
            const telefonoValue = row.TELEFONO ? row.TELEFONO.trim() : '';

            console.log('\n📦 Objeto que devolvería el controller:');
            console.log(JSON.stringify({
                email: emailValue,
                telefono: telefonoValue,
                contacto: { email: emailValue, telefono: telefonoValue }
            }, null, 2));
        } else {
            console.log('❌ Query perfil no devolvió resultados');
        }

        await cn.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('\n========================================');
    console.log('🏁 TEST COMPLETADO');
    console.log('========================================');
}

testContactData();
