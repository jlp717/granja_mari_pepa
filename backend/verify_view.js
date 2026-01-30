
const db = require('./app/config/odbcConfig');

async function verifyView() {
    try {
        await db.initialize();

        console.log("--- Testing JAVIER.V_MEDIOS_POWERBI ---");
        const rows = await db.query(`
            SELECT * FROM JAVIER.V_MEDIOS_POWERBI 
            FETCH FIRST 5 ROWS ONLY
        `);
        console.log(JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
verifyView();
