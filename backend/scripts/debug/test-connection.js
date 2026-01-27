const odbc = require('odbc');
require('dotenv').config();

async function testConnection() {
  console.log('========================================');
  console.log('🔌 TEST DE CONEXIÓN ODBC');
  console.log('========================================');

  const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
  console.log(`String de conexión: ${connectionString}`);

  try {
    console.log('1️⃣ Conectando...');
    const connection = await odbc.connect(connectionString);
    console.log('   ✅ Conexión establecida.');

    console.log('2️⃣ Ejecutando query de prueba...');
    const result = await connection.query('SELECT 1 AS RESULT FROM SYSIBM.SYSDUMMY1');
    console.log('   ✅ Query ejecutada:', result);

    console.log('3️⃣ Cerrando conexión...');
    await connection.close();
    console.log('   ✅ Conexión cerrada.');

    console.log('\n✅ TEST EXITOSO: El servidor responde correctamente.');
  } catch (error) {
    console.error('\n❌ TEST FALLIDO:', error);
    if (error.odbcErrors) {
      console.error('   ODBC Errors:', error.odbcErrors);
    }
  }
}

testConnection();
