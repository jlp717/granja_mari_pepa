
const db = require('./app/config/odbcConfig');

async function findClientMaster() {
    try {
        await db.initialize();

        console.log("--- Searching for Client Tables in DSED ---");
        const tables = await db.query(`
            SELECT TABLE_NAME, TABLE_TEXT, SYSTEM_TABLE_NAME 
            FROM QSYS2.SYSTABLES 
            WHERE TABLE_SCHEMA = 'DSED' 
              AND (TABLE_TEXT LIKE '%CLIENT%' OR TABLE_NAME LIKE '%CLI%')
        `);
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findClientMaster();
