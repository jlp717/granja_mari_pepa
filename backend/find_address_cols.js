
const db = require('./app/config/odbcConfig');

async function findAddressColumns() {
    try {
        await db.initialize();

        console.log("--- Searching Address Columns in LACLAE ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSED' AND TABLE_NAME = 'LACLAE'
              AND (
                  COLUMN_NAME LIKE '%PROV%' OR 
                  COLUMN_NAME LIKE '%POB%' OR 
                  COLUMN_NAME LIKE '%DOM%' OR
                  COLUMN_NAME LIKE '%DIR%' OR
                  COLUMN_NAME LIKE '%NAME%' OR
                  COLUMN_NAME LIKE '%NOMB%'
              )
        `);
        console.log(JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findAddressColumns();
