
const db = require('./app/config/odbcConfig');

async function findLcncl() {
    try {
        await db.initialize();

        console.log("--- Searching for LCNCL (Client Name) ---");
        const tables = await db.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE COLUMN_NAME = 'LCNCL' OR COLUMN_NAME = 'LCNOM'
            FETCH FIRST 10 ROWS ONLY
        `);
        console.log("Found:", JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findLcncl();
