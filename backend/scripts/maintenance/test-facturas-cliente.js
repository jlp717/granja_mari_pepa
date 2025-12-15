// Script para probar la obtención de facturas de un cliente
require('dotenv').config();
const authService = require('./app/services/authService');
const pool = require('./app/config/odbcConfig');

async function testFacturasCliente() {
  console.log('\n=== TEST DE OBTENCIÓN DE FACTURAS ===\n');
  
  // Inicializar el pool primero
  console.log('Inicializando pool de conexiones...');
  await pool.initialize();
  console.log('Pool inicializado\n');
  
  const codigoCliente = '4400000300';
  
  console.log(`Obteniendo facturas del cliente: ${codigoCliente}\n`);
  
  try {
    const facturas = await authService.obtenerFacturasCliente(codigoCliente);
    
    console.log(`\n✅ Se encontraron ${facturas.length} facturas:\n`);
    
    if (facturas.length > 0) {
      console.log('Primeras 5 facturas:');
      console.log('===================');
      facturas.slice(0, 5).forEach((factura, idx) => {
        console.log(`\n${idx + 1}. Factura ${factura.numero}`);
        console.log(`   Fecha: ${factura.fecha}`);
        console.log(`   Ejercicio: ${factura.ejercicio}`);
        console.log(`   Serie: ${factura.serie}`);
        console.log(`   Terminal: ${factura.terminal}`);
        console.log(`   Total Base: €${factura.totalBase.toFixed(2)}`);
        console.log(`   Total IVA: €${factura.totalIVA.toFixed(2)}`);
        console.log(`   Total Factura: €${factura.totalFactura.toFixed(2)}`);
      });
      
      console.log('\n\nJSON de la primera factura:');
      console.log(JSON.stringify(facturas[0], null, 2));
    } else {
      console.log('⚠️  No se encontraron facturas para este cliente');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cerrar el pool
    console.log('\n\nCerrando pool...');
    await pool.close();
  }
  
  // Cerrar el proceso
  process.exit(0);
}

testFacturasCliente();
