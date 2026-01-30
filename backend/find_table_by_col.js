
const db = require('./app/config/odbcConfig');

async function findTableByColumn() {
    try {
        await db.initialize();

        console.log("--- Searching for Table with Column LCPROV ---");
        const tables = await db.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_TEXT 
            FROM QSYS2.SYSCOLUMNS 
            WHERE COLUMN_NAME = 'LCPROV'
        `);
        console.log(JSON.stringify(tables, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
findTableByColumn();
