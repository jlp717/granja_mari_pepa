
const db = require('./app/config/odbcConfig');

async function checkDsedacLaclae() {
    try {
        await db.initialize();

        console.log("--- Columns of DSEDAC.LACLAE ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = 'LACLAE'
        `);
        console.log(JSON.stringify(cols, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
checkDsedacLaclae();
