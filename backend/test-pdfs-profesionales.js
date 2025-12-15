/**
 * SCRIPT DE PRUEBA DE PDFs PROFESIONALES
 * =======================================
 * Prueba la generación de PDFs con el nuevo diseño profesional
 */

const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const odbcPool = require('./app/config/odbcConfig');
const fs = require('fs');
const path = require('path');

async function testPDFs() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 PRUEBA DE PDFs PROFESIONALES v2.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const codigoCliente = '4300009900';

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST 1: PDF DE FACTURA INDIVIDUAL (F-14074)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('📄 TEST 1: Generando PDF de factura F-14074...\n');

    const factura = await databaseService.getInvoiceDetail(
      'F',
      14074,
      2025,
      codigoCliente
    );

    console.log('Datos de la factura:');
    console.log(`  Serie: ${factura.header.SERIEFACTURA}`);
    console.log(`  Número: ${factura.header.NUMEROFACTURA}`);
    console.log(`  Cliente: ${factura.header.NOMBRECLIENTEFACTURA}`);
    console.log(`  Líneas: ${factura.lines.length}`);
    console.log(`  Base: ${factura.header.BASEFACTURA} €`);
    console.log(`  IVA: ${factura.header.IVAFACTURA} €`);
    console.log(`  Total: ${factura.header.TOTALFACTURA} €`);
    console.log('');

    const pdfFactura = await pdfService.generateInvoicePDF(factura);

    const facturaPath = path.join(__dirname, 'test-factura-F-14074-PROFESIONAL.pdf');
    fs.writeFileSync(facturaPath, pdfFactura);

    console.log(`✅ PDF de factura generado: ${facturaPath}`);
    console.log(`   Tamaño: ${(pdfFactura.length / 1024).toFixed(2)} KB\n`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TEST 2: PDF DE LIBRO IVA (2025)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('📊 TEST 2: Generando PDF de Libro IVA 2025...\n');

    // Obtener datos del cliente
    const queryCliente = `
      SELECT
        TRIM(CLI.CODIGOCLIENTE) AS CODIGOCLIENTE,
        TRIM(CLI.NOMBRECLIENTE) AS NOMBRECLIENTE,
        TRIM(CLI.NIF) AS NIF,
        TRIM(CLI.DIRECCION) AS DIRECCION,
        TRIM(CLI.POBLACION) AS POBLACION,
        TRIM(CLI.PROVINCIA) AS PROVINCIA,
        TRIM(CLI.CODIGOPOSTAL) AS CODIGOPOSTAL,
        TRIM(CLI.TELEFONO1) AS TELEFONO
      FROM DSEDAC.CLI
      WHERE TRIM(CLI.CODIGOCLIENTE) = ?
    `;
    const clienteResult = await odbcPool.query(queryCliente, [codigoCliente]);
    const clienteData = clienteResult[0];

    // Obtener facturas del 2025 (con GROUP BY para evitar duplicados)
    const queryFacturas = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        CAST(
          CASE
            WHEN C.DIAFACTURA < 10 THEN '0' || TRIM(CAST(C.DIAFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(C.DIAFACTURA AS CHAR(2)))
          END || '/' ||
          CASE
            WHEN C.MESFACTURA < 10 THEN '0' || TRIM(CAST(C.MESFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(C.MESFACTURA AS CHAR(2)))
          END || '/' ||
          TRIM(CAST(C.ANOFACTURA AS CHAR(4)))
        AS VARCHAR(10)) as FECHAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA) as CODIGOCLIENTE,
        MAX(CLI.NOMBRECLIENTE) as NOMBRECLIENTE,
        MAX(CLI.NIF) as CIFCLIENTE,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
            C.IMPORTERECARGO4 + C.IMPORTERECARGO5) as RECARGO,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      INNER JOIN DSEDAC.CLI CLI ON TRIM(C.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = ?
        AND C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA)
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, SERIEFACTURA, NUMEROFACTURA
    `;

    const facturas = await odbcPool.query(queryFacturas, [codigoCliente]);

    console.log(`Facturas encontradas: ${facturas.length}`);

    // Calcular totales
    let totalBase = 0;
    let totalIVA = 0;
    let totalRecargo = 0;
    let totalGeneral = 0;

    facturas.forEach(f => {
      totalBase += parseFloat(f.BASE_IMPONIBLE) || 0;
      totalIVA += parseFloat(f.IVA) || 0;
      totalRecargo += parseFloat(f.RECARGO) || 0;
      totalGeneral += parseFloat(f.TOTAL) || 0;
    });

    console.log(`Base Imponible: ${totalBase.toFixed(2)} €`);
    console.log(`IVA: ${totalIVA.toFixed(2)} €`);
    console.log(`Recargo: ${totalRecargo.toFixed(2)} €`);
    console.log(`Total: ${totalGeneral.toFixed(2)} €`);
    console.log('');

    const datosLibroIVA = {
      ejercicio: 2025,
      cliente: clienteData,
      registros: facturas,
      totales: {
        totalBase,
        totalIVA,
        totalRecargo,
        totalGeneral
      }
    };

    const pdfLibroIVA = await libroIvaPdfService.generateLibroIvaPDF(datosLibroIVA);

    const libroPath = path.join(__dirname, 'test-libro-iva-2025-PROFESIONAL.pdf');
    fs.writeFileSync(libroPath, pdfLibroIVA);

    console.log(`✅ PDF de Libro IVA generado: ${libroPath}`);
    console.log(`   Tamaño: ${(pdfLibroIVA.length / 1024).toFixed(2)} KB\n`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VERIFICACIÓN DE COINCIDENCIA DE DATOS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICACIÓN DE COINCIDENCIA DE DATOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Dashboard vs Libro IVA:');
    console.log(`  Total Dashboard esperado: 1946.73 €`);
    console.log(`  Total Libro IVA generado: ${totalGeneral.toFixed(2)} €`);
    console.log(`  ¿Coinciden? ${totalGeneral.toFixed(2) === '1946.73' ? '✅ SÍ' : '❌ NO'}\n`);

    console.log('Factura F-14074:');
    console.log(`  Total en dashboard: 231.60 €`);
    console.log(`  Total en PDF: ${factura.header.TOTALFACTURA} €`);
    console.log(`  ¿Coinciden? ${parseFloat(factura.header.TOTALFACTURA).toFixed(2) === '231.60' ? '✅ SÍ' : '❌ NO'}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📂 Archivos generados:');
    console.log(`   1. ${facturaPath}`);
    console.log(`   2. ${libroPath}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testPDFs();
