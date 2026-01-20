/**
 * INVESTIGACIÓN HOTEL AR ALMERIMAR (A28307916)
 * ============================================
 * Diferencia de 15.500€
 * Esperado: 93.617,25€
 * Calculado: 78.116,53€
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // NIF A28307916
    const nif = 'A28307916';

    console.log(`🔍 Buscando cliente NIF ${nif}...`);
    const clientes = await connection.query(`SELECT CODIGOCLIENTE, NOMBRECLIENTE FROM DSEDAC.CLI WHERE NIF = '${nif}'`);
    if (clientes.length === 0) {
        console.log('Cliente no encontrado');
        return;
    }
    const codigoCliente = clientes[0].CODIGOCLIENTE.trim();
    console.log(`Cliente: ${clientes[0].NOMBRECLIENTE} (${codigoCliente})`);

    // Listar facturas
    const query = `
        SELECT 
            TRIM(SERIEFACTURA) AS SERIE,
            NUMEROFACTURA AS NUMERO,
            MAX(DIAFACTURA) || '/' || MAX(MESFACTURA) || '/' || MAX(ANOFACTURA) AS FECHA,
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
            ) AS TOTAL_CALCULADO
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
          AND NUMEROFACTURA > 0
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
        ORDER BY NUMEROFACTURA
    `;

    const facturas = await connection.query(query);

    let total = 0;
    facturas.forEach(f => {
        total += parseFloat(f.TOTAL_CALCULADO);
        console.log(`${f.SERIE}-${f.NUMERO}: ${parseFloat(f.TOTAL_CALCULADO).toFixed(2)}€`);
    });

    console.log(`\nTOTAL CALCULADO: ${total.toFixed(2)}€`);
    console.log(`TOTAL ESPERADO:  93.617,25€`);
    console.log(`DIFERENCIA:      ${(total - 93617.25).toFixed(2)}€`);

    await connection.close();
}

main().catch(e => console.error(e));
