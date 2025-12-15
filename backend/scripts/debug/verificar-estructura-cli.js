/**
 * Script para verificar estructura de la tabla CLI
 */

const odbc = require('odbc');
require('dotenv').config();

const CONNECTION_STRING = process.env.ODBC_CONNECTION_STRING;

async function verificarEstructuraCLI() {
  let connection;
  
  try {
    console.log('📡 Conectando...');
    connection = await odbc.connect(CONNECTION_STRING);
    console.log('✅ Conectado\n');
    
    // Ver estructura de la tabla
    console.log('📋 Estructura de DSEDAC.CLI:\n');
    const columnas = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CLI'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas disponibles:');
    columnas.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} Length: ${col.CHARACTER_MAXIMUM_LENGTH || 'N/A'}`);
    });
    
    // Ver un cliente de ejemplo
    console.log('\n📄 Cliente de ejemplo:');
    const ejemplo = await connection.query(`
      SELECT * FROM DSEDAC.CLI
      FETCH FIRST 1 ROWS ONLY
    `);
    
    if (ejemplo.length > 0) {
      console.log('\nDatos del primer cliente:');
      Object.keys(ejemplo[0]).forEach(key => {
        const valor = ejemplo[0][key];
        if (valor !== null && String(valor).trim() !== '') {
          console.log(`  ${key.padEnd(30)}: ${valor}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.close();
  }
}

verificarEstructuraCLI();
