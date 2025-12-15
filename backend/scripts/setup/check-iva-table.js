const odbc = require('dotenv');
require('dotenv').config();

const odbc2 = require('odbc');

console.log('\n=== VERIFICANDO ESTRUCTURA DE TABLA IVA ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function checkIVA() {
  let connection;

  try {
    connection = await odbc2.connect(connectionString);
    console.log('✅ Conectado\n');

    // Ver columnas de la tabla IVA
    console.log('Columnas de DSEDAC.IVA:');
    const columns = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'IVA'
      ORDER BY ORDINAL_POSITION
    `);

    columns.forEach(c => {
      console.log(`  ${c.COLUMN_NAME.padEnd(20)} ${c.DATA_TYPE.padEnd(10)} Length: ${c.LENGTH}, Scale: ${c.NUMERIC_SCALE}`);
    });

    // Probar SELECT simple
    console.log('\n\nDatos de ejemplo en DSEDAC.IVA:');
    const sample = await connection.query(`SELECT * FROM DSEDAC.IVA FETCH FIRST 3 ROWS ONLY`);
    console.log(JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

checkIVA();
