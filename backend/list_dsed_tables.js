
const db = require('./app/config/odbcConfig');

async function listTables() {
    try {
        await db.initialize();
        console.log("--- First 100 Tables in DSED ---");
        const tables = await db.query(`
            SELECT TABLE_NAME, TABLE_TEXT 
            FROM QSYS2.SYSTABLES 
            WHERE TABLE_SCHEMA = 'DSED' 
            FETCH FIRST 100 ROWS ONLY
        `);
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
listTables();
