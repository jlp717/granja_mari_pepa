const odbc = require('odbc');
require('dotenv').config();
const { CONSULTA_FACTURA_OPTIMIZADA } = require('./app/models/facturaModel');

console.log('\n=== TEST DE CONSULTA COMPLETA ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function testFullQuery() {
  let connection;

  try {
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    const params = [
      'GMP', 2025, 'L', 93, 10979,  // AlbaranBase
      'GMP', 2025, 'L', 93, 10979,  // CabeceraAlbaran
      'GMP', 2025, 'L', 93, 10979   // DatosMayorista
    ];

    console.log('Parámetros:', params);
    console.log('\nEjecutando CONSULTA_FACTURA_OPTIMIZADA...\n');

    try {
      const result = await connection.query(CONSULTA_FACTURA_OPTIMIZADA, params);
      console.log(`\n✅ CONSULTA EXITOSA!`);
      console.log(`Resultados: ${result.length} filas`);
      if (result.length > 0) {
        console.log('\nPrimera fila:');
        console.log(JSON.stringify(result[0], null, 2));
      }
    } catch (err) {
      console.log('\n❌ ERROR EN LA CONSULTA:');
      console.log('Mensaje:', err.message);

      if (err.odbcErrors) {
        console.log('\nErrores ODBC detallados:');
        err.odbcErrors.forEach((e, i) => {
          console.log(`\nError ${i + 1}:`);
          console.log(`  Estado: ${e.state}`);
          console.log(`  Código: ${e.code}`);
          console.log(`  Mensaje: ${e.message}`);
        });
      }

      // Mostrar parte de la consulta para debug
      console.log('\nLongitud de la consulta SQL:', CONSULTA_FACTURA_OPTIMIZADA.length, 'caracteres');
    }

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

testFullQuery();
