const odbcPool = require('./app/config/odbcConfig');

async function inspeccionar() {
  try {
    const query = `
      SELECT COLUMN_NAME
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'LAC'
      ORDER BY ORDINAL_POSITION
    `;

    const cols = await odbcPool.query(query);
    console.log('=== COLUMNAS DE DSEDAC.LAC ===');
    cols.forEach(col => console.log(`- ${col.COLUMN_NAME}`));

    await odbcPool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌', error);
    process.exit(1);
  }
}

inspeccionar();
