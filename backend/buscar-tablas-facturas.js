require('dotenv').config();
const odbc = require('odbc');

async function buscarTablas() {
  let connection;
  
  try {
    console.log('🔍 Buscando tablas CAC, LAC, CCC...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Buscar tabla CAC
    const cacResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME = 'CAC'
      AND TABLE_TYPE = 'T'
    `);
    
    console.log('📋 Tabla CAC encontrada en:');
    cacResult.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // Buscar tabla LAC
    const lacResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME = 'LAC'
      AND TABLE_TYPE = 'T'
    `);
    
    console.log('\n📋 Tabla LAC encontrada en:');
    lacResult.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // Buscar tabla CCC
    const cccResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME = 'CCC'
      AND TABLE_TYPE = 'T'
    `);
    
    console.log('\n📋 Tabla CCC encontrada en:');
    cccResult.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // Buscar tabla CLI
    const cliResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME = 'CLI'
      AND TABLE_TYPE = 'T'
    `);
    
    console.log('\n📋 Tabla CLI encontrada en:');
    cliResult.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    // Buscar tabla HCPC_BK1 (facturas) mencionada en workspace
    const hcpcResult = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE 'H%PC%BK%'
      AND TABLE_TYPE = 'T'
    `);
    
    console.log('\n📋 Tablas H*PC*BK* encontradas:');
    hcpcResult.forEach(row => {
      console.log(`  ${row.TABLE_SCHEMA}.${row.TABLE_NAME}`);
    });
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

buscarTablas();
