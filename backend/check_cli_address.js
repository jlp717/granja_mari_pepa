
const db = require('./app/config/odbcConfig');

async function checkCliAddress() {
    try {
        await db.initialize();

        console.log("--- Searching Address Columns in DSEDAC.CLI ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
              AND (
                  COLUMN_NAME LIKE '%DOM%' OR 
                  COLUMN_NAME LIKE '%DIR%' OR
                  COLUMN_NAME LIKE '%POB%' OR
                  COLUMN_TEXT LIKE '%DOM%' OR
                  COLUMN_TEXT LIKE '%DIR%'
              )
        `);
        console.log("ADDRESS COLS:", JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
checkCliAddress();
