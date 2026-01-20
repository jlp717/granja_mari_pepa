/**
 * INVESTIGAR ESTRUCTURA DE DATOS
 * ===============================
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    const codigoCliente = '4300032660';

    console.log('🔍 Analizando una factura específica...\n');

    // Ver detalle de una factura con múltiples albaranes
    const queryDetalle = `
        SELECT 
            SERIEFACTURA,
            NUMEROFACTURA,
            NUMEROALBARAN,
            (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + 
             IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) AS BASE,
            (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
            (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
            (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
            (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
            (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END) AS IVA,
            (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5) AS RECARGO
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA = 12611
        ORDER BY NUMEROALBARAN
    `;

    const detalle = await connection.query(queryDetalle);
    console.log('Factura F-12611 (8 albaranes):');
    console.log('─'.repeat(70));
    let totalBase = 0, totalIVA = 0, totalRecargo = 0;
    detalle.forEach(d => {
        const base = parseFloat(d.BASE) || 0;
        const iva = parseFloat(d.IVA) || 0;
        const recargo = parseFloat(d.RECARGO) || 0;
        totalBase += base;
        totalIVA += iva;
        totalRecargo += recargo;
        console.log(`  Albarán ${d.NUMEROALBARAN}: Base=${base.toFixed(2)} IVA=${iva.toFixed(2)} Recargo=${recargo.toFixed(2)} => ${(base + iva + recargo).toFixed(2)}€`);
    });
    console.log('─'.repeat(70));
    console.log(`  SUMA: Base=${totalBase.toFixed(2)} IVA=${totalIVA.toFixed(2)} Recargo=${totalRecargo.toFixed(2)}`);
    console.log(`  TOTAL FACTURA: ${(totalBase + totalIVA + totalRecargo).toFixed(2)}€\n`);

    // ¿Tienen todos los albaranes la misma base o diferente?
    const queryValoresUnicos = `
        SELECT 
            NUMEROFACTURA,
            COUNT(DISTINCT (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + 
                            IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5)) AS VALORES_DISTINTOS,
            COUNT(*) AS TOTAL_FILAS
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
        GROUP BY NUMEROFACTURA
    `;
    const valoresUnicos = await connection.query(queryValoresUnicos);
    console.log('¿Las filas de cada factura tienen el mismo valor de base?');
    valoresUnicos.forEach(v => {
        const iguales = v.VALORES_DISTINTOS === 1 ? '✅ TODAS IGUALES' : '❌ DIFERENTES';
        console.log(`  Factura ${v.NUMEROFACTURA}: ${v.TOTAL_FILAS} filas, ${v.VALORES_DISTINTOS} valores distintos ${iguales}`);
    });

    await connection.close();
}

main().catch(e => console.error(e));
