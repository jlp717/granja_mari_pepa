
const db = require('./app/config/odbcConfig');

async function verifyPrecision() {
    try {
        await db.initialize();

        console.log("--- Checking for Large Client IDs ---");
        // We select formatted string to be sure, and raw number
        const rows = await db.query(`
            SELECT CODIGOMEDIO, CODIGOCLIENTE, CAPACIDAD
            FROM JAVIER.V_MEDIOS_POWERBI 
            WHERE CODIGOCLIENTE > 99999
            FETCH FIRST 3 ROWS ONLY
        `);
        console.log("Large IDs:", JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
verifyPrecision();
