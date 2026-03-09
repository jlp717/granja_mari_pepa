
const db = require('./app/config/odbcConfig');

async function createFunctionWrapper() {
    try {
        await db.initialize();

        // 1. Drop old
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        // 2. Create UDTF (Table Function)
        // Note: Defining columns explicitly is safer
        console.log("Attempting CREATE FUNCTION JAVIER.FN_GET_MEDIOS...");

        const createFunc = `
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS() 
            RETURNS TABLE (
                CODIGOMEDIO CHAR(10),
                NUMEROSERIE CHAR(20), 
                DESCRIPCIONMEDIO CHAR(60),
                ESTADOMEDIO CHAR(20),
                CODIGOCLIENTE NUMERIC(5,0),
                ANOALTA NUMERIC(4,0),
                MESALTA NUMERIC(2,0),
                DIAALTA NUMERIC(2,0)
            )
            LANGUAGE SQL 
            READS SQL DATA
            NO EXTERNAL ACTION
            DETERMINISTIC
            RETURN 
                SELECT 
                    CODIGOMEDIO, NUMEROSERIE, DESCRIPCIONMEDIO, ESTADOMEDIO, CODIGOCLIENTE,
                    ANOALTA, MESALTA, DIAALTA
                FROM DSEDAC.MEDL1
        `;

        await db.query(createFunc);
        console.log("✅ FUNCTION CREATED!");

        // 3. Create View on Function
        console.log("Attempting CREATE VIEW using Function...");
        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                CODIGOMEDIO,
                DESCRIPCIONMEDIO,
                CASE 
                    WHEN DESCRIPCIONMEDIO LIKE '%FRAPE%' THEN 'FRAPE'
                    WHEN DESCRIPCIONMEDIO LIKE '%NESTLE%' THEN 'NESTLE'
                    ELSE 'OTRO' 
                END AS CATEGORIA,
                CASE WHEN ANOALTA > 1900 THEN DATE(RTRIM(CHAR(ANOALTA))||'-'||RTRIM(CHAR(MESALTA))||'-'||RTRIM(CHAR(DIAALTA))) ELSE NULL END AS FECHA_ALTA
            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS T
        `;

        await db.query(createView);
        console.log("✅ VIEW CREATED SUCCESSFULLY (Wrapper Worked)!");

    } catch (e) {
        console.error("❌ FAILED:", e.message);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
createFunctionWrapper();
