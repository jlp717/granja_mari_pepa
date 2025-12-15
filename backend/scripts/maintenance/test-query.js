const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== TEST DE CONSULTA SQL ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function testQuery() {
  let connection;

  try {
    console.log('Conectando...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Test 1: Consulta simple
    console.log('Test 1: Consulta simple SELECT...');
    try {
      const simple = await connection.query(`
        SELECT LCSBAB, LCYEAB, LCSRAB, LCTRAB, LCNRAB
        FROM DSEDAC.LAC
        WHERE LCSBAB = 'GMP'
          AND LCYEAB = 2025
          AND LCSRAB = 'L'
          AND LCTRAB = 93
          AND LCNRAB = 10979
        FETCH FIRST 5 ROWS ONLY
      `);
      console.log('✅ Consulta simple funciona');
      console.log('Resultados:', simple.length);
      if (simple.length > 0) console.log('Primera fila:', simple[0]);
    } catch (err) {
      console.log('❌ Error en consulta simple:', err.message);
    }

    // Test 2: Función CONCAT
    console.log('\nTest 2: Función CONCAT...');
    try {
      await connection.query(`SELECT CONCAT('test', 'concat') FROM SYSIBM.SYSDUMMY1`);
      console.log('✅ CONCAT funciona');
    } catch (err) {
      console.log('❌ CONCAT no disponible:', err.message);
    }

    // Test 3: Función RIGHT
    console.log('\nTest 3: Función RIGHT...');
    try {
      await connection.query(`SELECT RIGHT('12345', 3) FROM SYSIBM.SYSDUMMY1`);
      console.log('✅ RIGHT funciona');
    } catch (err) {
      console.log('❌ RIGHT no disponible:', err.message);
      console.log('   Intentando alternativas...');

      // Alternativa: SUBSTR
      try {
        await connection.query(`SELECT SUBSTR('12345', 3) FROM SYSIBM.SYSDUMMY1`);
        console.log('   ✅ SUBSTR funciona como alternativa');
      } catch (err2) {
        console.log('   ❌ SUBSTR tampoco funciona');
      }
    }

    // Test 4: CTE (Common Table Expression)
    console.log('\nTest 4: CTE (WITH clause)...');
    try {
      await connection.query(`
        WITH TestCTE AS (
          SELECT LCSBAB, LCYEAB
          FROM DSEDAC.LAC
          FETCH FIRST 1 ROWS ONLY
        )
        SELECT * FROM TestCTE
      `);
      console.log('✅ CTEs funcionan');
    } catch (err) {
      console.log('❌ CTEs no disponibles:', err.message);
    }

    // Test 5: Consulta completa simplificada
    console.log('\nTest 5: Consulta con parámetros...');
    try {
      const params = ['GMP', 2025, 'L', 93, 10979];
      const result = await connection.query(`
        WITH AlbaranBase AS (
          SELECT LCSBAB, LCYEAB, LCSRAB, LCTRAB, LCNRAB
          FROM DSEDAC.LAC
          WHERE LCSBAB = ?
            AND LCYEAB = ?
            AND LCSRAB = ?
            AND LCTRAB = ?
            AND LCNRAB = ?
        )
        SELECT * FROM AlbaranBase
      `, params);
      console.log('✅ Consulta con CTE y parámetros funciona');
      console.log('Resultados:', result.length);
    } catch (err) {
      console.log('❌ Error:', err.message);
      if (err.odbcErrors) {
        err.odbcErrors.forEach(e => console.log(`   Estado: ${e.state}, Código: ${e.code}, Msg: ${e.message}`));
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

testQuery();
