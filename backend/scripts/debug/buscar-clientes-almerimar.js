const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    console.log('🔍 Buscando clientes "ALMERIMAR"...');

    // Buscar por nombre
    const porNombre = await connection.query(`
        SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF
        FROM DSEDAC.CLI
        WHERE NOMBRECLIENTE LIKE '%ALMERIMAR%'
    `);
    console.log('--- Por Nombre ---');
    console.log(porNombre);

    // Buscar por NIF parcial
    const porNif = await connection.query(`
        SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF
        FROM DSEDAC.CLI
        WHERE NIF LIKE '%28307916%'
    `);
    console.log('--- Por NIF ---');
    console.log(porNif);

    await connection.close();
}

main().catch(e => console.error(e));
