/**
 * SCRIPT DE PRUEBA: Generación de Libro IVA
 * ===========================================
 * Prueba la generación de PDF del libro de IVA con datos reales
 */

const odbcPool = require('./app/config/odbcConfig');
const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const logger = require('./app/utils/logger');
const fs = require('fs');
const path = require('path');

async function testLibroIvaGeneracion() {
  try {
    console.log('\n=== PRUEBA DE GENERACIÓN DE LIBRO IVA ===\n');

    // Paso 1: Buscar un cliente con facturas en 2025
    console.log('📋 Buscando cliente con facturas...');
    const queryCliente = `
      SELECT DISTINCT
        TRIM(CODIGOCLIENTEFACTURA) AS CODIGOCLIENTE,
        COUNT(*) AS NUM_FACTURAS
      FROM DSEDAC.CAC
      WHERE ANOFACTURA = 2025
        AND NUMEROFACTURA > 0
      GROUP BY TRIM(CODIGOCLIENTEFACTURA)
      ORDER BY NUM_FACTURAS DESC
      FETCH FIRST 1 ROWS ONLY
    `;

    const clientes = await odbcPool.query(queryCliente);

    if (!clientes || clientes.length === 0) {
      console.log('❌ No se encontraron clientes con facturas en 2025');
      process.exit(1);
    }

    const codigoCliente = clientes[0].CODIGOCLIENTE;
    const numFacturas = clientes[0].NUM_FACTURAS;

    console.log('✅ Cliente encontrado:', {
      codigo: codigoCliente,
      facturas: numFacturas
    });

    // Paso 2: Obtener información del cliente
    console.log('\n👤 Obteniendo datos del cliente...');
    const queryClienteInfo = `
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

    const clienteInfo = await odbcPool.query(queryClienteInfo, [codigoCliente]);
    const cliente = clienteInfo[0];

    console.log('✅ Datos del cliente obtenidos:', {
      nombre: cliente.NOMBRECLIENTE,
      nif: cliente.NIF,
      poblacion: cliente.POBLACION
    });

    // Paso 3: Obtener facturas del año 2025
    console.log('\n📊 Obteniendo facturas del año 2025...');
    const fechaInicioNum = 20250101;
    const fechaFinNum = 20251231;

    const queryFacturas = `
      SELECT DISTINCT
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
        CLI.NOMBRECLIENTE,
        CLI.NIF as CIFCLIENTE,
        (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
         C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        (C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        (C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
         C.IMPORTERECARGO4 + C.IMPORTERECARGO5) as RECARGO,
        C.IMPORTETOTAL as TOTAL
      FROM DSEDAC.CAC C
      INNER JOIN DSEDAC.CLI CLI ON TRIM(C.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) >= ?
        AND (C.ANOFACTURA * 10000 + C.MESFACTURA * 100 + C.DIAFACTURA) <= ?
        AND C.NUMEROFACTURA > 0
        AND (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
             C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = ?
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, SERIEFACTURA, NUMEROFACTURA
    `;

    const facturas = await odbcPool.query(queryFacturas, [fechaInicioNum, fechaFinNum, codigoCliente]);

    console.log(`✅ Facturas obtenidas: ${facturas.length}`);

    // Mostrar primeras 3 facturas
    if (facturas.length > 0) {
      console.log('\n📄 Primeras facturas:');
      facturas.slice(0, 3).forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.SERIEFACTURA}-${f.NUMEROFACTURA} | ${f.FECHAFACTURA} | Base: ${f.BASE_IMPONIBLE} | IVA: ${f.IVA} | Total: ${f.TOTAL}`);
      });
    }

    // Paso 4: Calcular totales
    console.log('\n💰 Calculando totales...');
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

    const totales = {
      totalBase: Math.round(totalBase * 100) / 100,
      totalIVA: Math.round(totalIVA * 100) / 100,
      totalRecargo: Math.round(totalRecargo * 100) / 100,
      totalGeneral: Math.round(totalGeneral * 100) / 100
    };

    console.log('✅ Totales calculados:', totales);

    // Paso 5: Generar PDF
    console.log('\n📄 Generando PDF del Libro IVA...');
    const datosPDF = {
      ejercicio: 2025,
      cliente: cliente,
      registros: facturas,
      totales
    };

    const pdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);

    console.log('✅ PDF generado:', {
      tamaño: `${(pdfBuffer.length / 1024).toFixed(2)} KB`
    });

    // Paso 6: Guardar PDF para inspección
    const outputPath = path.join(__dirname, `test-libro-iva-2025-${codigoCliente}.pdf`);
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
testLibroIvaGeneracion();
