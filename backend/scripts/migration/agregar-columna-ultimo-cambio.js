/**
 * Script para agregar columna ULTIMO_CAMBIO_PASSWORD
 * a la tabla JAVIER.CUSTOMER_CREDENTIALS
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../app/config/odbcConfig');

async function agregarColumna() {
  let connection;
  
  try {
    console.log('='.repeat(60));
    console.log('AGREGANDO COLUMNA ULTIMO_CAMBIO_PASSWORD');
    console.log('='.repeat(60));
    
    await pool.initialize();
    connection = await pool.acquire();
    
    // Verificar si la columna ya existe
    const verificacion = await connection.query(`
      SELECT COUNT(*) as EXISTE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER'
        AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
        AND COLUMN_NAME = 'ULTIMO_CAMBIO_PASSWORD'
    `);
    
    if (verificacion[0].EXISTE > 0) {
      console.log('✅ La columna ULTIMO_CAMBIO_PASSWORD ya existe');
      return;
    }
    
    // Agregar la columna
    console.log('Agregando columna ULTIMO_CAMBIO_PASSWORD...');
    await connection.query(`
      ALTER TABLE JAVIER.CUSTOMER_CREDENTIALS
      ADD COLUMN ULTIMO_CAMBIO_PASSWORD TIMESTAMP DEFAULT NULL
    `);
    
    console.log('✅ Columna ULTIMO_CAMBIO_PASSWORD agregada exitosamente');
    
    // Inicializar con FECHA_MODIFICACION para registros existentes
    console.log('Inicializando valores para registros existentes...');
    await connection.query(`
      UPDATE JAVIER.CUSTOMER_CREDENTIALS
      SET ULTIMO_CAMBIO_PASSWORD = FECHA_MODIFICACION
      WHERE ULTIMO_CAMBIO_PASSWORD IS NULL
    `);
    
    console.log('✅ Valores inicializados');
    
    // Verificar
    const resultado = await connection.query(`
      SELECT 
        TRIM(CODIGO_CLIENTE) as CODIGO_CLIENTE,
        PASSWORD_TYPE,
        FECHA_MODIFICACION,
        ULTIMO_CAMBIO_PASSWORD
      FROM JAVIER.CUSTOMER_CREDENTIALS
      FETCH FIRST 5 ROWS ONLY
    `);
    
    console.log('\nRegistros actualizados:');
    console.table(resultado);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await pool.release(connection);
    }
    await pool.close();
  }
}

agregarColumna()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
