/**
 * SCRIPT PARA VERIFICAR TABLA CLIP
 * ==================================
 * Verifica si la tabla CLIP existe y sus columnas
 */

require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function verificarTabla() {
  try {
    console.log('🔍 Verificando tabla CLIP...\n');

    // Verificar si la tabla existe
    const queryExistencia = `
      SELECT COUNT(*) AS EXISTE
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'CLIP'
    `;

    const existe = await odbcPool.query(queryExistencia);
    console.log('Resultado de existencia:', existe);

    if (existe[0].EXISTE === 0) {
      console.log('❌ La tabla DSEDAC.CLIP NO existe\n');

      // Intentar buscar tablas similares
      console.log('🔍 Buscando tablas similares...');
      const querySimilares = `
        SELECT TABLE_NAME, TABLE_SCHEMA
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND TABLE_NAME LIKE '%CLI%'
        ORDER BY TABLE_NAME
      `;

      const similares = await odbcPool.query(querySimilares);
      console.log('\nTablas encontradas con "CLI":');
      similares.forEach(t => {
        console.log(`  - ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
      });
    } else {
      console.log('✅ La tabla DSEDAC.CLIP existe\n');

      // Obtener columnas
      const queryColumnas = `
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND TABLE_NAME = 'CLIP'
        ORDER BY ORDINAL_POSITION
      `;

      const columnas = await odbcPool.query(queryColumnas);
      console.log('Columnas de DSEDAC.CLIP:');
      columnas.forEach((col, index) => {
        const nombre = col.COLUMN_NAME?.trim() || 'N/A';
        const tipo = col.DATA_TYPE?.trim() || 'N/A';
        const longitud = col.CHARACTER_MAXIMUM_LENGTH || '';
        const nullable = col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL';
        console.log(`${(index + 1).toString().padStart(3)}. ${nombre.padEnd(30)} ${tipo.padEnd(15)} ${longitud.toString().padStart(6)} ${nullable}`);
      });

      // Ver algunos registros de ejemplo
      console.log('\n📊 Registros de ejemplo:');
      const queryEjemplo = `SELECT * FROM DSEDAC.CLIP FETCH FIRST 3 ROWS ONLY`;
      const ejemplos = await odbcPool.query(queryEjemplo);
      console.log(JSON.stringify(ejemplos, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(err => {
        console.error(`   [${err.state}] ${err.message}`);
      });
    }
  } finally {
    process.exit(0);
  }
}

verificarTabla();
