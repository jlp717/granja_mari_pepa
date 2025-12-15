/**
 * SCRIPT DE INVESTIGACIÓN: Factura F 80 4287
 * ============================================
 * Cliente: 4300032778 (COMEDOR UNIVERSITARIO)
 * Objetivo: Ver datos REALES de BD y comparar con formato esperado
 */

const odbcPool = require('./app/config/odbcConfig');
const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const fs = require('fs');
const path = require('path');

async function investigarFactura() {
  try {
    console.log('🔍 INVESTIGACIÓN: Factura F 80 4287\n');
    console.log('═'.repeat(80));

    const codigoCliente = '4300032778';
    const serie = 'F';
    const numero = 4287;
    const ejercicio = 2025;

    // 1. Obtener detalle completo
    console.log(`\n📊 PASO 1: Obtener datos de BD...\n`);

    const factura = await databaseService.getInvoiceDetail(
      serie, numero, ejercicio, codigoCliente
    );

    // 2. Mostrar cabecera
    console.log('CABECERA DE FACTURA:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(factura.header, null, 2));

    // 3. Mostrar líneas con análisis detallado
    console.log('\n📋 LÍNEAS DE PRODUCTOS:');
    console.log('─'.repeat(80));

    factura.lines.forEach((line, idx) => {
      console.log(`\n[Línea ${idx + 1}]`);
      console.log(`  Lote:           ${line.LOTE || 'N/A'}`);
      console.log(`  Referencia:     ${line.CODIGOARTICULO}`);
      console.log(`  Descripción:    ${line.DESCRIPCIONARTICULO}`);
      console.log(`  Número Cajas:   ${line.NUMEROCAJAS}`);
      console.log(`  Cantidad:       ${line.CANTIDADARTICULO}`);
      console.log(`  Precio:         ${line.PRECIOARTICULO} €`);
      console.log(`  % Descuento:    ${line.PORCENTAJEDESCUENTOARTICULO}%`);
      console.log(`  % IVA:          ${line.PORCENTAJEIVAARTICULO}%`);
      console.log(`  Importe Neto:   ${line.IMPORTENETOARTICULO} €`);

      // Verificar cálculo
      const importeCalculado = line.CANTIDADARTICULO * line.PRECIOARTICULO;
      const diferencia = Math.abs(importeCalculado - line.IMPORTENETOARTICULO);

      console.log(`\n  [Verificación de cálculo]`);
      console.log(`  Cantidad × Precio = ${line.CANTIDADARTICULO} × ${line.PRECIOARTICULO} = ${importeCalculado.toFixed(2)}`);
      console.log(`  Importe Real:       ${line.IMPORTENETOARTICULO.toFixed(2)} €`);
      console.log(`  Diferencia:         ${diferencia.toFixed(2)} €${diferencia > 0.01 ? ' ⚠️ DISCREPANCIA' : ' ✅'}`);
    });

    // 4. Calcular totales
    console.log('\n💰 TOTALES:');
    console.log('─'.repeat(80));

    const totalBase = factura.header.BASEFACTURA || 0;
    const totalIVA = factura.header.IVAFACTURA || 0;
    const totalRecargo = factura.header.RECARGOFACTURA || 0;
    const totalFactura = factura.header.TOTALFACTURA || 0;

    console.log(`  Base Imponible:  ${totalBase.toFixed(2)} €`);
    console.log(`  IVA:             ${totalIVA.toFixed(2)} €`);
    console.log(`  Recargo:         ${totalRecargo.toFixed(2)} €`);
    console.log(`  TOTAL:           ${totalFactura.toFixed(2)} €`);

    // Comparar con totales esperados
    const baseEsperada = 326.47;
    const ivaEsperado = 29.58;
    const totalEsperado = 356.05;

    console.log(`\n  [Comparación con totales esperados]`);
    console.log(`  Base esperada:   ${baseEsperada} € ${Math.abs(totalBase - baseEsperada) < 0.01 ? '✅' : '❌ Dif: ' + (totalBase - baseEsperada).toFixed(2)}`);
    console.log(`  IVA esperado:    ${ivaEsperado} € ${Math.abs(totalIVA - ivaEsperado) < 0.01 ? '✅' : '❌ Dif: ' + (totalIVA - ivaEsperado).toFixed(2)}`);
    console.log(`  Total esperado:  ${totalEsperado} € ${Math.abs(totalFactura - totalEsperado) < 0.01 ? '✅' : '❌ Dif: ' + (totalFactura - totalEsperado).toFixed(2)}`);

    // 5. Generar PDF y guardarlo
    console.log('\n📄 PASO 2: Generar PDF...\n');

    const pdfBuffer = await pdfService.generateInvoicePDF(factura);
    const outputPath = path.join(__dirname, 'factura-F-80-4287-GENERADA.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado: ${outputPath}\n`);

    // 6. Información adicional
    console.log('📌 SIGUIENTE PASO:');
    console.log('─'.repeat(80));
    console.log('Comparar el PDF generado con el formato correcto proporcionado:');
    console.log('');
    console.log('FORMATO ESPERADO:');
    console.log('  Cajas:     "20,48.000" (formato especial con coma y punto)');
    console.log('  Uds/Kgs:   "5,1.500" (formato especial)');
    console.log('  Precio:    "5,1.500" (formato especial)');
    console.log('  % Dto:     Alineado a la derecha (no centrado)');
    console.log('  IVA:       Alineado a la derecha (no centrado)');
    console.log('');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
investigarFactura();
