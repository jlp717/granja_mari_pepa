
const db = require('./app/config/odbcConfig');

async function verifySafe() {
    try {
        await db.initialize();

        console.log("--- Final Verification of JAVIER.V_MEDIOS_POWERBI ---");
        const rows = await db.query(`
            SELECT CODIGOMEDIO, NOMBRE_CLIENTE, DESCRIPCIONMEDIO 
            FROM JAVIER.V_MEDIOS_POWERBI 
            FETCH FIRST 3 ROWS ONLY
        `);
        console.log("Rows:", JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
verifySafe();
