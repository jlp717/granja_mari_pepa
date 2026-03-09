
const db = require('../app/config/odbcConfig');

async function inspectSchema() {
    try {
        console.log("Initializing DB...");
        await db.initialize();

        const tables = [
            'SECURITY_AUDIT'
        ];

        for (const table of tables) {
            console.log(`\n--- SCHEMA FOR JAVIER.${table} ---`);
            const query = `
                SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE, IS_NULLABLE
                FROM QSYS2.SYSCOLUMNS 
                WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = '${table}'
                ORDER BY ORDINAL_POSITION
            `;

            const columns = await db.query(query);

            if (columns.length === 0) {
                console.log(`⚠️ TABLE JAVIER.${table} FOUND BUT HAS NO COLUMNS (OR PERMISSION ISSUE)`);
            } else {
                columns.forEach(c => {
                    console.log(`${c.COLUMN_NAME.padEnd(30)} | ${c.DATA_TYPE.padEnd(10)} | Len: ${c.LENGTH} | Null: ${c.IS_NULLABLE}`);
                });
            }
        }

    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        await db.close();
    }
}

inspectSchema();
