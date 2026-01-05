/**
 * BUSCAR EMAIL EN TABLAS CANDIDATAS
 */
const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function buscarEmail() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let pool;
    try {
        pool = await odbc.connect(connectionString);

        const tables = ['FECA', 'FEEM', 'FERE', 'CTO', 'LOC', 'EPLX'];
        const email = 'sundayespecial88';

        for (const t of tables) {
            try {
                // Obtener columna correcta
                const cols = await pool.query(`
                    SELECT COLUMN_NAME FROM QSYS2.SYSCOLUMNS 
                    WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = '${t}'
                    AND (UPPER(COLUMN_NAME) LIKE '%EMAIL%' OR UPPER(COLUMN_NAME) LIKE '%CORREO%')
                `);

                if (cols.length === 0) continue;

                const colName = cols[0].COLUMN_NAME;
                console.log(`Buscando en ${t}.${colName}...`);

                const query = `SELECT * FROM DSEDAC.${t} WHERE UPPER(${colName}) LIKE '%${email.toUpperCase()}%'`;
                const res = await pool.query(query);

                if (res.length > 0) {
                    console.log(`✅ ENCONTRADO EN ${t}:`);
                    console.log(res[0]);
                }
            } catch (e) { console.log(`Error en ${t}: ${e.message}`); }
        }
    } catch (e) { console.error(e); }
    finally { if (pool) await pool.close(); }
}
buscarEmail();
