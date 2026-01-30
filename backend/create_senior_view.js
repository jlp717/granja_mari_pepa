
const db = require('./app/config/odbcConfig');

async function createSeniorView() {
    try {
        await db.initialize();

        // 1. Check/Create Schema JAVIER (Implicitly usually exists if user logs in, but good to check)
        // We can't easily CREATE SCHEMA without privs, so we assume it exists or use QGPL if needed, but user asked for JAVIER.

        // 2. Drop old attempts
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }

        // 3. Create View using CTE Wrapper to try and bypass "Logical File" restriction
        // or just clean selection.
        console.log("Attempting CREATE VIEW in JAVIER schema...");

        const sql = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            WITH RAW_DATA AS (
                SELECT 
                    M.CODIGOMEDIO, M.NUMEROSERIE, M.CODIGONFC, M.TIPOMEDIO, M.MARCA, M.CAPACIDAD, 
                    M.DESCRIPCIONMEDIO, M.ESTADOMEDIO, M.CODIGOCLIENTE,
                    M.ANOALTA, M.MESALTA, M.DIAALTA,
                    M.ANOBAJA, M.MESBAJA, M.DIABAJA
                FROM DSEDAC.MEDL1 M
            )
            SELECT 
                R.CODIGOMEDIO,
                R.DESCRIPCIONMEDIO,
                R.ESTADOMEDIO,
                CASE 
                    WHEN R.DESCRIPCIONMEDIO LIKE '%FRAPE%' THEN 'FRAPE'
                    WHEN R.DESCRIPCIONMEDIO LIKE '%NESTLE%' THEN 'NESTLE'
                    ELSE 'OTRO' 
                END AS CATEGORIA,
                CASE WHEN R.ANOALTA > 1900 THEN DATE(RTRIM(CHAR(R.ANOALTA))||'-'||RTRIM(CHAR(R.MESALTA))||'-'||RTRIM(CHAR(R.DIAALTA))) ELSE NULL END AS FECHA_ALTA
            FROM RAW_DATA R
        `;

        await db.query(sql);
        console.log("✅ SUCCESS: View JAVIER.V_MEDIOS_POWERBI created using CTE wrapper.");

    } catch (e) {
        console.error("❌ FAILED:", e.message);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
createSeniorView();
