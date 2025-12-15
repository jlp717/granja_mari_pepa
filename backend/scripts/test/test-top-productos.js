/**
 * TEST DE TOP PRODUCTOS
 * ======================
 * Prueba la función getClientProducts después de la corrección
 */

require('dotenv').config();
const databaseService = require('../../app/services/databaseService');

async function testTopProductos() {
  try {
    console.log('🧪 Probando getClientProducts...\n');

    const codigoCliente = '4300009900';
    console.log(`Cliente: ${codigoCliente}`);
    console.log('Límite: 10 productos\n');

    const productos = await databaseService.getClientProducts(codigoCliente, 10);

    if (productos && productos.length > 0) {
      console.log('✅ Función ejecutada correctamente');
      console.log(`📦 Productos obtenidos: ${productos.length}\n`);

      console.log('Primeros 5 productos:');
      console.log('='.repeat(100));
      productos.slice(0, 5).forEach((p, index) => {
        console.log(`\n${index + 1}. Código: ${p.CODIGOARTICULO}`);
        console.log(`   Descripción: ${p.DESCRIPCION}`);
        console.log(`   Precio promedio: ${p.PRECIOPROMEDIO}`);
        console.log(`   Cantidad total: ${p.CANTIDADTOTAL}`);
        console.log(`   Núm. facturas: ${p.NUMEROFACTURAS}`);
        console.log(`   Última compra: ${p.ULTIMACOMPRA}`);
      });

      console.log('\n' + '='.repeat(100));
    } else {
      console.log('⚠️  No se encontraron productos para este cliente');
    }

  } catch (error) {
    console.error('❌ Error ejecutando test:', error.message);
    if (error.odbcErrors) {
      console.error('\nErrores ODBC:');
      error.odbcErrors.forEach(err => {
        console.error(`  [${err.state}] ${err.message}`);
      });
    }
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    process.exit(0);
  }
}

testTopProductos();
