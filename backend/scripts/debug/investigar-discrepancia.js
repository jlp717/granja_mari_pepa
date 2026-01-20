/**
 * INVESTIGAR DISCREPANCIA DE TOTALES
 * ===================================
 * La tarjeta muestra 49,518.73€ pero debería ser ~50,546.26€
 * Diferencia: ~1,027€
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       INVESTIGAR DISCREPANCIA DE TOTALES                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    const codigoCliente = '4300032660'; // 2020 OCASO, S.L. (cliente de la imagen)

    console.log(`🔍 Cliente: ${codigoCliente}\n`);

    // 1. Total usando la query EXACTA del backend (authController.js)
    console.log('1️⃣ TOTAL USANDO QUERY DEL BACKEND (SELECT DISTINCT):');
    const queryBackend = `
        SELECT 
            COUNT(*) AS NUM_FILAS,
            SUM(
                (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                (
                    (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                ) +
                (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
            ) AS TOTAL_SIN_AGRUPAR
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
    `;
    const resultSinAgrupar = await connection.query(queryBackend);
    console.log(`   Filas totales: ${resultSinAgrupar[0].NUM_FILAS}`);
    console.log(`   Total SIN agrupar (suma de TODAS las filas): ${parseFloat(resultSinAgrupar[0].TOTAL_SIN_AGRUPAR).toFixed(2)}€`);

    // 2. Total agrupado por factura (para evitar duplicación)
    console.log('\n2️⃣ TOTAL AGRUPADO POR FACTURA (evita duplicación):');
    const queryAgrupado = `
        SELECT 
            COUNT(*) AS NUM_FACTURAS,
            SUM(TOTAL) AS TOTAL_AGRUPADO
        FROM (
            SELECT 
                SERIEFACTURA, 
                NUMEROFACTURA,
                MAX(
                    (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                    (
                        (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                    ) +
                    (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
                ) AS TOTAL
            FROM DSEDAC.CAC
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
            GROUP BY SERIEFACTURA, NUMEROFACTURA
        ) T
    `;
    const resultAgrupado = await connection.query(queryAgrupado);
    console.log(`   Facturas únicas: ${resultAgrupado[0].NUM_FACTURAS}`);
    console.log(`   Total AGRUPADO (MAX por factura): ${parseFloat(resultAgrupado[0].TOTAL_AGRUPADO).toFixed(2)}€`);

    // 3. Total usando SUM por factura (sumando albaranes)
    console.log('\n3️⃣ TOTAL SUMANDO ALBARANES POR FACTURA:');
    const querySumPorFactura = `
        SELECT 
            COUNT(*) AS NUM_FACTURAS,
            SUM(TOTAL) AS TOTAL_SUMA
        FROM (
            SELECT 
                SERIEFACTURA, 
                NUMEROFACTURA,
                SUM(
                    (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                    (
                        (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                        (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                    ) +
                    (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
                ) AS TOTAL
            FROM DSEDAC.CAC
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
            GROUP BY SERIEFACTURA, NUMEROFACTURA
        ) T
    `;
    const resultSumPorFactura = await connection.query(querySumPorFactura);
    console.log(`   Facturas: ${resultSumPorFactura[0].NUM_FACTURAS}`);
    console.log(`   Total (SUM por factura): ${parseFloat(resultSumPorFactura[0].TOTAL_SUMA).toFixed(2)}€`);

    // 4. Ver detalle de cada factura
    console.log('\n4️⃣ DETALLE POR FACTURA:');
    const queryDetalle = `
        SELECT 
            SERIEFACTURA AS SERIE,
            NUMEROFACTURA AS NUMERO,
            COUNT(*) AS FILAS,
            SUM(
                (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                (
                    (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                ) +
                (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
            ) AS TOTAL_FACTURA
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
        GROUP BY SERIEFACTURA, NUMEROFACTURA
        ORDER BY NUMEROFACTURA
    `;
    const detalle = await connection.query(queryDetalle);
    let sumaTotal = 0;
    detalle.forEach(f => {
        const total = parseFloat(f.TOTAL_FACTURA) || 0;
        sumaTotal += total;
        console.log(`   ${f.SERIE}-${f.NUMERO}: ${f.FILAS} filas => ${total.toFixed(2)}€`);
    });
    console.log(`   ────────────────────────────`);
    console.log(`   SUMA MANUAL: ${sumaTotal.toFixed(2)}€`);

    // 5. Comparar con lo que el frontend recibe
    console.log('\n5️⃣ QUE DEVUELVE EXACTAMENTE EL BACKEND (simulando query):');
    const queryBackendReal = `
        WITH FacturasBase AS (
            SELECT DISTINCT
                TRIM(CAC.SERIEFACTURA) AS SERIE,
                CAC.NUMEROFACTURA AS NUMERO,
                (CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 +
                 CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) AS BASE_IMPONIBLE,
                (
                    (CAC.IMPORTEBASEIMPONIBLE1 * CASE WHEN CAC.PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (CAC.IMPORTEBASEIMPONIBLE2 * CASE WHEN CAC.PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (CAC.IMPORTEBASEIMPONIBLE3 * CASE WHEN CAC.PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (CAC.IMPORTEBASEIMPONIBLE4 * CASE WHEN CAC.PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                    (CAC.IMPORTEBASEIMPONIBLE5 * CASE WHEN CAC.PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                ) AS IVA,
                (CAC.IMPORTERECARGO1 + CAC.IMPORTERECARGO2 + CAC.IMPORTERECARGO3 + CAC.IMPORTERECARGO4 + CAC.IMPORTERECARGO5) AS RECARGO
            FROM DSEDAC.CAC CAC
            WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND CAC.ANOFACTURA = 2025
              AND CAC.NUMEROFACTURA > 0
        )
        SELECT COUNT(*) AS NUM_FILAS, 
               SUM(BASE_IMPONIBLE + IVA + RECARGO) AS TOTAL
        FROM FacturasBase
    `;
    const resultBackendReal = await connection.query(queryBackendReal);
    console.log(`   Filas que devuelve DISTINCT: ${resultBackendReal[0].NUM_FILAS}`);
    console.log(`   Total que calcula el frontend: ${parseFloat(resultBackendReal[0].TOTAL).toFixed(2)}€`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 CONCLUSIÓN:');
    console.log('   El problema es que SELECT DISTINCT no agrupa correctamente');
    console.log('   porque cada albarán tiene diferente BASE_IMPONIBLE.');
    console.log('   El frontend suma TODAS las filas que recibe (incluyendo duplicados).');
    console.log('═══════════════════════════════════════════════════════════════');

    await connection.close();
}

main().catch(e => console.error(e));
