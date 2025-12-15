const odbcPool = require('./app/config/odbcConfig');

async function inspeccionar() {
  try {
    console.log('🔍 Inspeccionando estructura de CVC...\n');

    const query = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CVC'
      ORDER BY ORDINAL_POSITION
    `;

    const cols = await odbcPool.query(query);
    console.log('=== COLUMNAS DE DSEDAC.CVC ===');
    console.log('Total columnas:', cols.length);
    cols.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
    });

    await odbcPool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspeccionar();
