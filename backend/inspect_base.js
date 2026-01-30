
const db = require('./app/config/odbcConfig');

async function inspectBase() {
    try {
        await db.initialize();

        console.log("--- Inspecting MEDL1 Base Table Info ---");
        // QSYS2.SYSTABLES contains mapping from Logical (View/Index) to Base (Physical)
        // Note: Column names might vary by OS version, checking standard ones.
        const meta = await db.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, BASE_TABLE_SCHEMA, BASE_TABLE_NAME
            FROM QSYS2.SYSTABLES 
            WHERE SYSTEM_TABLE_NAME = 'MEDL1' OR TABLE_NAME = 'MEDL1'
        `);
        console.log(JSON.stringify(meta, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
inspectBase();
