/**
 * Script de prueba de login completo
 */

const bcrypt = require('bcrypt');
const odbc = require('odbc');
require('dotenv').config();

const CONNECTION_STRING = process.env.ODBC_CONNECTION_STRING;

async function probarLogin() {
  let connection;
  
  try {
    console.log('📡 Conectando...');
    connection = await odbc.connect(CONNECTION_STRING);
    console.log('✅ Conectado\n');
    
    const codigoCliente = '4300009900';
    const nif = '23224478K';
    
    console.log('🔍 Paso 1: Buscar credenciales...\n');
    
    const credenciales = await connection.query(`
      SELECT 
        CODIGO_CLIENTE,
        PASSWORD_HASH,
        PASSWORD_TYPE,
        ACTIVO
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE CODIGO_CLIENTE = ?
      FETCH FIRST 1 ROWS ONLY
    `, [codigoCliente]);
    
    if (credenciales.length === 0) {
      console.log('❌ No se encontraron credenciales');
      return;
    }
    
    console.log('✅ Credenciales encontradas:');
    console.log(`   Código: ${credenciales[0].CODIGO_CLIENTE}`);
    console.log(`   Tipo: ${credenciales[0].PASSWORD_TYPE}`);
    console.log(`   Activo: ${credenciales[0].ACTIVO}`);
    console.log(`   Hash: ${credenciales[0].PASSWORD_HASH.substring(0, 30)}...`);
    
    console.log('\n🔐 Paso 2: Comparar password...\n');
    
    const match = await bcrypt.compare(nif, credenciales[0].PASSWORD_HASH);
    
    if (match) {
      console.log('✅ ¡PASSWORD CORRECTO!');
      console.log(`   NIF "${nif}" coincide con el hash almacenado`);
    } else {
      console.log('❌ Password incorrecto');
    }
    
    console.log('\n📄 Paso 3: Obtener datos del cliente...\n');
    
    const clienteData = await connection.query(`
      SELECT
        CODIGOCLIENTE,
        NOMBRECLIENTE,
        NIF,
        DIRECCION,
        POBLACION
      FROM DSEDAC.CLI
      WHERE TRIM(CODIGOCLIENTE) = ?
      FETCH FIRST 1 ROWS ONLY
    `, [codigoCliente]);
    
    if (clienteData.length > 0) {
      console.log('✅ Datos del cliente:');
      console.log(`   Código: ${clienteData[0].CODIGOCLIENTE}`);
      console.log(`   Nombre: ${clienteData[0].NOMBRECLIENTE}`);
      console.log(`   NIF en CLI: ${clienteData[0].NIF.trim()}`);
      console.log(`   Dirección: ${clienteData[0].DIRECCION}`);
      console.log(`   Población: ${clienteData[0].POBLACION}`);
    }
    
    console.log('\n🎉 ¡LOGIN EXITOSO! Todo funciona correctamente.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) await connection.close();
  }
}

probarLogin();
