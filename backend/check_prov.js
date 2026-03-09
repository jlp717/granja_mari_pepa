
const db = require('./app/config/odbcConfig');

async function checkProv() {
    try {
        await db.initialize();
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
              AND (COLUMN_NAME LIKE '%PROV%' OR COLUMN_TEXT LIKE '%PROV%')
        `);
        console.log("PROV COLS:", JSON.stringify(cols, null, 2));
    } catch (e) { console.error(e); } finally { await db.close(); }
}
checkProv();
