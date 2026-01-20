/**
 * ANALIZAR FECHAS ENTREGA N-12
 * ============================
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    console.log('🔍 Analizando fechas factura N-12...');

    const query = `
        SELECT 
            SERIEFACTURA, NUMEROFACTURA, ANOFACTURA,
            DIAFACTURA, MESFACTURA, ANOFACTURA,
            DIAENTREGA, MESENTREGA, ANOENTREGA,
            OBSERVACIONES, REFERENCIA
        FROM DSEDAC.CAC
        WHERE TRIM(SERIEFACTURA) = 'N'
          AND NUMEROFACTURA = 12
          AND ANOFACTURA = 2025
    `;
    const rows = await connection.query(query);
    console.log(rows);

    await connection.close();
}

main().catch(e => console.error(e));
