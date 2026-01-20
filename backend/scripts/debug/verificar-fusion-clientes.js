/**
 * VERIFICAR SUMA FUSIÓN ALMERIMAR
 * ================================
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // Códigos encontrados
    const codes = ['4300031804', '4300035065'];

    console.log(`🔍 Sumando facturas de: ${codes.join(', ')}`);

    let granTotal = 0;

    for (const code of codes) {
        const query = `
            SELECT SUM(
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
        `;
        const res = await connection.query(query);
        const total = parseFloat(res[0].TOTAL || 0);
        console.log(`   Client ${code}: ${total.toFixed(2)}€`);
        granTotal += total;
    }

    console.log('────────────────────────────────');
    console.log(`TOTAL SUMADO:    ${granTotal.toFixed(2)}€`);
    console.log(`TOTAL ESPERADO:  93.617,25€`);
    console.log(`DIFERENCIA:      ${(granTotal - 93617.25).toFixed(2)}€`);

    if (Math.abs(granTotal - 93617.25) < 1) {
        console.log('✅ ¡IDENTIFICADO! La discrepancia es porque el usuario suma por NIF.');
    } else {
        console.log('❌ Sigue habiendo diferencia.');
    }

    await connection.close();
}

main().catch(e => console.error(e));
