require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const authService = require('../app/services/authService');
const databaseService = require('../app/services/databaseService');
const poolInstance = require('../app/config/odbcConfig');

async function verificarTotalesYRecargos() {
  try {
    await poolInstance.initialize();
    
    console.log('=== VERIFICACIÓN FINAL: TOTALES CON RECARGO ===\n');

    // 1. Cliente 4300008091 - Factura 2098
    console.log('1. FACTURA F-2098 (Cliente 4300008091)\n');
    
    const facturas = await authService.obtenerFacturasCliente('4300008091');
    const factura2098 = facturas.find(f => f.numeroFactura === 2098);
    
    if (factura2098) {
      console.log('TABLA WEB:');
      console.log(`  Total: ${factura2098.totalFactura.toFixed(2)}€`);
      
      const datosFactura = await databaseService.obtenerDatosFactura({
        subempresa: factura2098.subempresa,
        ejercicio: factura2098.ejercicio,
        serie: factura2098.serie,
        terminal: factura2098.terminal,
        numero_albaran: factura2098.numero_albaran
      });

      console.log('\nDATOS PARA PDF:');
      console.log(`  Número: ${datosFactura.cabecera.numeroFacturaFormateado}`);
      console.log(`  Albaranes: ${datosFactura.metadata.albaranesIncluidos.join(', ')}`);
      
      console.log('\nTOTALES:');
      console.log(`  Base imponible: ${datosFactura.totales.totalBaseImponible.toFixed(2)}€`);
      
      // Mostrar desgloses de IVA
      console.log('\nDESGLOSE DE IVA:');
      datosFactura.totales.desglosesIVA.forEach(desglose => {
        console.log(`  IVA ${desglose.porcentajeIVA}%:`);
        console.log(`    Base:    ${desglose.baseImponible.toFixed(2)}€`);
        console.log(`    IVA:     ${desglose.importeIVA.toFixed(2)}€`);
        if (desglose.porcentajeRecargo > 0 || desglose.importeRecargo > 0) {
          console.log(`    Recargo ${desglose.porcentajeRecargo}%: ${desglose.importeRecargo.toFixed(2)}€`);
        }
      });
      
      console.log(`\n  TOTAL FACTURA: ${datosFactura.totales.totalFactura.toFixed(2)}€`);
      
      // Validación
      const diferencia = Math.abs(factura2098.totalFactura - datosFactura.totales.totalFactura);
      console.log('\nVERIFICACIÓN:');
      if (diferencia < 0.01) {
        console.log(`  ✅ Totales coinciden: ${datosFactura.totales.totalFactura.toFixed(2)}€`);
      } else {
        console.log(`  ❌ Diferencia: ${diferencia.toFixed(2)}€`);
      }
      
      // Verificar que la suma manual coincide
      const baseTotal = datosFactura.totales.totalBaseImponible;
      const ivaTotal = datosFactura.totales.desglosesIVA.reduce((sum, d) => sum + d.importeIVA, 0);
      const recargoTotal = datosFactura.totales.desglosesIVA.reduce((sum, d) => sum + d.importeRecargo, 0);
      const sumaManual = baseTotal + ivaTotal + recargoTotal;
      
      console.log('\nVERIFICACIÓN MANUAL:');
      console.log(`  Base:    ${baseTotal.toFixed(2)}€`);
      console.log(`  + IVA:   ${ivaTotal.toFixed(2)}€`);
      console.log(`  + Recargo: ${recargoTotal.toFixed(2)}€`);
      console.log(`  = Total: ${sumaManual.toFixed(2)}€`);
      console.log(`  Esperado: ${datosFactura.totales.totalFactura.toFixed(2)}€`);
      
      if (Math.abs(sumaManual - datosFactura.totales.totalFactura) < 0.01) {
        console.log('  ✅ La suma cuadra perfectamente');
      } else {
        console.log(`  ⚠️  Diferencia de ${Math.abs(sumaManual - datosFactura.totales.totalFactura).toFixed(2)}€`);
      }
    }

    console.log('\n=== CONCLUSIÓN ===');
    console.log('Si el recargo aparece en el desglose, el PDF mostrará:');
    console.log('  Base imponible: 410,00€');
    console.log('  IVA 10%: 41,00€');
    console.log('  Recargo 1,4%: 5,74€');
    console.log('  TOTAL: 456,74€');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

verificarTotalesYRecargos();
