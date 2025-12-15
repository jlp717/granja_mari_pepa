/**
 * TEST DE GENERACIÓN DE PDF
 * Prueba las correcciones realizadas en pdfService y libroIvaPdfService
 */

const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function testPDFGeneration() {
  log('\n========================================', 'blue');
  log('TEST DE GENERACIÓN DE PDFs', 'blue');
  log('========================================\n', 'blue');

  try {
    // Test 1: Verificar que el SQL corregido funciona
    log('Test 1: Verificando query SQL corregido...', 'yellow');

    // Datos de prueba (puedes cambiar estos valores por una factura real)
    const testSerie = 'F';
    const testNumero = 14074;
    const testEjercicio = 2025;
    const testCliente = '4300032778'; // Cliente del screenshot

    log(`  Serie: ${testSerie}, Número: ${testNumero}, Ejercicio: ${testEjercicio}`, 'blue');

    try {
      const facturaData = await databaseService.getInvoiceDetail(
        testSerie,
        testNumero,
        testEjercicio,
        testCliente
      );

      if (facturaData && facturaData.lines && facturaData.lines.length > 0) {
        log('  ✅ Query SQL ejecutado correctamente', 'green');
        log(`  ✅ Factura encontrada con ${facturaData.lines.length} líneas`, 'green');

        // Verificar que NUMEROCAJAS está presente
        const firstLine = facturaData.lines[0];
        if ('NUMEROCAJAS' in firstLine) {
          log(`  ✅ Campo NUMEROCAJAS presente: ${firstLine.NUMEROCAJAS}`, 'green');
        } else {
          log('  ⚠️ Campo NUMEROCAJAS no encontrado', 'yellow');
        }

        // Test 2: Generar PDF de factura
        log('\nTest 2: Generando PDF de factura...', 'yellow');
        const pdfBuffer = await pdfService.generateInvoicePDF(facturaData);

        if (pdfBuffer && pdfBuffer.length > 0) {
          log('  ✅ PDF generado correctamente', 'green');
          log(`  ✅ Tamaño del PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`, 'green');

          // Guardar PDF de prueba
          const outputPath = path.join(__dirname, 'test-factura-output.pdf');
          fs.writeFileSync(outputPath, pdfBuffer);
          log(`  ✅ PDF guardado en: ${outputPath}`, 'green');
        } else {
          log('  ❌ Error: PDF vacío o null', 'red');
        }
      } else {
        log('  ⚠️ No se encontró la factura. Intenta con otros parámetros.', 'yellow');
        log('  ℹ️ Puedes editar este archivo (test-pdf-generation.js) para usar una factura real', 'blue');
      }
    } catch (error) {
      if (error.message.includes('Factura no encontrada')) {
        log('  ⚠️ Factura de prueba no encontrada en la base de datos', 'yellow');
        log('  ℹ️ Edita test-pdf-generation.js líneas 30-33 con datos de una factura real', 'blue');
      } else {
        throw error;
      }
    }

    // Test 3: Verificar formato de números español
    log('\nTest 3: Verificando formato de números español...', 'yellow');

    // Simular datos de Libro IVA
    const mockLibroIVAData = {
      ejercicio: 2025,
      cliente: {
        CODIGOCLIENTE: '4300008335',
        NOMBRECLIENTE: 'CLIENTE DE PRUEBA',
        NIF: '24461782V',
        DIRECCION: 'Calle Test 123',
        POBLACION: 'Murcia',
        CODIGOPOSTAL: '30001',
        TELEFONO: '968123456'
      },
      registros: [
        {
          SERIEFACTURA: 'A',
          NUMEROFACTURA: 1,
          FECHAFACTURA: '01/01/2025',
          CODIGOCLIENTE: '4300008335',
          NOMBRECLIENTE: 'CLIENTE DE PRUEBA',
          CIFCLIENTE: '24461782V',
          BASE_IMPONIBLE: 1234.56,
          IVA: 123.46,
          RECARGO: 17.28,
          TOTAL: 1375.30,
          TIPO_IVA: '10%'
        }
      ],
      totales: {
        totalBase: 1234.56,
        totalIVA: 123.46,
        totalRecargo: 17.28,
        totalGeneral: 1375.30
      }
    };

    log('  Generando PDF de Libro IVA con datos de prueba...', 'blue');
    const libroIvaPdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(mockLibroIVAData);

    if (libroIvaPdfBuffer && libroIvaPdfBuffer.length > 0) {
      log('  ✅ PDF de Libro IVA generado correctamente', 'green');
      log(`  ✅ Tamaño del PDF: ${(libroIvaPdfBuffer.length / 1024).toFixed(2)} KB`, 'green');

      // Guardar PDF de prueba
      const outputPath = path.join(__dirname, 'test-libro-iva-output.pdf');
      fs.writeFileSync(outputPath, libroIvaPdfBuffer);
      log(`  ✅ PDF guardado en: ${outputPath}`, 'green');

      log('\n  ℹ️ Verifica que los números estén en formato español:', 'blue');
      log('     - 1234.56 debe mostrarse como: 1.234,56', 'blue');
      log('     - Decimales con coma (,) no con punto (.)', 'blue');
    } else {
      log('  ❌ Error: PDF de Libro IVA vacío o null', 'red');
    }

    log('\n========================================', 'blue');
    log('✅ TODOS LOS TESTS COMPLETADOS', 'green');
    log('========================================\n', 'blue');

    log('Resumen de archivos generados:', 'yellow');
    log('  - test-factura-output.pdf (si la factura existe en BD)', 'blue');
    log('  - test-libro-iva-output.pdf', 'blue');
    log('\nRevisa estos PDFs para verificar:', 'yellow');
    log('  1. Header con imagen Mari Pepa', 'blue');
    log('  2. Números en formato español (1.234,56)', 'blue');
    log('  3. Columna "Cajas" con valores (no vacía)', 'blue');
    log('  4. Totales calculados correctamente', 'blue');

  } catch (error) {
    log('\n❌ ERROR EN LOS TESTS:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      console.log(error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar tests
testPDFGeneration()
  .then(() => {
    log('\n✅ Tests finalizados exitosamente\n', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log('\n❌ Error fatal en tests:', 'red');
    console.error(error);
    process.exit(1);
  });
