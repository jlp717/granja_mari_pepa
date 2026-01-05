const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function buscarEmail() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    if (!connectionString) {
        console.error('No ODBC connection string');
        return;
    }

    let pool;
    try {
        pool = await odbc.connect(connectionString);
        console.log('Conectado a DB');

        // 1. Buscar tablas con nombre prometedor
        const tables = await pool.query(`
        SELECT TABLE_NAME 
        FROM QSYS2.SYSTABLES 
        WHERE TABLE_SCHEMA = 'DSEDAC' AND (
            TABLE_NAME LIKE '%CONTACT%' OR 
            TABLE_NAME LIKE '%MAIL%' OR 
            TABLE_NAME LIKE '%AGENDA%' OR
            TABLE_NAME LIKE '%WEB%'
        )
    `);
        console.log('Tablas candidatas:', tables.map(t => t.TABLE_NAME).join(', '));

        // 2. Buscar valor exacto en esas tablas
        const target = 'sundayespecial88@gmail.com'; // El email que sabemos que existe

        // Lista manual de tablas habituales + las encontradas
        const candidates = new Set([...tables.map(t => t.TABLE_NAME), 'CLI', 'CLIE', 'CLIFAX', 'CLIEXT', 'DACCLI']);

        for (const table of candidates) {
            try {
                // Obtener columnas de texto
                const cols = await pool.query(`
                SELECT COLUMN_NAME 
                FROM QSYS2.SYSCOLUMNS 
                WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = '${table}' 
                AND DATA_TYPE IN ('CHAR', 'VARCHAR') AND LENGTH > 10
            `);

                if (cols.length === 0) continue;

                const where = cols.map(c => `UPPER(${c.COLUMN_NAME}) LIKE '%SUNDAYESPECIAL%'`).join(' OR ');
                const found = await pool.query(`SELECT * FROM DSEDAC.${table} WHERE ${where}`);

                if (found.length > 0) {
                    console.log(`\n🎉 ENCONTRADO EN ${table}!!!`);
                    console.log(JSON.stringify(found[0], null, 2));

                    // Mostrar qué columna tiene el valor
                    for (const col of cols) {
                        const val = found[0][col.COLUMN_NAME];
                        if (val && String(val).toUpperCase().includes('SUNDAY')) {
                            console.log(`Columna exacta: ${col.COLUMN_NAME}`);
                        }
                    }
                }
            } catch (e) {
                // Ignorar tablas que no existen o no tenemos acceso
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (pool) await pool.close();
    }
}

buscarEmail();
