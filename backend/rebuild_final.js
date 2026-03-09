
const db = require('./app/config/odbcConfig');

/*
 * FINAL STABLE REBUILD
 * Fixes: SQL0420 (Casting blank to Numeric) and Truncation (+++++)
 * Strategy: Treat identifiers (Client, Serial) and descriptors (Capacity) as Strings (CHAR/VARCHAR).
 * Power BI handles string-to-number much better than ODBC.
 */
async function rebuildFinal() {
    try {
        await db.initialize();

        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating UDTF with ROBUST TYPES (VARCHAR)...");

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
                CAPACIDAD CHAR(20),      -- Changed to CHAR to prevent SQL0420
                OBSERVACIONES1 CHAR(100),
                MOTIVOVENTA CHAR(100),
                
                CODIGOCLIENTE CHAR(20),  -- Changed to CHAR to prevent Truncation and Errors
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
                    CAST(CAPACIDAD AS CHAR(20)),
                    CAST(OBSERVACIONES1 AS CHAR(100)),
                    CAST(MOTIVOVENTA AS CHAR(100)),
                    
                    CAST(CODIGOCLIENTE AS CHAR(20)),
                    CAST(ANOALTA AS NUMERIC(4,0)),
                    CAST(MESALTA AS NUMERIC(2,0)),
                    CAST(DIAALTA AS NUMERIC(2,0))
                FROM DSEDAC.MEDL1
        `;
        await db.query(createFunc);

        console.log("Creating Final View...");
        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                CODIGOMEDIO, 
                TRIM(NUMEROSERIE) AS NUMEROSERIE, 
                TRIM(DESCRIPCIONMEDIO) AS DESCRIPCIONMEDIO, 
                TRIM(ESTADOMEDIO) AS ESTADOMEDIO,
                
                TRIM(DISTRIBUIDOR) AS NOMBRE_CLIENTE,
                TRIM(CODIGOCLIENTE) AS CODIGOCLIENTE,
                
                TRIM(TIPOMEDIO) AS TIPOMEDIO, 
                TRIM(MARCA) AS MARCA, 
                TRIM(CAPACIDAD) AS CAPACIDAD, 
                TRIM(OBSERVACIONES1) AS OBSERVACIONES1,
                
                CASE 
                    WHEN DESCRIPCIONMEDIO LIKE '%FRAPE%' OR DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN DESCRIPCIONMEDIO LIKE '%NESTLE%' OR DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,

                CASE 
                    WHEN ANOALTA > 1900 THEN 
                        DATE(RTRIM(CHAR(ANOALTA))||'-'||RIGHT('0'||RTRIM(CHAR(MESALTA)),2)||'-'||RIGHT('0'||RTRIM(CHAR(DIAALTA)),2)) 
                    ELSE NULL 
                END AS FECHA_ALTA

            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS T
        `;
        await db.query(createView);
        console.log("✅ Success! View is bulletproof.");

    } catch (e) {
        console.error("Error:", e);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
rebuildFinal();
