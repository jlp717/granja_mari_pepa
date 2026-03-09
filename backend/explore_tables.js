
const db = require('./app/config/odbcConfig');

async function explore() {
    try {
        console.log("Connecting to database...");
        await db.initialize();
        console.log("Connected.");

        const queries = [
            "SELECT * FROM CLIENTES LIMIT 1",
            "SELECT * FROM DSED.LACLAE LIMIT 1",
            "SELECT * FROM MEDL1 LIMIT 1",
            "SELECT * FROM MOD_MEDIO LIMIT 1"
        ];

        // Fallback for DB2/AS400 syntax if LIMIT doesn't work (FETCH FIRST 1 ROWS ONLY)
        const queriesDB2 = [
            "SELECT * FROM CLIENTES FETCH FIRST 1 ROWS ONLY",
            "SELECT * FROM DSED.LACLAE FETCH FIRST 1 ROWS ONLY",
            "SELECT * FROM MEDL1 FETCH FIRST 1 ROWS ONLY",
            "SELECT * FROM MOD_MEDIO FETCH FIRST 1 ROWS ONLY"
        ];

        for (let i = 0; i < queries.length; i++) {
            const table = queries[i].split('FROM ')[1].split(' ')[0];
            console.log(`\n--- Exploring ${table} ---`);
            try {
                // Try standard syntax first
                let result;
                try {
                    result = await db.query(queries[i]);
                } catch (e) {
                    console.log(`Standard LIMIT failed for ${table}, trying DB2 syntax...`);
                    result = await db.query(queriesDB2[i]);
                }

                if (result.length > 0) {
                    console.log("Columns:", Object.keys(result[0]));
                    console.log("Sample Data:", result[0]);
                } else {
                    console.log("Table exists but is empty.");
                }
            } catch (err) {
                console.error(`Error querying ${table}:`, err.message);
                if (err.message.includes('file not found')) {
                    console.log(`Table ${table} might have a different name. Checking system tables...`);
                    // Try to find correct name in system tables if possible
                    try {
                        const search = table.replace('DSED.', '');
                        const sysTables = await db.query(`SELECT TABLE_NAME, TABLE_SCHEMA FROM QSYS2.SYSTABLES WHERE TABLE_NAME LIKE '%${search}%' FETCH FIRST 5 ROWS ONLY`);
                        console.log("Potential matches:", sysTables);
                    } catch (e) {
                        console.log("Could not query QSYS2.SYSTABLES");
                    }
                }
            }
        }

    } catch (error) {
        console.error("Fatal error:", error);
    } finally {
        await db.close();
    }
}

explore();
