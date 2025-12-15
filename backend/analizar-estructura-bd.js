/**
 * SCRIPT DE ANÁLISIS DE ESTRUCTURA DE BASE DE DATOS
 * ===================================================
 * Analiza todas las tablas y columnas de la BD para reconstruir el código
 */

require('dotenv').config();
const odbc = require('odbc');

async function analizarBaseDatos() {
  let connection;
  
  try {
    console.log('🔍 Conectando a GMP...');
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER');
    console.log('✅ Conectado exitosamente\n');
    
    // Obtener lista de tablas
    console.log('📋 TABLAS DISPONIBLES:');
    console.log('='.repeat(80));
    
    const tables = await connection.tables(null, null, null, 'TABLE');
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\n📊 Tabla: ${tableName}`);
      console.log('-'.repeat(80));
      
      try {
        // Obtener columnas de la tabla
        const columns = await connection.columns(null, null, tableName, null);
        
        console.log('Columnas:');
        for (const col of columns) {
          console.log(`  - ${col.COLUMN_NAME} (${col.TYPE_NAME}${col.COLUMN_SIZE ? `(${col.COLUMN_SIZE})` : ''}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        }
        
        // Intentar obtener un registro de ejemplo (solo primeras 3 columnas)
        try {
          const sample = await connection.query(`SELECT TOP 1 * FROM ${tableName}`);
          if (sample.length > 0) {
            console.log('\nEjemplo de datos:');
            const firstRow = sample[0];
            let count = 0;
            for (const [key, value] of Object.entries(firstRow)) {
              if (count < 5) {
                console.log(`  ${key}: ${value}`);
                count++;
              }
            }
            if (Object.keys(firstRow).length > 5) {
              console.log(`  ... (${Object.keys(firstRow).length - 5} columnas más)`);
            }
          }
        } catch (err) {
          console.log('  (No se pudo obtener datos de ejemplo)');
        }
        
      } catch (err) {
        console.log(`  Error obteniendo columnas: ${err.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Total de tablas: ${tables.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error(`  - ${e.message}`));
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔒 Conexión cerrada');
    }
  }
}

analizarBaseDatos();
