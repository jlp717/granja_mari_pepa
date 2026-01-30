
const db = require('./app/config/odbcConfig');

async function listAllCols() {
    try {
        await db.initialize();

        console.log("--- First 50 Columns of LACLAE ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSED' AND TABLE_NAME = 'LACLAE'
            ORDER BY ORDINAL_POSITION
            FETCH FIRST 50 ROWS ONLY
        `);
        console.log(JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
listAllCols();
