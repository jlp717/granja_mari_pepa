/**
 * TEST DE VERIFICACIÓN: UNIFICACIÓN NIF
 * =====================================
 * Simula la lógica del nuevo authController para confirmar que
 * al buscar '30853' recupera también '40420' y suma 172k.
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function mockObtenerFacturas(codigoCliente) {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    console.log(`\n🧪 Test para Cliente: ${codigoCliente}`);

    // 1. OBTENER CÓDIGOS VINCULADOS
    let codigosVinculados = [`'${codigoCliente}'`];
    try {
        const queryNif = `SELECT NIF FROM DSEDAC.CLI WHERE CODIGOCLIENTE = '${codigoCliente}'`;
        const resultNif = await connection.query(queryNif);

        if (resultNif.length > 0 && resultNif[0].NIF) {
            const nif = resultNif[0].NIF.trim();
            console.log(`   > NIF Encontrado: ${nif}`);
            if (nif) {
                const queryVinculados = `SELECT CODIGOCLIENTE FROM DSEDAC.CLI WHERE NIF = '${nif}'`;
                const resultVinculados = await connection.query(queryVinculados);

                if (resultVinculados.length > 0) {
                    codigosVinculados = resultVinculados.map(r => `'${r.CODIGOCLIENTE.trim()}'`);
                    console.log(`   > Códigos Vinculados: [${codigosVinculados.join(', ')}]`);
                }
            }
        }
    } catch (e) {
        console.error('Error buscando vinculaciones:', e);
    }

    const codigosInClause = codigosVinculados.join(', ');

    // 2. QUERY SIMPLIFICADA (Solo totales)
    const query = `
        SELECT 
            TRIM(SERIEFACTURA) as SERIE,
            CAC.NUMEROFACTURA as NUMERO,
            MAX(CAC.CODIGOCLIENTEFACTURA) as CODIGO_ORIGEN,
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
        WHERE TRIM(CODIGOCLIENTEFACTURA) IN (${codigosInClause})
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
    `;

    const rows = await connection.query(query);

    let total = 0;
    rows.forEach(r => {
        total += parseFloat(r.TOTAL);
    });

    console.log(`   > Total Facturado 2025: ${total.toFixed(2)}€`);

    await connection.close();
    return total;
}

async function main() {
    // Caso Diego
    console.log('--- DIEGO E HIJOS (30853) ---');
    const totalDiego = await mockObtenerFacturas('4300030853');
    console.log(`   > EXPECTED: 172154.95€ | OBTAINED: ${totalDiego.toFixed(2)}€`);

    // Caso Almerimar (Uno cualquiera de los dos códigos)
    console.log('\n--- ALMERIMAR (31804) ---');
    const totalAlmerimar = await mockObtenerFacturas('4300031804');
    console.log(`   > EXPECTED: 93617.25€ | OBTAINED: ${totalAlmerimar.toFixed(2)}€`);
}

main().catch(console.error);
