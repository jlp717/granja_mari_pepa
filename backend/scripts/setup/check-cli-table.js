const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== VERIFICACIÓN DE TABLA CLI (CLIENTES) ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function checkCLITable() {
  let connection;

  try {
    console.log('1. Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Verificar estructura de la tabla CLI
    console.log('2. Verificando estructura de DSEDAC.CLI...');
    try {
      const columns = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
        ORDER BY ORDINAL_POSITION
      `);
      console.log(`✅ Tabla CLI tiene ${columns.length} columnas:\n`);
      columns.forEach(col => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        const nullable = col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL';
        console.log(`   ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE}${length.padEnd(10)} ${nullable}`);
      });
    } catch (err) {
      console.log('❌ Error obteniendo estructura:', err.message);
    }

    // Obtener algunos clientes de ejemplo
    console.log('\n3. Obteniendo clientes de ejemplo...');
    try {
      const clientes = await connection.query(`
        SELECT *
        FROM DSEDAC.CLI
        FETCH FIRST 5 ROWS ONLY
      `);
      console.log(`✅ Encontrados ${clientes.length} clientes de ejemplo:\n`);
      clientes.forEach((c, i) => {
        console.log(`Cliente ${i + 1}:`);
        Object.keys(c).forEach(key => {
          if (c[key] && c[key].toString().trim()) {
            console.log(`   ${key}: ${c[key]}`);
          }
        });
        console.log('');
      });
    } catch (err) {
      console.log('❌ Error obteniendo clientes:', err.message);
    }

    // Buscar campos relacionados con NIF/CIF
    console.log('4. Buscando campos relacionados con NIF/CIF...');
    try {
      const nifFields = await connection.query(`
        SELECT COLUMN_NAME
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND TABLE_NAME = 'CLI'
          AND (COLUMN_NAME LIKE '%NIF%' OR COLUMN_NAME LIKE '%CIF%' OR COLUMN_NAME LIKE '%DNI%')
      `);
      if (nifFields.length > 0) {
        console.log('✅ Campos encontrados:');
        nifFields.forEach(f => console.log(`   - ${f.COLUMN_NAME}`));
      } else {
        console.log('⚠️  No se encontraron campos con NIF/CIF/DNI en el nombre');
      }
    } catch (err) {
      console.log('❌ Error buscando campos:', err.message);
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

checkCLITable();
