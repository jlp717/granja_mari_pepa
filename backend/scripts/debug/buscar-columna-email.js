/**
 * BUSCAR COLUMNA EMAIL EN TODO EL ESQUEMA (CORREGIDO)
 */
const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function buscarEmail() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let pool;

    try {
        pool = await odbc.connect(connectionString);

        const query = `
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSEDAC' 
        AND (UPPER(COLUMN_NAME) LIKE '%EMAIL%' OR UPPER(COLUMN_NAME) LIKE '%CORREO%')
      ORDER BY TABLE_NAME
    `;
        const res = await pool.query(query);
        console.table(res);
    } catch (e) { console.error(e); }
    finally { if (pool) await pool.close(); }
}
buscarEmail();
