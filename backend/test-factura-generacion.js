/**
 * SCRIPT DE PRUEBA: Generación de Factura
 * ========================================
 * Prueba la generación de PDF de factura con datos reales
 */

const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const odbcPool = require('./app/config/odbcConfig');
const logger = require('./app/utils/logger');
const fs = require('fs');
const path = require('path');

async function testFacturaGeneracion() {
  try {
    console.log('\n=== PRUEBA DE GENERACIÓN DE FACTURA ===\n');

    // Paso 1: Buscar una factura de prueba
    console.log('📋 Buscando factura de prueba...');
    const queryFactura = `
      SELECT DISTINCT
        TRIM(SERIEFACTURA) AS SERIE,
        NUMEROFACTURA AS NUMERO,
        EJERCICIOFACTURA AS EJERCICIO,
        TRIM(CODIGOCLIENTEFACTURA) AS CODIGOCLIENTE,
        ANOFACTURA,
        MESFACTURA,
        DIAFACTURA
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND ANOFACTURA >= 2025
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC
      FETCH FIRST 1 ROWS ONLY
    `;

    const facturas = await odbcPool.query(queryFactura);

    if (!facturas || facturas.length === 0) {
      console.log('❌ No se encontraron facturas de prueba');
      process.exit(1);
    }

    const factura = facturas[0];
    console.log('✅ Factura encontrada:', {
      serie: factura.SERIE,
      numero: factura.NUMERO,
      ejercicio: factura.EJERCICIO,
      cliente: factura.CODIGOCLIENTE,
      fecha: `${factura.DIAFACTURA}/${factura.MESFACTURA}/${factura.ANOFACTURA}`
    });

    // Paso 2: Obtener detalle de la factura
    console.log('\n📊 Obteniendo detalle de la factura...');
    const detalle = await databaseService.getInvoiceDetail(
      factura.SERIE,
      factura.NUMERO,
      factura.EJERCICIO,
      factura.CODIGOCLIENTE
    );

    console.log('✅ Detalle obtenido:');
    console.log('  - Cliente:', detalle.header?.NOMBRECLIENTEFACTURA);
    console.log('  - Líneas:', detalle.lines?.length || 0);
    console.log('  - Base:', detalle.header?.BASEFACTURA);
    console.log('  - IVA:', detalle.header?.IVAFACTURA);
    console.log('  - Total:', detalle.header?.TOTALFACTURA);

    // Verificar que las líneas tienen los datos de IVA y recargo
    if (detalle.lines && detalle.lines.length > 0) {
      console.log('\n📦 Detalle de líneas:');
      detalle.lines.forEach((linea, index) => {
        console.log(`  Línea ${index + 1}:`, {
          articulo: linea.CODIGOARTICULO,
          descripcion: (linea.DESCRIPCIONARTICULO || '').substring(0, 30) + '...',
          cantidad: linea.CANTIDADARTICULO,
          precio: linea.PRECIOARTICULO,
          iva: linea.PORCENTAJEIVAARTICULO,
          recargo: linea.PORCENTAJERECARGOARTICULO,
          importe: linea.IMPORTENETOARTICULO
        });
      });
    }

    // Paso 3: Generar PDF
    console.log('\n📄 Generando PDF...');
    const pdfBuffer = await pdfService.generateInvoicePDF(detalle);

    console.log('✅ PDF generado:', {
      tamaño: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
    });

    // Paso 4: Guardar PDF para inspección
    const outputPath = path.join(__dirname, `test-factura-${factura.SERIE}-${factura.NUMERO}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`\n✅ PDF guardado en: ${outputPath}`);
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE\n');

    await odbcPool.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error);
    console.error('\nStack trace:', error.stack);

    await odbcPool.close();
    process.exit(1);
  }
}

// Ejecutar prueba
testFacturaGeneracion();
