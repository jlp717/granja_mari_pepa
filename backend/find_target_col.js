
const db = require('./app/config/odbcConfig');

async function findCol() {
    try {
        await db.initialize();

        console.log("--- Searching MEDL1 for 'NOMBRE' or 'ALT' or 'CLIENTE' ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT, DATA_TYPE, LENGTH
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = 'MEDL1'
              AND (
                  UPPER(COLUMN_TEXT) LIKE '%NOMBRE%' OR 
                  UPPER(COLUMN_TEXT) LIKE '%ALT%' OR
                  UPPER(COLUMN_TEXT) LIKE '%CLIENTE%' OR
                  COLUMN_NAME LIKE '%NOM%'
              )
        `);
        console.log(JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findCol();
