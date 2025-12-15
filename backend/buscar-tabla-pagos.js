const odbcPool = require('./app/config/odbcConfig');

async function buscar() {
  try {
    console.log('🔍 Buscando tablas relacionadas con pagos/vencimientos...\n');

    // Buscar todas las tablas en DSEDAC
    const query = `
      SELECT DISTINCT TABLE_NAME
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND (TABLE_NAME LIKE '%CC%'
          OR TABLE_NAME LIKE '%PAG%'
          OR TABLE_NAME LIKE '%VEN%'
          OR TABLE_NAME LIKE '%COB%')
      ORDER BY TABLE_NAME
    `;

    const tables = await odbcPool.query(query);
    console.log('=== TABLAS ENCONTRADAS ===');
    console.log('Total tablas:', tables.length);
    tables.forEach(t => console.log(`- ${t.TABLE_NAME}`));

    // También buscar columnas con "VENCIMIENTO" en cualquier tabla
    console.log('\n🔍 Buscando columnas con "VENCIMIENTO"...\n');
    const colQuery = `
      SELECT TABLE_NAME, COLUMN_NAME
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND COLUMN_NAME LIKE '%VENCIMIENTO%'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `;

    const cols = await odbcPool.query(colQuery);
    console.log('=== COLUMNAS CON VENCIMIENTO ===');
    cols.forEach(c => console.log(`- ${c.TABLE_NAME}.${c.COLUMN_NAME}`));

    await odbcPool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscar();
