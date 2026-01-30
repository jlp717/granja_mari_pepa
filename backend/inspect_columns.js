
const db = require('./app/config/odbcConfig');

async function inspect() {
    try {
        await db.initialize();
        console.log("Connected.");

        const tables = [
            'DSED.LACLAE',
            'MEDL1',
            'DSED.MOD_MEDIO', // Trying with schema
            'MOD_MEDIO' // Retrying original
        ];

        for (const table of tables) {
            console.log(`\n--- Columns for ${table} ---`);
            try {
                const result = await db.query(`SELECT * FROM ${table} LIMIT 1`);
                if (result.length > 0) {
                    console.log(Object.keys(result[0]).join(', '));
                    console.log("Sample:", JSON.stringify(result[0], null, 2));
                } else {
                    console.log("Empty table.");
                }
            } catch (e) {
                try {
                    const result = await db.query(`SELECT * FROM ${table} FETCH FIRST 1 ROWS ONLY`);
                    if (result.length > 0) {
                        console.log(Object.keys(result[0]).join(', '));
                    }
                } catch (e2) {
                    console.log(`Error: ${e2.message}`);
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
