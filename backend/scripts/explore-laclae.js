const db = require('../app/config/odbcConfig');

async function exploreLACLAE() {
    await db.initialize();

    try {
        const cols = await db.query(`
      SELECT COLUMN_NAME
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSEDAC' AND (TABLE_NAME = 'LACLAE' OR SYSTEM_TABLE_NAME = 'LACLAE')
    `);

        console.log('--- COLUMNAS EN LACLAE ---');
        cols.forEach(c => console.log(c.COLUMN_NAME));

        if (cols.length === 0) {
            console.log('No se encontraron columnas para LACLAE.');
            process.exit(0);
        }

        // Attempt the actual sum based on these columns!
        // The user's query logic:
        // "el TIPOVENTA solo contar el LAC"
        // "hacer lo del cliente albaran cuando sea CONTADO"
        // "no poner los clientes que empiece por 44" => NOT LIKE '44%'
        // LCCLLN IN ('AB','RG','VT')  (maybe LACLAE has CLASELINEA or LCCLLN?)
        // LCAADC = 2026

        // We don't know the exact column names, but we can assume LACLAE has standard ones like EJERCICIOALBARAN, MESDOCUMENTO, etc.
        // If it's a join view, we just use it directly. Let's see if we can do SELECT COUNT(*) FROM DSEDAC.LACLAE

        const sample = await db.query(`SELECT * FROM DSEDAC.LACLAE FETCH FIRST 1 ROWS ONLY`);
        console.log('\n--- MUESTRA LACLAE ---');
        console.log(sample[0]);

    } catch (e) {
        console.log('ERROR:', e.message);
    }

    await db.close();
    process.exit(0);
}

exploreLACLAE().catch(e => { console.error(e.message); process.exit(1); });
