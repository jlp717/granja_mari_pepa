// Script para probar el login de cliente
require('dotenv').config();
const odbc = require('odbc');

async function testClienteLogin() {
  console.log('\n=== TEST DE LOGIN CLIENTE ===\n');
  
  const connectionString = process.env.ODBC_CONNECTION_STRING;
  console.log('Connection String:', connectionString);
  
  let connection;
  
  try {
    console.log('\n1. Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✓ Conexión establecida\n');
    
    // Buscar el cliente específico
    const codigoCliente = '4300000027';
    const nifCliente = '23194184H';
    
    console.log('2. Buscando cliente con:');
    console.log('   Código:', codigoCliente);
    console.log('   NIF:', nifCliente);
    console.log('');
    
    // Primero, ver qué columnas tiene la tabla CLI
    console.log('3. Consultando estructura de la tabla DSEDAC.CLI...\n');
    const estructura = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSEDAC' 
      AND TABLE_NAME = 'CLI'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas de DSEDAC.CLI:');
    console.log('========================');
    estructura.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(20)} | ${col.DATA_TYPE.padEnd(15)} | Length: ${col.CHARACTER_MAXIMUM_LENGTH || 'N/A'}`);
    });
    
    // Buscar el cliente por código
    console.log('\n4. Buscando cliente por código...\n');
    const queryPorCodigo = `
      SELECT * FROM DSEDAC.CLI 
      WHERE CODIGOCLIENTE = '${codigoCliente}'
      FETCH FIRST 1 ROWS ONLY
    `;
    console.log('Query:', queryPorCodigo);
    const resultadoCodigo = await connection.query(queryPorCodigo);
    
    if (resultadoCodigo.length > 0) {
      console.log('\n✓ Cliente encontrado por código:');
      console.log('================================');
      const cliente = resultadoCodigo[0];
      for (const [key, value] of Object.entries(cliente)) {
        if (value !== null && value !== '') {
          console.log(`  ${key.padEnd(20)}: ${value}`);
        }
      }
    } else {
      console.log('\n✗ No se encontró cliente con código:', codigoCliente);
    }
    
    // Buscar por NIF
    console.log('\n5. Buscando por NIF...\n');
    const queryPorNif = `
      SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF, TRIM(NIF) AS NIF_LIMPIO
      FROM DSEDAC.CLI 
      WHERE TRIM(NIF) = '${nifCliente}'
      FETCH FIRST 5 ROWS ONLY
    `;
    console.log('Query:', queryPorNif);
    const resultadoNif = await connection.query(queryPorNif);
    
    if (resultadoNif.length > 0) {
      console.log(`\n✓ Encontrados ${resultadoNif.length} clientes con NIF similar:`);
      console.log('=====================================================');
      resultadoNif.forEach((cliente, idx) => {
        console.log(`\nCliente ${idx + 1}:`);
        console.log(`  Código: ${cliente.CODIGOCLIENTE}`);
        console.log(`  Nombre: ${cliente.NOMBRECLIENTE}`);
        console.log(`  NIF (original): "${cliente.NIF}"`);
        console.log(`  NIF (limpio): "${cliente.NIF_LIMPIO}"`);
        console.log(`  Longitud NIF: ${cliente.NIF ? cliente.NIF.length : 0}`);
      });
    } else {
      console.log('\n✗ No se encontraron clientes con NIF:', nifCliente);
    }
    
    // Intentar la búsqueda como lo haría el backend
    console.log('\n6. Probando búsqueda como el backend...\n');
    const queryBackend = `
      SELECT * FROM DSEDAC.CLI 
      WHERE CODIGOCLIENTE = '${codigoCliente}' 
      AND TRIM(NIF) = '${nifCliente}'
      FETCH FIRST 1 ROWS ONLY
    `;
    console.log('Query:', queryBackend);
    const resultadoBackend = await connection.query(queryBackend);
    
    if (resultadoBackend.length > 0) {
      console.log('\n✓✓✓ LOGIN EXITOSO ✓✓✓');
      console.log('======================');
      const cliente = resultadoBackend[0];
      console.log(`Cliente: ${cliente.NOMBRECLIENTE}`);
      console.log(`Código: ${cliente.CODIGOCLIENTE}`);
      console.log(`NIF: ${cliente.NIF}`);
    } else {
      console.log('\n✗✗✗ LOGIN FALLIDO ✗✗✗');
      console.log('======================');
      console.log('No se encontró coincidencia con código Y NIF');
      
      // Verificar cada campo por separado
      console.log('\n7. Diagnóstico detallado...\n');
      
      const verificarCodigo = await connection.query(`
        SELECT COUNT(*) as TOTAL FROM DSEDAC.CLI WHERE CODIGOCLIENTE = '${codigoCliente}'
      `);
      console.log(`Clientes con código ${codigoCliente}: ${verificarCodigo[0].TOTAL}`);
      
      const verificarNif = await connection.query(`
        SELECT COUNT(*) as TOTAL FROM DSEDAC.CLI WHERE TRIM(NIF) = '${nifCliente}'
      `);
      console.log(`Clientes con NIF ${nifCliente}: ${verificarNif[0].TOTAL}`);
      
      // Buscar códigos similares
      console.log('\n8. Buscando códigos similares...\n');
      const similares = await connection.query(`
        SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF 
        FROM DSEDAC.CLI 
        WHERE CODIGOCLIENTE LIKE '%${codigoCliente.slice(-5)}%'
        FETCH FIRST 5 ROWS ONLY
      `);
      
      if (similares.length > 0) {
        console.log('Clientes con código similar:');
        similares.forEach(c => {
          console.log(`  ${c.CODIGOCLIENTE} - ${c.NOMBRECLIENTE} - NIF: ${c.NIF}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n\nConexión cerrada.');
    }
  }
}

testClienteLogin();
