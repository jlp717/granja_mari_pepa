const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // Ver columnas de CAC
    const rows = await connection.query("SELECT * FROM DSEDAC.CAC FETCH FIRST 1 ROW ONLY");
    if (rows.length > 0) {
        console.log('Columnas CAC:', Object.keys(rows[0]).join(', '));
    }

    await connection.close();
}

main().catch(e => console.error(e));
