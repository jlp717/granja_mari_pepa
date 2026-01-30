
const db = require('./app/config/odbcConfig');

async function findNameCol() {
    try {
        await db.initialize();
        console.log("--- Searching Name Columns in DSEDAC.CLI ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
              AND (
                COLUMN_NAME LIKE '%NOM%' OR 
                COLUMN_NAME LIKE '%RAZ%' OR
                COLUMN_TEXT LIKE '%NOM%' OR
                COLUMN_TEXT LIKE '%RAZ%'
              )
        `);
        console.log("NAME COLS:", JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findNameCol();
