/**
 * VERIFICAR DIEGO E HIJOS (DOBLE CÓDIGO)
 * ======================================
 * Códigos detectados en imagen:
 * - 4300030853 (Principal)
 * - 4300040420 (Secundario en la lista)
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    const codes = ['4300030853', '4300040420'];
    const targetTotal = 172154.94;

    console.log(`🔍 Sumando facturas para: ${codes.join(', ')}`);

    let granTotal = 0;

    for (const code of codes) {
        // Query genérica (sin filtrar serie específica, cogemos todo lo > 0)
        const query = `
            SELECT 
                TRIM(SERIEFACTURA) as SERIE,
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
            WHERE TRIM(CODIGOCLIENTEFACTURA) = '${code}'
              AND ANOFACTURA = 2025
              AND NUMEROFACTURA > 0
            GROUP BY TRIM(SERIEFACTURA)
        `;
        const rows = await connection.query(query);

        console.log(`\nCliente ${code}:`);
        let subtotal = 0;
        rows.forEach(r => {
            const t = parseFloat(r.TOTAL);
            console.log(`   Serie ${r.SERIE}: ${t.toFixed(2)}€`);
            subtotal += t;
        });
        console.log(`   >> Subtotal: ${subtotal.toFixed(2)}€`);
        granTotal += subtotal;
    }

    console.log('────────────────────────────────');
    console.log(`TOTAL SUMADO (AMBOS):  ${granTotal.toFixed(2)}€`);
    console.log(`TOTAL ESPERADO (IMG):  ${targetTotal.toFixed(2)}€`);
    console.log(`DIFERENCIA:            ${(granTotal - targetTotal).toFixed(2)}€`);

    await connection.close();
}

main().catch(e => console.error(e));
