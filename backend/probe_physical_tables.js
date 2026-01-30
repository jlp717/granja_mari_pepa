
const db = require('./app/config/odbcConfig');

async function probe() {
    try {
        await db.initialize();
        // Common Physical file naming conventions for MEDL1 -> MMED, MEDP, MEDIOS, MMEDIO
        const candidates = ['DSEDAC.MMED', 'DSEDAC.MEDP', 'DSEDAC.MEDIO', 'DSEDAC.MEDIOS', 'DSEDAC.MOD_MEDIO'];

        for (const table of candidates) {
            console.log(`Checking ${table}...`);
            try {
                const result = await db.query(`SELECT * FROM ${table} FETCH FIRST 1 ROWS ONLY`);
                console.log(`✅ FOUND ${table}! Columns:`, Object.keys(result[0]));
            } catch (e) {
                console.log(`❌ ${table} not found or error.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}
probe();
