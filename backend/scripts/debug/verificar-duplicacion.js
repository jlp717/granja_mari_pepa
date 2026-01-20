/**
 * VERIFICAR DUPLICACIÓN DE FACTURAS
 * ==================================
 * Comprobar si las facturas tienen múltiples líneas que causan duplicación
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       VERIFICAR DUPLICACIÓN DE FACTURAS                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    if (!connectionString) {
        console.error('❌ No hay ODBC_CONNECTION_STRING');
        return;
    }

    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('✅ Conectado\n');

        const codigoCliente = '4300032660'; // Cliente 2020 OCASO

        // 1. Ver cuántas filas devuelve la query sin DISTINCT
        console.log('🔍 Analizando cliente:', codigoCliente);

        const queryFilas = `
            SELECT COUNT(*) AS TOTAL_FILAS
            FROM DSEDAC.CAC
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
        `;
        const totalFilas = await connection.query(queryFilas);
        console.log(`   Total filas en CAC (2025): ${totalFilas[0].TOTAL_FILAS}`);

        // 2. Ver cuántas facturas únicas hay
        const queryFacturasUnicas = `
            SELECT COUNT(DISTINCT SERIEFACTURA || '-' || CHAR(NUMEROFACTURA)) AS FACTURAS_UNAS
            FROM DSEDAC.CAC
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
        `;
        const facturasUnicas = await connection.query(queryFacturasUnicas);
        console.log(`   Facturas únicas: ${facturasUnicas[0].FACTURAS_UNAS}`);

        // 3. Ver cuántos albaranes por factura
        const queryAlbaranesPorFactura = `
            SELECT 
                SERIEFACTURA, 
                NUMEROFACTURA, 
                COUNT(DISTINCT NUMEROALBARAN) AS NUM_ALBARANES,
                COUNT(*) AS NUM_FILAS
            FROM DSEDAC.CAC
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
            GROUP BY SERIEFACTURA, NUMEROFACTURA
            ORDER BY NUM_FILAS DESC
            FETCH FIRST 5 ROWS ONLY
        `;
        const albaranes = await connection.query(queryAlbaranesPorFactura);
        console.log('\n📊 Facturas con más filas:');
        albaranes.forEach(a => {
            console.log(`   ${a.SERIEFACTURA}-${a.NUMEROFACTURA}: ${a.NUM_ALBARANES} albaranes, ${a.NUM_FILAS} filas`);
        });

        // 4. Verificar que el SELECT DISTINCT agrupa correctamente
        const queryDistinct = `
            SELECT COUNT(*) AS FILAS_DISTINCT 
            FROM (
                SELECT DISTINCT
                    TRIM(SERIEFACTURA) AS SERIE,
                    NUMEROFACTURA AS NUMERO,
                    EJERCICIOFACTURA AS EJERCICIO,
                    (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
                     IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) AS BASE_IMPONIBLE
                FROM DSEDAC.CAC
                WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
                  AND ANOFACTURA = 2025
                  AND NUMEROFACTURA > 0
            ) AS T
        `;
        const distinctResult = await connection.query(queryDistinct);
        console.log(`\n🔍 Filas después de DISTINCT: ${distinctResult[0].FILAS_DISTINCT}`);

        // 5. La cifra correcta usando GROUP BY
        const queryGroupBy = `
            SELECT 
                COUNT(*) AS NUM_FACTURAS,
                SUM(TOTAL) AS TOTAL_SUMA
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
        const groupByResult = await connection.query(queryGroupBy);
        console.log(`\n✅ USANDO GROUP BY:`);
        console.log(`   Facturas: ${groupByResult[0].NUM_FACTURAS}`);
        console.log(`   Total: ${parseFloat(groupByResult[0].TOTAL_SUMA).toFixed(2)}€`);
        console.log(`   Esperado: 50546.26€`);

        await connection.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();
