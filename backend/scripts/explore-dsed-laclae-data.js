const db = require('../app/config/odbcConfig');

async function exploreDataLACLAE() {
    await db.initialize();

    console.log('=== DATOS DSED.LACLAE ===\n');

    try {
        const sample = await db.query('SELECT * FROM DSED.LACLAE FETCH FIRST 2 ROWS ONLY');
        console.log(sample);

        // Let's find distinct values of LCTPVT
        const t = await db.query('SELECT LCTPVT, COUNT(*) FROM DSED.LACLAE GROUP BY LCTPVT');
        console.log('Valores de LCTPVT (TipoVenta):', t);

        // Let's run the count joining with ART (assuming OPCDPR is CODIGOARTICULO, or we'll join it using the ALBARAN keys with LAC)
        // Actually, DSEDAC.LAC perfectly matches LACLAE's keys. Let's see if DSEDAC.LAC has rows matching DSED.LACLAE perfectly.
        // LCTPVT = TIPOVENTA. "sólo contar el LAC". Does the user mean LCTPVT = 'LAC'?
    } catch (e) {
        console.log('ERROR:', e.message);
    }

    await db.close();
    process.exit(0);
}

exploreDataLACLAE().catch(e => { console.error(e.message); process.exit(1); });
