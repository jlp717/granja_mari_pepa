/**
 * Script para inspeccionar columnas REALES de CAC y CLI
 */

const odbcPool = require('./app/config/odbcConfig');

async function inspeccionar() {
  try {
    console.log('🔍 Inspeccionando estructura de CAC...\n');

    // Inspeccionar CAC
    const cacQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CAC'
      ORDER BY ORDINAL_POSITION
    `;

    const cacCols = await odbcPool.query(cacQuery);
    console.log('=== COLUMNAS DE DSEDAC.CAC ===');
    console.log('Total columnas:', cacCols.length);
    cacCols.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
    });

    console.log('\n\n🔍 Inspeccionando estructura de CLI...\n');

    // Inspeccionar CLI
    const cliQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CLI'
      ORDER BY ORDINAL_POSITION
    `;

    const cliCols = await odbcPool.query(cliQuery);
    console.log('=== COLUMNAS DE DSEDAC.CLI ===');
    console.log('Total columnas:', cliCols.length);
    cliCols.forEach(col => {
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
