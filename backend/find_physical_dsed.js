
const db = require('./app/config/odbcConfig');

async function findPhysical() {
    try {
        await db.initialize();

        // Search in DSED (Data Library) instead of DSEDAC (Access/Logical Library)
        const tables = await db.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE 
            FROM QSYS2.SYSTABLES 
            WHERE TABLE_SCHEMA = 'DSED' 
              AND TABLE_TYPE = 'P' 
              AND (TABLE_NAME LIKE '%MED%' OR TABLE_NAME LIKE '%MAE%')
        `);
        console.log("FOUND TABLES IN DSED:");
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findPhysical();
