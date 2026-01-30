
const db = require('./app/config/odbcConfig');

async function findPhysical() {
    try {
        await db.initialize();

        console.log("--- 1. Inspecting MEDL1 Metadata ---");
        try {
            const meta = await db.query(`
                SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE, SYSTEM_TABLE_NAME 
                FROM QSYS2.SYSTABLES 
                WHERE SYSTEM_TABLE_NAME = 'MEDL1' AND TABLE_SCHEMA = 'DSEDAC'
            `);
            console.log("MEDL1 Metadata:", meta);
        } catch (e) { console.log("Error querying SYSTABLES for MEDL1:", e.message); }

        console.log("\n--- 2. Searching for Physical Files (PF) with 'MED' in name in DSEDAC ---");
        try {
            const tables = await db.query(`
                SELECT TABLE_NAME, TABLE_TEXT, SYSTEM_TABLE_NAME 
                FROM QSYS2.SYSTABLES 
                WHERE TABLE_SCHEMA = 'DSEDAC' 
                  AND TABLE_TYPE = 'P' 
                  AND (TABLE_NAME LIKE '%MED%' OR SYSTEM_TABLE_NAME LIKE '%MED%')
            `);
            console.log("Potential Physical Tables:", tables);
        } catch (e) { console.log("Error searching PFs:", e.message); }

    } catch (e) {
        console.error("Global Error:", e);
    } finally {
        await db.close();
    }
}

findPhysical();
