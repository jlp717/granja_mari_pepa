const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== BUSCANDO TABLA TIV ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function findTIV() {
  let connection;

  try {
    connection = await odbc.connect(connectionString);

    // Buscar tabla TIV en todos los schemas
    console.log('1. Buscando tabla TIV en todos los schemas...');
    try {
      const tables = await connection.query(`
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
        FROM QSYS2.SYSTABLES
        WHERE TABLE_NAME LIKE '%TIV%' OR TABLE_NAME LIKE '%IVA%'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);

      if (tables.length > 0) {
        console.log(`\n✅ Encontradas ${tables.length} tablas relacionadas con IVA/TIV:\n`);
        tables.forEach(t => {
          console.log(`   ${t.TABLE_SCHEMA}.${t.TABLE_NAME} (${t.TABLE_TYPE})`);
        });
      } else {
        console.log('❌ No se encontraron tablas con IVA o TIV en el nombre');
      }
    } catch (err) {
      console.log('❌ Error buscando tablas:', err.message);
    }

    // Buscar tablas con campos relacionados con IVA
    console.log('\n2. Buscando tablas con columnas de IVA en DSEDAC...');
    try {
      const columns = await connection.query(`
        SELECT TABLE_NAME, COLUMN_NAME
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND (COLUMN_NAME LIKE '%IVA%' OR COLUMN_NAME LIKE '%TIP%' OR COLUMN_NAME LIKE '%PORCE%')
        ORDER BY TABLE_NAME, COLUMN_NAME
        FETCH FIRST 50 ROWS ONLY
      `);

      if (columns.length > 0) {
        console.log(`\n✅ Encontradas ${columns.length} columnas relacionadas:\n`);
        const grouped = {};
        columns.forEach(c => {
          if (!grouped[c.TABLE_NAME]) grouped[c.TABLE_NAME] = [];
          grouped[c.TABLE_NAME].push(c.COLUMN_NAME);
        });
        for (const [table, cols] of Object.entries(grouped)) {
          console.log(`   ${table}: ${cols.join(', ')}`);
        }
      }
    } catch (err) {
      console.log('❌ Error buscando columnas:', err.message);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

findTIV();
