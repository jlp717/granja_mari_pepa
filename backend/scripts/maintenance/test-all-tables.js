const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== VERIFICANDO TODAS LAS TABLAS DE LA CONSULTA ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

// Todas las tablas que usa la consulta
const tables = [
  'LAC',    // Líneas albarán
  'CAC',    // Cabecera albarán
  'TAB',    // Tipos albarán
  'CDVI',   // Datos visitas
  'CDLO',   // Datos localidades
  'FI5',    // Filtros producto
  'ARA',    // Tarifas
  'LINDTO', // Datos mayorista
  'CPC',    // Datos pedidos
  'OPP',    // Datos órdenes
  'CLI',    // Clientes
  'TIV'     // Tipos IVA
];

async function checkAllTables() {
  let connection;

  try {
    console.log('Conectando...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    console.log('Verificando tablas en DSEDAC:\n');

    for (const table of tables) {
      try {
        await connection.query(`SELECT * FROM DSEDAC.${table} FETCH FIRST 1 ROWS ONLY`);
        console.log(`✅ DSEDAC.${table}`);
      } catch (err) {
        const errorMsg = err.message.split('\n')[0];
        console.log(`❌ DSEDAC.${table}`);
        if (err.odbcErrors && err.odbcErrors.length > 0) {
          const odbcErr = err.odbcErrors[0];
          console.log(`   Estado: ${odbcErr.state}, Código: ${odbcErr.code}`);
          console.log(`   ${errorMsg}`);
        }
      }
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

checkAllTables();
