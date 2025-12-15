require('dotenv').config();
const odbc = require('odbc');

async function verColumnas() {
  let connection;
  
  try {
    console.log('🔍 Obteniendo columnas de CAC, LAC, CLI...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Columnas de CAC
    const cacCols = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CAC'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Columnas de CAC:');
    cacCols.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Columnas de LAC
    const lacCols = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'LAC'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Columnas de LAC:');
    lacCols.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type}`);
    });
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Columnas de CLI
    const cliCols = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Columnas de CLI (primeras 30):');
    cliCols.slice(0, 30).forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type}`);
    });
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

verColumnas();
