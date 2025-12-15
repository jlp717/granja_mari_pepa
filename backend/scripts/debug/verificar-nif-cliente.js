/**
 * Script para verificar qué NIF se guardó en CUSTOMER_CREDENTIALS
 */

const bcrypt = require('bcrypt');
const odbc = require('odbc');
require('dotenv').config();

const CONNECTION_STRING = process.env.ODBC_CONNECTION_STRING;

async function verificarCliente() {
  let connection;
  
  try {
    console.log('📡 Conectando...');
    connection = await odbc.connect(CONNECTION_STRING);
    console.log('✅ Conectado\n');
    
    const codigoCliente = '4300009900';
    
    // 1. Ver el NIF en CLI
    console.log('🔍 NIF en DSEDAC.CLI:');
    const clienteCLI = await connection.query(`
      SELECT CODIGOCLIENTE, NIF, NOMBRECLIENTE
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE = ?
    `, [codigoCliente]);
    
    if (clienteCLI.length > 0) {
      const nifOriginal = clienteCLI[0].NIF;
      console.log(`   Código: ${clienteCLI[0].CODIGOCLIENTE}`);
      console.log(`   Nombre: ${clienteCLI[0].NOMBRECLIENTE}`);
      console.log(`   NIF original: "${nifOriginal}"`);
      console.log(`   NIF limpio: "${nifOriginal.trim()}"`);
      console.log(`   Longitud: ${nifOriginal.length} chars`);
      
      // 2. Ver las credenciales en JAVIER
      console.log('\n🔐 Credenciales en JAVIER.CUSTOMER_CREDENTIALS:');
      const credenciales = await connection.query(`
        SELECT CODIGO_CLIENTE, PASSWORD_HASH, SALT, ACTIVO
        FROM JAVIER.CUSTOMER_CREDENTIALS
        WHERE CODIGO_CLIENTE = ?
      `, [codigoCliente]);
      
      if (credenciales.length > 0) {
        console.log(`   Código: ${credenciales[0].CODIGO_CLIENTE}`);
        console.log(`   Hash: ${credenciales[0].PASSWORD_HASH.substring(0, 30)}...`);
        console.log(`   Activo: ${credenciales[0].ACTIVO}`);
        
        // 3. Probar diferentes variaciones del NIF
        console.log('\n🧪 Probando variaciones del NIF:\n');
        
        const variaciones = [
          nifOriginal,                           // Original con espacios
          nifOriginal.trim(),                    // Sin espacios alrededor
          nifOriginal.replace(/\s+/g, ''),       // Sin espacios
          nifOriginal.replace(/[\s\-\.]/g, ''), // Sin espacios, guiones ni puntos
          nifOriginal.toUpperCase(),             // Mayúsculas
          nifOriginal.trim().toUpperCase(),      // Mayúsculas sin espacios
          nifOriginal.replace(/\s+/g, '').toUpperCase(), // Mayúsculas sin espacios
          '23224478K',                           // El que dice el usuario
        ];
        
        for (const variacion of variaciones) {
          const match = await bcrypt.compare(variacion, credenciales[0].PASSWORD_HASH);
          const estado = match ? '✅ MATCH' : '❌ NO MATCH';
          console.log(`   ${estado} "${variacion}" (${variacion.length} chars)`);
        }
        
      } else {
        console.log('   ❌ No se encontraron credenciales');
      }
      
    } else {
      console.log('   ❌ Cliente no encontrado en CLI');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.close();
  }
}

verificarCliente();
