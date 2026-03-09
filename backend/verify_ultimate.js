
const db = require('./app/config/odbcConfig');

async function verifyUltimate() {
    try {
        await db.initialize();

        console.log("--- ULTIMATE VIEW VERIFICATION ---");
        const rows = await db.query(`
            SELECT 
                CODIGOMEDIO, 
                CODIGOCLIENTE, 
                TRIM(NOMBRE_CLIENTE) AS NOMBRE,
                TRIM(POBLACION) AS POBLACION,
                CAPACIDAD,
                TRIM(DESCRIPCIONMEDIO) AS DESC
            FROM JAVIER.V_MEDIOS_POWERBI 
            WHERE NOMBRE_CLIENTE IS NOT NULL AND NOMBRE_CLIENTE <> ''
            FETCH FIRST 5 ROWS ONLY
        `);
        console.log("Data:", JSON.stringify(rows, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
verifyUltimate();
