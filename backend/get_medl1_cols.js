
const db = require('./app/config/odbcConfig');

async function checkMedl1Cols() {
    try {
        await db.initialize();
        console.log("--- Columns of DSEDAC.MEDL1 ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = 'MEDL1'
        `);
        console.log(JSON.stringify(cols, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
checkMedl1Cols();
