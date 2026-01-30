
const db = require('./app/config/odbcConfig');

async function inspectLaclae() {
    try {
        await db.initialize();

        console.log("--- Columns for DSED.LACLAE (Clients) ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSED' AND TABLE_NAME = 'LACLAE'
        `);
        console.log("LACLAE Columns:", JSON.stringify(cols, null, 2));

        console.log("\n--- Columns for DSEDAC.MMDL1 (Models) ---");
        const colsModel = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'MMDL1'
        `);
        console.log("MMDL1 Columns:", JSON.stringify(colsModel, null, 2));


    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
inspectLaclae();
