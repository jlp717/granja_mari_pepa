
const db = require('./app/config/odbcConfig');

async function checkDistLength() {
    try {
        await db.initialize();
        console.log("--- Checking DISTRIBUIDOR in DSEDAC.MEDL1 ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = 'MEDL1'
              AND COLUMN_NAME = 'DISTRIBUIDOR'
        `);
        console.log(JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
checkDistLength();
