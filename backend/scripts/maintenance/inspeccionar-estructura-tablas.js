/**
 * SCRIPT PARA INSPECCIONAR ESTRUCTURA DE TABLAS
 * ===============================================
 * Obtiene todas las columnas de las tablas principales
 */

require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function inspeccionarTablas() {
  try {
    console.log('🔍 Inspeccionando estructura de tablas...\n');

    const tablas = [
      { schema: 'DSEDAC', tabla: 'LAC', descripcion: 'Líneas de factura' },
      { schema: 'DSEDAC', tabla: 'CAC', descripcion: 'Cabecera de factura' },
      { schema: 'DSEDAC', tabla: 'CLI', descripcion: 'Clientes' },
      { schema: 'DSEDAC', tabla: 'CCC', descripcion: 'Cobros/Vencimientos' },
      { schema: 'DSEDAC', tabla: 'ART', descripcion: 'Artículos' },
      { schema: 'DSEDAC', tabla: 'PED', descripcion: 'Pedidos' }
    ];

    for (const { schema, tabla, descripcion } of tablas) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📋 TABLA: ${schema}.${tabla} - ${descripcion}`);
      console.log('='.repeat(80));

      try {
        // Query para obtener información de columnas
        const query = `
          SELECT
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            NUMERIC_PRECISION,
            IS_NULLABLE
          FROM QSYS2.SYSCOLUMNS
          WHERE TABLE_SCHEMA = '${schema}'
            AND TABLE_NAME = '${tabla}'
          ORDER BY ORDINAL_POSITION
        `;

        const columnas = await odbcPool.query(query);

        if (columnas && columnas.length > 0) {
          console.log(`\n✅ Encontradas ${columnas.length} columnas:\n`);

          columnas.forEach((col, index) => {
            const nombre = col.COLUMN_NAME?.trim() || 'N/A';
            const tipo = col.DATA_TYPE?.trim() || 'N/A';
            const longitud = col.CHARACTER_MAXIMUM_LENGTH || col.NUMERIC_PRECISION || '';
            const nullable = col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL';

            console.log(`${(index + 1).toString().padStart(3)}. ${nombre.padEnd(30)} ${tipo.padEnd(15)} ${longitud.toString().padStart(6)} ${nullable}`);
          });

          // Buscar columnas con "DES", "DESC" o "DESCRIPCION"
          const columnasDescripcion = columnas.filter(col => {
            const nombre = col.COLUMN_NAME?.trim() || '';
            return nombre.includes('DES') || nombre.includes('DESC') || nombre.includes('DESCRIPCION');
          });

          if (columnasDescripcion.length > 0) {
            console.log(`\n🔍 Columnas de descripción encontradas:`);
            columnasDescripcion.forEach(col => {
              console.log(`   - ${col.COLUMN_NAME?.trim()}`);
            });
          }

        } else {
          console.log('⚠️  No se encontraron columnas (puede que la tabla no exista)');
        }

      } catch (error) {
        console.error(`❌ Error inspeccionando ${schema}.${tabla}:`, error.message);
        if (error.odbcErrors) {
          error.odbcErrors.forEach(err => {
            console.error(`   [${err.state}] ${err.message}`);
          });
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Inspección completada');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
inspeccionarTablas();
