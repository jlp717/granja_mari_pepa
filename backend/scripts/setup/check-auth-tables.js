const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== VERIFICACIÓN DE TABLAS DE AUTENTICACIÓN ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function checkAuthTables() {
  let connection;

  try {
    console.log('1. Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Buscar tablas relacionadas con autenticación
    console.log('2. Buscando tablas de autenticación...');
    try {
      const authTables = await connection.query(`
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND (TABLE_NAME LIKE '%AUTH%'
               OR TABLE_NAME LIKE '%TOKEN%'
               OR TABLE_NAME LIKE '%SESSION%'
               OR TABLE_NAME LIKE '%LOGIN%'
               OR TABLE_NAME LIKE '%USER%'
               OR TABLE_NAME LIKE '%PASSWORD%'
               OR TABLE_NAME LIKE '%CREDENTIAL%')
        ORDER BY TABLE_NAME
      `);

      if (authTables.length > 0) {
        console.log(`✅ Encontradas ${authTables.length} tablas relacionadas:\n`);
        authTables.forEach(t => {
          console.log(`   ${t.TABLE_SCHEMA}.${t.TABLE_NAME} (${t.TABLE_TYPE})`);
        });
      } else {
        console.log('⚠️  No se encontraron tablas de autenticación existentes');
        console.log('   Se necesitará crear tablas nuevas para autenticación segura');
      }
    } catch (err) {
      console.log('❌ Error buscando tablas:', err.message);
    }

    // Listar todas las tablas del schema DSEDAC
    console.log('\n3. Listando todas las tablas de DSEDAC...');
    try {
      const allTables = await connection.query(`
        SELECT TABLE_NAME
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
        ORDER BY TABLE_NAME
      `);
      console.log(`✅ Encontradas ${allTables.length} tablas:\n`);
      allTables.forEach((t, i) => {
        if (i % 5 === 0) console.log('');
        process.stdout.write(`   ${t.TABLE_NAME.padEnd(15)}`);
      });
      console.log('\n');
    } catch (err) {
      console.log('❌ Error listando tablas:', err.message);
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Mensaje:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('✅ Conexión cerrada');
    }
  }
}

checkAuthTables();
