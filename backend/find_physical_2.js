
const db = require('./app/config/odbcConfig');

async function findPhysical() {
    try {
        await db.initialize();

        const tables = await db.query(`
            SELECT TABLE_NAME, TABLE_TYPE, SYSTEM_TABLE_NAME 
            FROM QSYS2.SYSTABLES 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_TYPE = 'P' 
              AND (TABLE_NAME LIKE '%MED%' OR SYSTEM_TABLE_NAME LIKE '%MED%')
        `);
        console.log("FOUND TABLES:");
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findPhysical();
