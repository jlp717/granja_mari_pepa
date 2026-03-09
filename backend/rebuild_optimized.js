
const db = require('./app/config/odbcConfig');

/*
 * OPTIMIZED REBUILD - FIXING TRUNCATION
 * Problem: CODIGOCLIENTE was NUMERIC(5,0) -> Max 99999. Actual data > 4000000000.
 * Solution: Increase all NUMERIC precisions to safe limits (e.g. 15 or 20).
 */
async function rebuildOptimized() {
    try {
        await db.initialize();

        // Drop
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating UDTF with CORRECT PRECISION...");

        const createFunc = `
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS() 
            RETURNS TABLE (
                CODIGOMEDIO CHAR(10),
                NUMEROSERIE CHAR(30), 
                DESCRIPCIONMEDIO CHAR(100),
                ESTADOMEDIO CHAR(30),
                DISTRIBUIDOR CHAR(50),
                
                TIPOMEDIO CHAR(10),
                MARCA CHAR(30),
                CAPACIDAD NUMERIC(15, 2), -- Increased from 5,0
                OBSERVACIONES1 CHAR(100),
                MOTIVOVENTA CHAR(100),
                
                CODIGOCLIENTE NUMERIC(15, 0), -- Increased from 5,0 (critical fix)
                ANOALTA NUMERIC(4,0), MESALTA NUMERIC(2,0), DIAALTA NUMERIC(2,0)
            )
            LANGUAGE SQL 
            READS SQL DATA
            NO EXTERNAL ACTION
            DETERMINISTIC
            RETURN 
                SELECT 
                    CAST(CODIGOMEDIO AS CHAR(10)),
                    CAST(NUMEROSERIE AS CHAR(30)),
                    CAST(DESCRIPCIONMEDIO AS CHAR(100)),
                    CAST(ESTADOMEDIO AS CHAR(30)),
                    CAST(DISTRIBUIDOR AS CHAR(50)),
                    
                    CAST(TIPOMEDIO AS CHAR(10)),
                    CAST(MARCA AS CHAR(30)),
                    CAST(CAPACIDAD AS NUMERIC(15, 2)),
                    CAST(OBSERVACIONES1 AS CHAR(100)),
                    CAST(MOTIVOVENTA AS CHAR(100)),
                    
                    CAST(CODIGOCLIENTE AS NUMERIC(15, 0)),
                    CAST(ANOALTA AS NUMERIC(4,0)),
                    CAST(MESALTA AS NUMERIC(2,0)),
                    CAST(DIAALTA AS NUMERIC(2,0))
                FROM DSEDAC.MEDL1
        `;
        await db.query(createFunc);

        console.log("Creating View with Indexes/Optimization Notes...");
        // Note: We cannot create a physical INDEX on a VIEW. 
        // But simply having correct types speeds up Power BI import (no retry/errors).

        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                CODIGOMEDIO, 
                NUMEROSERIE, 
                DESCRIPCIONMEDIO, 
                ESTADOMEDIO,
                
                -- Client Name Logic
                DISTRIBUIDOR AS NOMBRE_CLIENTE,
                CODIGOCLIENTE,
                
                TIPOMEDIO, 
                MARCA, 
                CAPACIDAD, 
                OBSERVACIONES1,
                MOTIVOVENTA,

                -- Logic
                CASE 
                    WHEN DESCRIPCIONMEDIO LIKE '%FRAPE%' OR DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN DESCRIPCIONMEDIO LIKE '%NESTLE%' OR DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,

                -- Date
                CASE 
                    WHEN ANOALTA > 1900 THEN 
                        DATE(RTRIM(CHAR(ANOALTA))||'-'||RIGHT('0'||RTRIM(CHAR(MESALTA)),2)||'-'||RIGHT('0'||RTRIM(CHAR(DIAALTA)),2)) 
                    ELSE NULL 
                END AS FECHA_ALTA

            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS T
        `;
        await db.query(createView);
        console.log("✅ Success! View Updated with High Precision.");

    } catch (e) {
        console.error("Error:", e);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
rebuildOptimized();
