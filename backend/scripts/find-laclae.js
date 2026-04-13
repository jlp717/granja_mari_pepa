const db = require('../app/config/odbcConfig');

async function findLACLAE() {
    await db.initialize();

    console.log('=== BUSCANDO LACLAE ===\n');

    try {
        const cols = await db.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM QSYS2.SYSTABLES 
      WHERE TABLE_NAME LIKE '%LACLAE%' OR SYSTEM_TABLE_NAME LIKE '%LACLAE%'
    `);

        console.log(cols);

        // Let's also check if maybe the user meant LAC LAE? Let's check DSEDAC.LAE
        const lae = await db.query(`
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM QSYS2.SYSTABLES 
        WHERE TABLE_NAME LIKE '%LAE%' OR SYSTEM_TABLE_NAME LIKE '%LAE%'
      `);
        console.log('Tablas LAE:');
        console.log(lae);
    } catch (e) {
        console.log('ERROR:', e.message);
    }

    await db.close();
    process.exit(0);
}

findLACLAE().catch(e => { console.error(e.message); process.exit(1); });
