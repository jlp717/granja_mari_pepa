// Script para probar el login completo incluyendo el servicio
require('dotenv').config();
const authService = require('./app/services/authService');
const pool = require('./app/config/odbcConfig');

async function testLoginService() {
  console.log('\n=== TEST DE SERVICIO DE AUTENTICACIÓN ===\n');
  
  // Inicializar el pool primero
  console.log('Inicializando pool de conexiones...');
  await pool.initialize();
  console.log('Pool inicializado\n');
  
  const codigoCliente = '4300000025';
  const nif = '23233313R';
  
  const metadata = {
    ip: '127.0.0.1',
    userAgent: 'Test Script'
  };
  
  console.log('Intentando autenticar cliente...');
  console.log('Código:', codigoCliente);
  console.log('NIF:', nif);
  console.log('');
  
  try {
    const resultado = await authService.autenticarCliente(
      codigoCliente,
      nif,
      metadata
    );
    
    console.log('\n=== RESULTADO ===');
    console.log(JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      console.log('\n✅ ¡LOGIN EXITOSO!');
      console.log('Cliente:', resultado.cliente.nombre);
    } else {
      console.log('\n❌ LOGIN FALLIDO');
      console.log('Error:', resultado.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cerrar el pool
    console.log('\nCerrando pool...');
    await pool.close();
  }
  
  // Cerrar el proceso
  process.exit(0);
}

testLoginService();
