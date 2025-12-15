// Script para ver la estructura de la tabla CAC
require('dotenv').config();
const odbc = require('odbc');

async function testTablaCAC() {
  console.log('\n=== ESTRUCTURA DE LA TABLA CAC ===\n');
  
  const connectionString = process.env.ODBC_CONNECTION_STRING;
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✓ Conexión establecida\n');
    
    // Ver estructura de la tabla CAC
    console.log('Consultando columnas de DSEDAC.CAC...\n');
    const estructura = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSEDAC' 
      AND TABLE_NAME = 'CAC'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log(`Encontradas ${estructura.length} columnas:\n`);
    estructura.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} | ${col.DATA_TYPE.padEnd(15)} | Length: ${col.CHARACTER_MAXIMUM_LENGTH || 'N/A'}`);
    });
    
    // Intentar obtener una factura de ejemplo
    console.log('\n\nIntentando obtener una factura de ejemplo...\n');
    const ejemplo = await connection.query(`
      SELECT * FROM DSEDAC.CAC
      FETCH FIRST 1 ROWS ONLY
    `);
    
    if (ejemplo.length > 0) {
      console.log('Factura de ejemplo:');
      console.log('===================');
      for (const [key, value] of Object.entries(ejemplo[0])) {
        if (value !== null && value !== '') {
          console.log(`  ${key.padEnd(30)}: ${value}`);
        }
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

testTablaCAC();
