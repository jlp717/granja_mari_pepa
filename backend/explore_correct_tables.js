
const db = require('./app/config/odbcConfig');

async function inspect() {
    try {
        await db.initialize();
        console.log("Connected.");

        const tables = [
            'DSEDAC.CLC',
            'DSEDAC.CLIL1',
            'DSED.LACLAE',
            'DSEDAC.MEDL1',
            'DSEDAC.MMDL1'
        ];

        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            try {
                // Try standard LIMIT 1
                const result = await db.query(`SELECT * FROM ${table} LIMIT 1`);
                if (result.length > 0) {
                    console.log("Columns:", Object.keys(result[0]).join(', '));
                    console.log("Sample:", JSON.stringify(result[0], null, 2));
                }
            } catch (e) {
                try {
                    // Try DB2 syntax
                    const result = await db.query(`SELECT * FROM ${table} FETCH FIRST 1 ROWS ONLY`);
                    if (result.length > 0) {
                        console.log("Columns:", Object.keys(result[0]).join(', '));
                        console.log("Sample:", JSON.stringify(result[0], null, 2));
                    }
                } catch (e2) {
                    console.log(`Error querying ${table}: ${e2.message}`);
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

inspect();
