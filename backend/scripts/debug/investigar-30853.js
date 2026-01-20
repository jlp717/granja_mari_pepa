/**
 * INVESTIGACIÓN CLIENTE 30853
 * ===========================
 * Detalle de todas las facturas de 2025 para encontrar los 3.000€ perdidos.
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       INVESTIGACIÓN DETALLADA CLIENTE 30853                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // Código confirmado del cliente
    const codigoCliente = '4300030853'; // DIEGO E HIJOS EL CAPILLERO, S.L.

    console.log(`🔍 Analizando cliente: ${codigoCliente}`);

    // 1. Obtener listado de todas las facturas y sus importes brutos
    const query = `
        SELECT 
            TRIM(SERIEFACTURA) AS SERIE,
            NUMEROFACTURA AS NUMERO,
            MAX(DIAFACTURA) || '/' || MAX(MESFACTURA) || '/' || MAX(ANOFACTURA) AS FECHA,
            
            -- Suma de bases por factura (sumando albaranes)
            SUM(IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) AS BASE,
            
            -- Suma Total recalculado
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
            ) AS TOTAL_CALCULADO,
            
            COUNT(*) AS NUM_ALBARANES
            
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
        ORDER BY NUMEROFACTURA
    `;

    const facturas = await connection.query(query);

    console.log('\n📋 DETALLE DE FACTURAS 2025:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('FACTURA    | FECHA      | ALBS | BASE        | TOTAL CALC   ');
    console.log('─────────────────────────────────────────────────────────────────');

    let granTotalCalculado = 0;

    facturas.forEach(f => {
        const totalCalc = parseFloat(f.TOTAL_CALCULADO);
        granTotalCalculado += totalCalc;

        console.log(`${f.SERIE}-${f.NUMERO.toString().padEnd(6)} | ${f.FECHA} | ${f.NUM_ALBARANES.toString().padEnd(4)} | ${parseFloat(f.BASE).toFixed(2).padEnd(11)} | ${totalCalc.toFixed(2).padEnd(12)}`);
    });

    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`TOTAL CALCULADO (NUESTRA APP): ${granTotalCalculado.toFixed(2)}€`);
    console.log('TOTAL ESPERADO (PAPEL):        172,154.94€');
    console.log(`DIFERENCIA:                    ${(granTotalCalculado - 172154.94).toFixed(2)}€`);

    // 2. Buscar si hay facturas "extrañas" o rectificativas no captadas
    const queryExtra = `
        SELECT * FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND (NUMEROFACTURA <= 0 OR SERIEFACTURA LIKE '%R%')
    `;
    const extra = await connection.query(queryExtra);
    if (extra.length > 0) {
        console.log('\n⚠️ ENCONTRADAS FACTURAS RARAS (Num<=0 o Serie R):');
        console.log(extra);
    } else {
        console.log('\n✅ No se ven facturas con número negativo o serie R explícita en query simple.');
    }

    await connection.close();
}

main().catch(e => console.error(e));
