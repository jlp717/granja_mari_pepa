
const db = require('./app/config/odbcConfig');

async function findColsByDescription() {
    try {
        await db.initialize();

        console.log("--- Searching columns with 'PROVINCIA' or 'POBLACION' in description ---");
        const results = await db.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSED' 
              AND (UPPER(COLUMN_TEXT) LIKE '%PROVINCIA%' OR UPPER(COLUMN_TEXT) LIKE '%POBLACION%')
        `);
        console.log("Results:", JSON.stringify(results, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findColsByDescription();
