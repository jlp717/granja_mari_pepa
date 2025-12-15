const odbcPool = require('./app/config/odbcConfig');

async function inspeccionar() {
  try {
    console.log('🔍 Buscando columnas de fecha en CAC...\n');

    const query = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CAC'
        AND (COLUMN_NAME LIKE '%FECHA%' OR COLUMN_NAME LIKE '%DIA%' OR COLUMN_NAME LIKE '%MES%' OR COLUMN_NAME LIKE '%ANO%')
      ORDER BY ORDINAL_POSITION
    `;

    const cols = await odbcPool.query(query);
    console.log('=== COLUMNAS DE FECHA EN DSEDAC.CAC ===');
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
