/**
 * SCRIPT DE PRUEBA - CLIENTE DIEGO (9900)
 * ========================================
 * Verificar datos del cliente Diego y generar libro de IVA
 */

const odbcPool = require('./app/config/odbcConfig');
const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const fs = require('fs');
const path = require('path');

async function testClienteDiego() {
  try {
    console.log('🔍 Buscando cliente Diego (terminal en 9900)...\n');

    // Buscar cliente que termina en 9900
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
      WHERE TRIM(CLI.CODIGOCLIENTE) LIKE '%9900'
        OR TRIM(CLI.NOMBRECLIENTE) LIKE '%Diego%'
    `;

    const clientes = await odbcPool.query(queryCliente, []);

    if (!clientes || clientes.length === 0) {
      console.log('❌ No se encontró cliente Diego (9900)');
      return;
    }

    console.log(`✅ Clientes encontrados: ${clientes.length}\n`);
    clientes.forEach(c => {
      console.log(`  - ${c.CODIGOCLIENTE} - ${c.NOMBRECLIENTE}`);
    });

    const cliente = clientes[0];
    const codigoCliente = cliente.CODIGOCLIENTE;

    console.log(`\n📊 Obteniendo facturas del cliente ${codigoCliente} - ${cliente.NOMBRECLIENTE}\n`);

    // Obtener facturas de 2025 (o año actual)
    const ejercicio = 2025;
    const fechaInicioNum = ejercicio * 10000 + 101; // 20250101
    const fechaFinNum = ejercicio * 10000 + 1231;  // 20251231

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
      WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ?
        AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ?
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = ?
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        TRIM(C.CODIGOCLIENTEFACTURA)
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, SERIEFACTURA, NUMEROFACTURA
    `;

    const facturas = await odbcPool.query(queryFacturas, [fechaInicioNum, fechaFinNum, codigoCliente.trim()]);

    console.log(`✅ Facturas encontradas: ${facturas.length}\n`);

    // Calcular totales
    let totalBase = 0;
    let totalIVA = 0;
    let totalRecargo = 0;
    let totalGeneral = 0;

    console.log('📋 LISTADO DE FACTURAS:\n');
    console.log('Serie\tNúmero\tFecha\t\tBase\t\tIVA\t\tTotal');
    console.log('─'.repeat(80));

    facturas.forEach(f => {
      const base = parseFloat(f.BASE_IMPONIBLE) || 0;
      const iva = parseFloat(f.IVA) || 0;
      const recargo = parseFloat(f.RECARGO) || 0;
      const total = parseFloat(f.TOTAL) || 0;

      totalBase += base;
      totalIVA += iva;
      totalRecargo += recargo;
      totalGeneral += total;

      console.log(`${f.SERIEFACTURA}\t${f.NUMEROFACTURA}\t${f.FECHAFACTURA}\t${base.toFixed(2)}\t\t${iva.toFixed(2)}\t\t${total.toFixed(2)}`);
    });

    console.log('─'.repeat(80));
    console.log(`TOTALES:\t\t\t\t${totalBase.toFixed(2)}\t\t${totalIVA.toFixed(2)}\t\t${totalGeneral.toFixed(2)}`);

    console.log(`\n\n💰 TOTAL CON IVA: ${totalGeneral.toFixed(2)} €`);
    console.log(`📌 Esperado según el usuario: 1946,73 €\n`);

    if (Math.abs(totalGeneral - 1946.73) < 0.01) {
      console.log('✅ ¡LOS TOTALES COINCIDEN!\n');
    } else {
      console.log(`⚠️  DIFERENCIA: ${(totalGeneral - 1946.73).toFixed(2)} €\n`);
    }

    // Generar PDF del libro de IVA
    console.log('📄 Generando PDF del Libro de IVA...\n');

    const datosPDF = {
      ejercicio,
      cliente: cliente,
      registros: facturas,
      totales: {
        totalBase,
        totalIVA,
        totalRecargo,
        totalGeneral
      }
    };

    const pdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);

    const outputPath = path.join(__dirname, `test-libro-iva-${ejercicio}-${codigoCliente}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado: ${outputPath}\n`);

    // También generar una factura de prueba
    console.log('📄 Generando PDF de la primera factura...\n');

    if (facturas.length > 0) {
      const primeraFactura = facturas[0];
      const databaseService = require('./app/services/databaseService');
      const pdfService = require('./app/services/pdfService');

      const facturaDetalle = await databaseService.getInvoiceDetail(
        primeraFactura.SERIEFACTURA,
        primeraFactura.NUMEROFACTURA,
        primeraFactura.ANOFACTURA,
        codigoCliente
      );

      const facturaPdfBuffer = await pdfService.generateInvoicePDF(facturaDetalle);

      const facturaOutputPath = path.join(__dirname, `test-factura-${primeraFactura.SERIEFACTURA}-${primeraFactura.NUMEROFACTURA}.pdf`);
      fs.writeFileSync(facturaOutputPath, facturaPdfBuffer);

      console.log(`✅ Factura PDF generada: ${facturaOutputPath}\n`);
    }

    console.log('✅ PRUEBA COMPLETADA\n');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    process.exit(0);
  }
}

testClienteDiego();
