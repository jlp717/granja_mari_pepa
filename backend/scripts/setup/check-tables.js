const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== VERIFICACIÓN DE TABLAS Y DATOS ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function checkDatabase() {
  let connection;

  try {
    console.log('1. Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Verificar bibliotecas disponibles
    console.log('2. Verificando bibliotecas (schemas)...');
    try {
      const schemas = await connection.query(`
        SELECT SCHEMA_NAME
        FROM QSYS2.SYSSCHEMAS
        WHERE SCHEMA_NAME LIKE 'DSEDAC%' OR SCHEMA_NAME LIKE 'GMP%'
        ORDER BY SCHEMA_NAME
      `);
      console.log('Bibliotecas encontradas:', schemas.length);
      schemas.forEach(s => console.log('  -', s.SCHEMA_NAME));
    } catch (err) {
      console.log('⚠️  No se pudo obtener lista de schemas:', err.message);
    }

    // Verificar tabla LAC
    console.log('\n3. Verificando tabla DSEDAC.LAC...');
    try {
      const lacTest = await connection.query(`
        SELECT COUNT(*) AS TOTAL FROM DSEDAC.LAC FETCH FIRST 1 ROWS ONLY
      `);
      console.log('✅ Tabla LAC existe y es accesible');
      console.log('   Total registros (muestra):', lacTest[0].TOTAL);
    } catch (err) {
      console.log('❌ Error accediendo a DSEDAC.LAC:', err.message);

      // Intentar buscar la tabla LAC en otros schemas
      console.log('   Buscando tabla LAC en otros schemas...');
      try {
        const lacSearch = await connection.query(`
          SELECT TABLE_SCHEMA, TABLE_NAME
          FROM QSYS2.SYSTABLES
          WHERE TABLE_NAME = 'LAC'
        `);
        if (lacSearch.length > 0) {
          console.log('   Tabla LAC encontrada en:');
          lacSearch.forEach(t => console.log(`     - ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`));
        } else {
          console.log('   ⚠️  Tabla LAC no encontrada en ningún schema');
        }
      } catch (searchErr) {
        console.log('   ⚠️  No se pudo buscar la tabla:', searchErr.message);
      }
    }

    // Buscar albaranes disponibles
    console.log('\n4. Buscando albaranes de ejemplo...');
    try {
      const albaranes = await connection.query(`
        SELECT LCSBAB, LCYEAB, LCSRAB, LCTRAB, LCNRAB
        FROM DSEDAC.LAC
        GROUP BY LCSBAB, LCYEAB, LCSRAB, LCTRAB, LCNRAB
        ORDER BY LCYEAB DESC, LCNRAB DESC
        FETCH FIRST 10 ROWS ONLY
      `);
      console.log(`✅ Encontrados ${albaranes.length} albaranes de ejemplo:`);
      albaranes.forEach((a, i) => {
        console.log(`   ${i + 1}. Subempresa: ${a.LCSBAB}, Ejercicio: ${a.LCYEAB}, Serie: ${a.LCSRAB}, Terminal: ${a.LCTRAB}, Número: ${a.LCNRAB}`);
      });
    } catch (err) {
      console.log('❌ No se pudieron obtener albaranes:', err.message);
    }

    // Verificar otras tablas críticas
    console.log('\n5. Verificando otras tablas...');
    const tables = ['CAC', 'TAB', 'TRF', 'TCC'];
    for (const table of tables) {
      try {
        await connection.query(`SELECT * FROM DSEDAC.${table} FETCH FIRST 1 ROWS ONLY`);
        console.log(`   ✅ DSEDAC.${table}`);
      } catch (err) {
        console.log(`   ❌ DSEDAC.${table} - ${err.message.split('\n')[0]}`);
      }
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

checkDatabase();
