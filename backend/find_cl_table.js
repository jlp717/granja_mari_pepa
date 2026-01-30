
const db = require('./app/config/odbcConfig');

async function findClientTableByPrefix() {
    try {
        await db.initialize();

        console.log("--- Searching tables with columns starting with CL... ---");
        const tables = await db.query(`
            SELECT DISTINCT TABLE_NAME 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSED' 
              AND COLUMN_NAME LIKE 'CL%'
            FETCH FIRST 20 ROWS ONLY
        `);
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findClientTableByPrefix();
