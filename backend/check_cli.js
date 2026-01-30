
const db = require('./app/config/odbcConfig');

async function checkCli() {
    try {
        await db.initialize();

        console.log("--- Columns of DSEDAC.CLI ---");
        const cols = await db.query(`
            SELECT COLUMN_NAME, COLUMN_TEXT, DATA_TYPE, LENGTH 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' 
              AND TABLE_NAME = 'CLI'
        `);
        console.log(JSON.stringify(cols, null, 2));

        console.log("\n--- Validating Join Key ---");
        // Check finding 4300004113 in CLI
        try {
            const rows = await db.query(`SELECT * FROM DSEDAC.CLI FETCH FIRST 1 ROWS ONLY`);
            console.log("Sample Row:", JSON.stringify(rows[0], null, 2));
        } catch (e) { console.log("Cant fetch row"); }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
checkCli();
