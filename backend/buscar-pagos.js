require('dotenv').config();
const odbc = require('odbc');

async function buscarPagos() {
  let connection;
  
  try {
    console.log('🔍 Buscando tablas de pagos...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Buscar tablas con "CC" o "PAG" en el nombre
    const result = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE (TABLE_NAME LIKE '%CC%' OR TABLE_NAME LIKE '%PAG%')
      AND TABLE_TYPE = 'T'
      AND TABLE_SCHEMA IN ('DSEF', 'WTAD01', 'DSEDAZ', 'DSEDAC')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('📋 Tablas encontradas:');
    result.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // Verificar library list actual
    console.log('\n🔍 Library List actual:');
    const libList = await connection.query(`
      SELECT ORDINAL_POSITION, SYSTEM_SCHEMA_NAME
      FROM QSYS2.LIBRARY_LIST_INFO
      ORDER BY ORDINAL_POSITION
    `);
    
    libList.forEach(row => {
      console.log(`  ${row.ORDINAL_POSITION}. ${row.SYSTEM_SCHEMA_NAME}`);
    });
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

buscarPagos();
