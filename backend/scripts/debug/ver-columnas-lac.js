const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // Ver columnas de LAC
    const rows = await connection.query("SELECT * FROM DSEDAC.LAC FETCH FIRST 1 ROW ONLY");
    if (rows.length > 0) {
        console.log('Columnas LAC:', Object.keys(rows[0]).join(', '));
    } else {
        console.log('No se pudo obtener fila de LAC');
    }

    await connection.close();
}

main().catch(e => console.error(e));
