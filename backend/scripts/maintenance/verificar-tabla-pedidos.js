/**
 * SCRIPT PARA VERIFICAR TABLA DE PEDIDOS
 * ========================================
 * Verifica si la tabla HLPC_BK1 existe y sus columnas
 */

require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function verificarTabla() {
  try {
    console.log('🔍 Verificando tabla HLPC_BK1 para pedidos...\n');

    // Buscar la tabla en diferentes esquemas
    const queryBuscar = `
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME LIKE '%HLP%' OR TABLE_NAME LIKE '%PED%'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

    const tablas = await odbcPool.query(queryBuscar);

    console.log('📋 Tablas encontradas relacionadas con pedidos:');
    if (tablas.length === 0) {
      console.log('  ⚠️ No se encontraron tablas');
    } else {
      tablas.forEach(t => {
        console.log(`  - ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
      });
    }

    // Intentar consultar HLPC_BK1 directamente
    console.log('\n🔍 Intentando consultar HLPC_BK1 directamente...');
    try {
      const queryTest = `SELECT * FROM HLPC_BK1 FETCH FIRST 1 ROWS ONLY`;
      const resultado = await odbcPool.query(queryTest);
      console.log('✅ La tabla HLPC_BK1 existe y es accesible');
      console.log('Columnas disponibles:', Object.keys(resultado[0] || {}));
    } catch (error) {
      console.log('❌ Error accediendo a HLPC_BK1:', error.message);
      if (error.odbcErrors) {
        error.odbcErrors.forEach(err => {
          console.log(`   [${err.state}] ${err.message}`);
        });
      }
    }

    // Intentar con esquema DSEDAC
    console.log('\n🔍 Intentando con DSEDAC.HLPC_BK1...');
    try {
      const queryTest = `SELECT * FROM DSEDAC.HLPC_BK1 FETCH FIRST 1 ROWS ONLY`;
      const resultado = await odbcPool.query(queryTest);
      console.log('✅ La tabla DSEDAC.HLPC_BK1 existe y es accesible');
      console.log('Columnas disponibles:', Object.keys(resultado[0] || {}));
    } catch (error) {
      console.log('❌ Error accediendo a DSEDAC.HLPC_BK1:', error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
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
