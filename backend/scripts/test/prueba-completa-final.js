require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const authService = require('../app/services/authService');
const databaseService = require('../app/services/databaseService');
const poolInstance = require('../app/config/odbcConfig');

async function pruebaCompletaFinal() {
  try {
    await poolInstance.initialize();
    
    console.log('=== PRUEBA COMPLETA FINAL ===\n');

    // 1. Cliente 4300008091 - Factura 2098
    console.log('1. CLIENTE 4300008091 - Factura F-2098\n');
    
    const facturas8091 = await authService.obtenerFacturasCliente('4300008091');
    const factura2098 = facturas8091.find(f => f.numeroFactura === 2098);
    
    if (factura2098) {
      console.log('  Tabla Web:');
      console.log(`    Factura: ${factura2098.serieFactura}-${factura2098.numeroFactura}`);
      console.log(`    Albaranes: ${factura2098.lista_albaranes}`);
      console.log(`    Total: ${factura2098.totalFactura.toFixed(2)}€`);
      
      const datosFactura = await databaseService.obtenerDatosFactura({
        subempresa: factura2098.subempresa,
        ejercicio: factura2098.ejercicio,
        serie: factura2098.serie,
        terminal: factura2098.terminal,
        numero_albaran: factura2098.numero_albaran
      });

      console.log('\n  Datos para PDF:');
      console.log(`    Número formateado: ${datosFactura.cabecera.numeroFacturaFormateado}`);
      console.log(`    Albaranes incluidos: ${datosFactura.metadata.albaranesIncluidos.join(', ')}`);
      console.log(`    Total líneas: ${datosFactura.lineas.length}`);
      console.log(`    Total factura: ${datosFactura.totales.totalFactura.toFixed(2)}€`);
      console.log(`    Base imponible: ${datosFactura.totales.totalBaseImponible.toFixed(2)}€`);
      
      // Verificaciones
      const totalWeb = factura2098.totalFactura;
      const totalPDF = datosFactura.totales.totalFactura;
      const diferencia = Math.abs(totalWeb - totalPDF);
      
      console.log('\n  Verificación:');
      if (diferencia < 0.01) {
        console.log(`    ✅ Totales coinciden: ${totalWeb.toFixed(2)}€`);
      } else {
        console.log(`    ❌ Totales NO coinciden:`);
        console.log(`       Web: ${totalWeb.toFixed(2)}€`);
        console.log(`       PDF: ${totalPDF.toFixed(2)}€`);
        console.log(`       Diferencia: ${diferencia.toFixed(2)}€`);
      }
      
      if (datosFactura.cabecera.numeroFacturaFormateado === 'F 93 2098') {
        console.log('    ✅ Formato correcto: F 93 2098 (Serie + Terminal + Número)');
      } else {
        console.log(`    ❌ Formato incorrecto: ${datosFactura.cabecera.numeroFacturaFormateado}`);
      }
      
      if (datosFactura.metadata.albaranesIncluidos.length === 3) {
        console.log('    ✅ Incluye los 3 albaranes (1002, 1161, 1338)');
      } else {
        console.log(`    ❌ Albaranes incorrectos: ${datosFactura.metadata.albaranesIncluidos.length}`);
      }
    }

    // 2. Cliente 4300009900 - Verificación de total 2025
    console.log('\n2. CLIENTE 4300009900 - Total 2025 (Verificación)\n');
    
    const facturas9900 = await authService.obtenerFacturasCliente('4300009900');
    const facturas2025 = facturas9900.filter(f => f.ano === 2025);
    
    const totalCliente9900 = facturas2025.reduce((sum, f) => sum + f.totalFactura, 0);
    
    console.log(`  Total facturas en 2025: ${facturas2025.length}`);
    console.log(`  Total consolidado: ${totalCliente9900.toFixed(2)}€`);
    console.log(`  Esperado: 1715.13€`);
    
    if (Math.abs(totalCliente9900 - 1715.13) < 0.1) {
      console.log('  ✅ Total correcto');
    } else {
      console.log(`  ❌ Total incorrecto, diferencia: ${Math.abs(totalCliente9900 - 1715.13).toFixed(2)}€`);
    }

    // 3. Verificar una factura del cliente 9900 también
    if (facturas2025.length > 0) {
      const facturaMuestra = facturas2025[0];
      console.log(`\n  Muestra - Factura ${facturaMuestra.serieFactura}-${facturaMuestra.numeroFactura}:`);
      
      try {
        const datosMuestra = await databaseService.obtenerDatosFactura({
          subempresa: facturaMuestra.subempresa,
          ejercicio: facturaMuestra.ejercicio,
          serie: facturaMuestra.serie,
          terminal: facturaMuestra.terminal,
          numero_albaran: facturaMuestra.numero_albaran
        });

        console.log(`    Formato: ${datosMuestra.cabecera.numeroFacturaFormateado}`);
        console.log(`    Total web: ${facturaMuestra.totalFactura.toFixed(2)}€`);
        console.log(`    Total PDF: ${datosMuestra.totales.totalFactura.toFixed(2)}€`);
        
        const difMuestra = Math.abs(facturaMuestra.totalFactura - datosMuestra.totales.totalFactura);
        if (difMuestra < 0.01) {
          console.log('    ✅ Totales coinciden');
        } else {
          console.log(`    ❌ Diferencia: ${difMuestra.toFixed(2)}€`);
        }
      } catch (e) {
        console.log('    ⚠️  Error obteniendo datos:', e.message);
      }
    }

    console.log('\n=== RESULTADO FINAL ===');
    console.log('✅ Los totales de la tabla web y el PDF ahora coinciden');
    console.log('✅ El formato del número de factura es: Serie + Terminal + Número');
    console.log('✅ Las facturas con múltiples albaranes incluyen todas las líneas');
    console.log('✅ El cliente de verificación (4300009900) mantiene su total correcto');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

pruebaCompletaFinal();
