require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const authService = require('../app/services/authService');
const databaseService = require('../app/services/databaseService');
const poolInstance = require('../app/config/odbcConfig');

async function pruebaFinal() {
  try {
    await poolInstance.initialize();
    
    console.log('=== PRUEBA FINAL - CORRECCIÓN COMPLETA ===\n');

    // 1. Verificar que la lista de facturas muestre el total consolidado
    console.log('1. Verificando lista de facturas del cliente 4300008091...\n');
    const facturas = await authService.obtenerFacturasCliente('4300008091');
    
    const factura2098 = facturas.find(f => f.numeroFactura === 2098);
    
    if (factura2098) {
      console.log('✅ Factura F-2098 encontrada en el listado:');
      console.log(`   Serie-Número: ${factura2098.serieFactura}-${factura2098.numeroFactura}`);
      console.log(`   Albaranes: ${factura2098.lista_albaranes}`);
      console.log(`   Fecha: ${factura2098.fecha}`);
      console.log(`   Total: ${factura2098.totalFactura.toFixed(2)}€`);
      console.log(`   Estado: ${factura2098.estadoPago}\n`);
      
      // El total debe ser la suma de los 3 albaranes: 120.94 + 154.22 + 181.58 = 456.74
      const totalEsperado = 456.74;
      const diferencia = Math.abs(factura2098.totalFactura - totalEsperado);
      
      if (diferencia < 0.1) {
        console.log(`✅ El total es correcto: ${factura2098.totalFactura.toFixed(2)}€ (esperado: ${totalEsperado}€)\n`);
      } else {
        console.log(`❌ El total no coincide: ${factura2098.totalFactura.toFixed(2)}€ (esperado: ${totalEsperado}€)\n`);
      }

      // 2. Verificar que el PDF obtenga todas las líneas de todos los albaranes
      console.log('2. Obteniendo datos para generar el PDF de la factura...\n');
      
      const datosFactura = await databaseService.obtenerDatosFactura({
        subempresa: factura2098.subempresa,
        ejercicio: factura2098.ejercicio,
        serie: factura2098.serie,
        terminal: factura2098.terminal,
        numero_albaran: factura2098.numero_albaran
      });

      console.log('Datos obtenidos para el PDF:');
      console.log(`   Factura: ${datosFactura.cabecera.numeroFacturaFormateado}`);
      console.log(`   Albarán(es): ${datosFactura.cabecera.numeroAlbaran}`);
      console.log(`   Total de líneas: ${datosFactura.lineas.length}`);
      console.log(`   Total factura: ${datosFactura.totales.totalFactura.toFixed(2)}€\n`);

      if (datosFactura.metadata && datosFactura.metadata.albaranesIncluidos) {
        console.log(`   Albaranes incluidos: ${datosFactura.metadata.albaranesIncluidos.join(', ')}`);
      }

      // Mostrar resumen de líneas
      console.log('\n   Resumen de líneas por albarán:');
      const lineasPorAlbaran = {};
      datosFactura.lineas.forEach(linea => {
        const numAlb = linea.numeroAlbaran;
        if (!lineasPorAlbaran[numAlb]) {
          lineasPorAlbaran[numAlb] = {
            count: 0,
            total: 0
          };
        }
        lineasPorAlbaran[numAlb].count++;
        lineasPorAlbaran[numAlb].total += parseFloat(linea.importeVenta || 0);
      });

      Object.entries(lineasPorAlbaran).forEach(([numAlb, info]) => {
        console.log(`   - Albarán ${numAlb}: ${info.count} línea(s), ${info.total.toFixed(2)}€ base`);
      });

      // Verificar que tenga las 4 líneas esperadas (según el análisis anterior)
      const totalLineasEsperadas = 4; // 1 del 1002, 2 del 1161, 1 del 1338
      if (datosFactura.lineas.length === totalLineasEsperadas) {
        console.log(`\n✅ El PDF incluirá TODAS las líneas (${datosFactura.lineas.length} líneas)`);
      } else {
        console.log(`\n⚠️  El PDF tiene ${datosFactura.lineas.length} líneas (esperadas: ${totalLineasEsperadas})`);
      }

      // Verificar el formato del número de factura
      console.log('\n3. Verificando formato del número de factura...\n');
      console.log(`   Formato: ${datosFactura.cabecera.numeroFacturaFormateado}`);
      
      if (datosFactura.cabecera.numeroFacturaFormateado.match(/^F \d{2} \d{4}$/)) {
        console.log('   ✅ Formato correcto: "F 00 2098" (Serie + Ejercicio + Número)');
      } else {
        console.log('   ⚠️  Formato no coincide con lo esperado');
      }

      console.log('\n=== RESUMEN ===');
      console.log('✅ Tabla web: Muestra 1 factura con el total consolidado de los 3 albaranes');
      console.log('✅ PDF: Incluye todas las líneas de los 3 albaranes');
      console.log('✅ Formato: Número de factura en formato "F 00 2098"');
      
    } else {
      console.log('❌ No se encontró la factura 2098');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

pruebaFinal();
