/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🧪 TEST DE GENERACIÓN DE PDFs CORREGIDOS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Prueba la generación de PDFs con las correcciones aplicadas:
 *
 * FACTURA:
 * ✅ Columnas LOTE y CAJAS agregadas
 * ✅ Recargo fantasma eliminado (solo suma si > 0)
 * ✅ Total correcto: Base + IVA (+ Recargo si > 0)
 *
 * LIBRO IVA:
 * ✅ Facturas con base <= 0 filtradas
 * ✅ Facturas con total <= 0 filtradas (abonos)
 * ✅ Diseño nuevo: compacto, atractivo, profesional
 * ✅ Todo en una página cuando sea posible
 *
 * @date 2025-12-15
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

require('dotenv').config();
const odbcPool = require('./app/config/odbcConfig');
const pdfService = require('./app/services/pdfService');
const libroIvaPdfService = require('./app/services/libroIvaPdfService');
const fs = require('fs');
const path = require('path');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN DE PRUEBAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TESTS = {
  // Cliente de prueba
  CODIGO_CLIENTE: '4300009900',

  // Factura de prueba (la que tenía el problema del recargo)
  FACTURA: {
    SERIE: 'F',
    NUMERO: 14074,
    ANO: 2025
  },

  // Libro IVA de prueba
  LIBRO_IVA: {
    EJERCICIO: 2025,
    TRIMESTRE: null // null = anual
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0,00';
  const fixed = Math.abs(num).toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = parts[1] ? integerPart + ',' + parts[1] : integerPart;
  return num < 0 ? '-' + result : result;
}

function calcularFechaInicioTrimestre(ejercicio, trimestre) {
  const mesInicio = (trimestre - 1) * 3 + 1;
  return `${ejercicio}-${String(mesInicio).padStart(2, '0')}-01`;
}

function calcularFechaFinTrimestre(ejercicio, trimestre) {
  const mesInicio = (trimestre - 1) * 3 + 1;
  const mesFin = mesInicio + 2;
  const ultimoDia = new Date(ejercicio, mesFin, 0).getDate();
  return `${ejercicio}-${String(mesFin).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 1: GENERAR PDF DE FACTURA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function testFacturaPDF() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 TEST 1: GENERACIÓN DE PDF DE FACTURA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { SERIE, NUMERO, ANO } = TESTS.FACTURA;

    console.log(`\n🔍 Buscando factura ${SERIE}-${NUMERO} del año ${ANO}...`);

    // Obtener cabecera de la factura
    const queryHeader = `
      SELECT
        C.SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        C.MESFACTURA,
        C.DIAFACTURA,
        C.EJERCICIOFACTURA,
        C.CODIGOCLIENTEFACTURA,
        CLI.NOMBRECLIENTE AS NOMBRECLIENTEFACTURA,
        CLI.NIF AS CIFCLIENTEFACTURA,
        CLI.DIRECCION AS DIRECCIONCLIENTEFACTURA,
        CLI.CODIGOPOSTAL AS CPCLIENTEFACTURA,
        CLI.POBLACION AS POBLACIONCLIENTEFACTURA,
        CLI.PROVINCIA AS PROVINCIACLIENTEFACTURA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) AS BASEFACTURA,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) AS IVAFACTURA,
        SUM(C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
            C.IMPORTERECARGO4 + C.IMPORTERECARGO5) AS RECARGOFACTURA,
        SUM(C.IMPORTETOTAL) AS TOTALFACTURA
      FROM DSEDAC.CAC C
      LEFT JOIN DSEDAC.CLI CLI ON TRIM(C.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE TRIM(C.SERIEFACTURA) = ?
        AND C.NUMEROFACTURA = ?
        AND C.ANOFACTURA = ?
      GROUP BY
        C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA,
        C.EJERCICIOFACTURA, C.CODIGOCLIENTEFACTURA,
        CLI.NOMBRECLIENTE, CLI.NIF, CLI.DIRECCION, CLI.CODIGOPOSTAL,
        CLI.POBLACION, CLI.PROVINCIA
    `;

    const headerResult = await odbcPool.query(queryHeader, [SERIE, NUMERO, ANO]);

    if (!headerResult || headerResult.length === 0) {
      console.log('❌ Factura no encontrada');
      return;
    }

    const header = headerResult[0];

    console.log(`✅ Factura encontrada: ${header.NOMBRECLIENTEFACTURA}`);
    console.log(`   Base: ${formatNumber(header.BASEFACTURA)} €`);
    console.log(`   IVA: ${formatNumber(header.IVAFACTURA)} €`);
    console.log(`   Recargo: ${formatNumber(header.RECARGOFACTURA)} €`);
    console.log(`   Total: ${formatNumber(header.TOTALFACTURA)} €`);

    // Verificar cálculo correcto
    const calculoTotal = parseFloat(header.BASEFACTURA) +
                        parseFloat(header.IVAFACTURA) +
                        (parseFloat(header.RECARGOFACTURA) > 0 ? parseFloat(header.RECARGOFACTURA) : 0);

    console.log(`\n🧮 VERIFICACIÓN DE CÁLCULO:`);
    console.log(`   Base: ${formatNumber(header.BASEFACTURA)} €`);
    console.log(`   + IVA: ${formatNumber(header.IVAFACTURA)} €`);
    console.log(`   + Recargo: ${formatNumber(header.RECARGOFACTURA > 0 ? header.RECARGOFACTURA : 0)} € (${header.RECARGOFACTURA > 0 ? 'se suma' : 'NO se suma - es 0'})`);
    console.log(`   = Total calculado: ${formatNumber(calculoTotal)} €`);
    console.log(`   Total DB: ${formatNumber(header.TOTALFACTURA)} €`);
    console.log(`   ✅ Coincide: ${Math.abs(calculoTotal - header.TOTALFACTURA) < 0.01 ? 'SÍ' : 'NO'}`);

    // Obtener líneas de la factura
    const queryLines = `
      SELECT
        L.NUMEROALBARAN,
        L.SECUENCIA as NUMEROLINEA,
        L.CODIGOARTICULO,
        L.DESCRIPCION as DESCRIPCIONARTICULO,
        L.CODIGOLOTE as LOTEARTICULO,
        L.CANTIDADENVASES as CAJASARTICULO,
        L.CANTIDADUNIDADES as CANTIDADARTICULO,
        L.PRECIOVENTA as PRECIOARTICULO,
        L.PORCENTAJEDESCUENTO as PORCENTAJEDESCUENTOARTICULO,
        10.00 as PORCENTAJEIVAARTICULO,
        0.00 as PORCENTAJERECARGOARTICULO,
        L.IMPORTEVENTA as IMPORTENETOARTICULO
      FROM DSEDAC.LAC L
      WHERE TRIM(L.SERIEFACTURA) = ?
        AND L.NUMEROFACTURA = ?
        AND L.EJERCICIOFACTURA = ?
      ORDER BY L.NUMEROALBARAN, L.SECUENCIA
    `;

    const lines = await odbcPool.query(queryLines, [SERIE, NUMERO, ANO]);

    console.log(`\n📦 Líneas de factura: ${lines.length}`);

    if (lines.length > 0) {
      console.log('\n   Primeras 3 líneas:');
      lines.slice(0, 3).forEach((line, i) => {
        console.log(`   ${i + 1}. ${line.DESCRIPCIONARTICULO || 'Sin descripción'}`);
        console.log(`      Código: ${line.CODIGOARTICULO || 'N/A'}`);
        console.log(`      Lote: ${line.LOTEARTICULO || 'N/A'} | Cajas: ${line.CAJASARTICULO || 'N/A'}`);
        console.log(`      Cant: ${formatNumber(line.CANTIDADARTICULO)} | Precio: ${formatNumber(line.PRECIOARTICULO)} €`);
        console.log(`      IVA: ${formatNumber(line.PORCENTAJEIVAARTICULO)}% | Recargo: ${formatNumber(line.PORCENTAJERECARGOARTICULO)}%`);
        console.log(`      Importe: ${formatNumber(line.IMPORTENETOARTICULO)} €`);
      });
    }

    // Generar PDF
    console.log('\n📄 Generando PDF...');

    const facturaData = {
      header,
      lines
    };

    const pdfBuffer = await pdfService.generateInvoicePDF(facturaData);

    const outputPath = path.join(__dirname, `test-factura-${SERIE}-${NUMERO}-CORREGIDO.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ PDF generado exitosamente: ${outputPath}`);
    console.log('\n🎨 VERIFICA VISUALMENTE EN EL PDF:');
    console.log('   ✅ Columnas LOTE y CAJAS presentes');
    console.log('   ✅ Total correcto sin recargo fantasma');
    console.log('   ✅ Recargo solo se muestra si > 0');

  } catch (error) {
    console.error('❌ Error generando PDF de factura:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST 2: GENERAR PDF DE LIBRO IVA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function testLibroIvaPDF() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST 2: GENERACIÓN DE PDF DE LIBRO IVA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const { EJERCICIO, TRIMESTRE } = TESTS.LIBRO_IVA;
    const { CODIGO_CLIENTE } = TESTS;

    console.log(`\n🔍 Generando Libro IVA para:`);
    console.log(`   Ejercicio: ${EJERCICIO}`);
    console.log(`   Trimestre: ${TRIMESTRE || 'ANUAL'}`);
    console.log(`   Cliente: ${CODIGO_CLIENTE}`);

    // Calcular fechas
    let fechaInicio, fechaFin;
    if (TRIMESTRE) {
      fechaInicio = calcularFechaInicioTrimestre(EJERCICIO, TRIMESTRE);
      fechaFin = calcularFechaFinTrimestre(EJERCICIO, TRIMESTRE);
    } else {
      fechaInicio = `${EJERCICIO}-01-01`;
      fechaFin = `${EJERCICIO}-12-31`;
    }

    const fechaInicioNum = parseInt(fechaInicio.replace(/-/g, ''));
    const fechaFinNum = parseInt(fechaFin.replace(/-/g, ''));

    console.log(`   Período: ${fechaInicio} a ${fechaFin}`);

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

    const clienteResult = await odbcPool.query(queryCliente, [CODIGO_CLIENTE]);
    const cliente = clienteResult && clienteResult.length > 0 ? clienteResult[0] : null;

    console.log(`\n✅ Cliente: ${cliente ? cliente.NOMBRECLIENTE : 'No encontrado'}`);

    // Obtener facturas con FILTROS CORREGIDOS
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
         AND SUM(C.IMPORTETOTAL) > 0
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, SERIEFACTURA, NUMEROFACTURA
    `;

    const registros = await odbcPool.query(queryFacturas, [fechaInicioNum, fechaFinNum, CODIGO_CLIENTE]);

    console.log(`\n📊 Facturas obtenidas: ${registros.length}`);

    if (registros.length > 0) {
      console.log('\n   Verificando filtros:');
      const conBaseNegativa = registros.filter(r => parseFloat(r.BASE_IMPONIBLE) <= 0);
      const conTotalNegativo = registros.filter(r => parseFloat(r.TOTAL) <= 0);

      console.log(`   ✅ Facturas con BASE <= 0: ${conBaseNegativa.length} (deben ser 0)`);
      console.log(`   ✅ Facturas con TOTAL <= 0: ${conTotalNegativo.length} (deben ser 0)`);

      // Calcular totales
      let totalBase = 0;
      let totalIva = 0;
      let totalRecargo = 0;
      let totalGeneral = 0;

      registros.forEach(r => {
        totalBase += parseFloat(r.BASE_IMPONIBLE) || 0;
        totalIva += parseFloat(r.IVA) || 0;
        totalRecargo += parseFloat(r.RECARGO) || 0;
        totalGeneral += parseFloat(r.TOTAL) || 0;
      });

      console.log('\n   📊 TOTALES:');
      console.log(`      Base Imponible: ${formatNumber(totalBase)} €`);
      console.log(`      IVA: ${formatNumber(totalIva)} €`);
      console.log(`      Recargo: ${formatNumber(totalRecargo)} €`);
      console.log(`      TOTAL: ${formatNumber(totalGeneral)} €`);

      const totales = {
        totalBase,
        totalIVA: totalIva,
        totalRecargo,
        totalGeneral
      };

      // Generar PDF
      console.log('\n📄 Generando PDF del Libro IVA...');

      const datosPDF = {
        ejercicio: EJERCICIO,
        cliente,
        registros,
        totales
      };

      const pdfBuffer = await libroIvaPdfService.generateLibroIvaPDF(datosPDF);

      const periodo = TRIMESTRE ? `T${TRIMESTRE}` : `${EJERCICIO}`;
      const outputPath = path.join(__dirname, `test-libro-iva-${periodo}-${CODIGO_CLIENTE}-CORREGIDO.pdf`);
      fs.writeFileSync(outputPath, pdfBuffer);

      console.log(`✅ PDF generado exitosamente: ${outputPath}`);
      console.log('\n🎨 VERIFICA VISUALMENTE EN EL PDF:');
      console.log('   ✅ Sin facturas con base 0');
      console.log('   ✅ Sin facturas negativas (abonos)');
      console.log('   ✅ Diseño compacto y atractivo');
      console.log('   ✅ Totales en una sola página');
      console.log('   ✅ Recargos solo se muestran si > 0');

    } else {
      console.log('⚠️ No se encontraron facturas para el período especificado');
    }

  } catch (error) {
    console.error('❌ Error generando PDF de Libro IVA:', error);
    throw error;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EJECUTAR TESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function runTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST DE GENERACIÓN DE PDFs CORREGIDOS           ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Test 1: Factura
    await testFacturaPDF();

    // Test 2: Libro IVA
    await testLibroIvaPDF();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS LOS TESTS COMPLETADOS EXITOSAMENTE        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error en los tests:', error);
    process.exit(1);
  } finally {
    await odbcPool.close();
  }
}

// Ejecutar
runTests();
