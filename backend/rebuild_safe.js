
const db = require('./app/config/odbcConfig');

async function rebuildSafe() {
    try {
        await db.initialize();

        // Drop
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating UDTF with EXPLICIT CASTING...");

        // We define the UDTF and force every column to match via CAST in the SELECT
        const createFunc = `
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS() 
            RETURNS TABLE (
                CODIGOMEDIO CHAR(10),
                NUMEROSERIE CHAR(20), 
                DESCRIPCIONMEDIO CHAR(100),
                ESTADOMEDIO CHAR(20),
                DISTRIBUIDOR CHAR(40),
                
                TIPOMEDIO CHAR(5),
                MARCA CHAR(20),
                CAPACIDAD NUMERIC(5,0),
                OBSERVACIONES1 CHAR(60),
                MOTIVOVENTA CHAR(60),
                
                CODIGOCLIENTE NUMERIC(5,0),
                ANOALTA NUMERIC(4,0), MESALTA NUMERIC(2,0), DIAALTA NUMERIC(2,0)
            )
            LANGUAGE SQL 
            READS SQL DATA
            NO EXTERNAL ACTION
            DETERMINISTIC
            RETURN 
                SELECT 
                    CAST(CODIGOMEDIO AS CHAR(10)),
                    CAST(NUMEROSERIE AS CHAR(20)),
                    CAST(DESCRIPCIONMEDIO AS CHAR(100)),
                    CAST(ESTADOMEDIO AS CHAR(20)),
                    CAST(DISTRIBUIDOR AS CHAR(40)),
                    
                    CAST(TIPOMEDIO AS CHAR(5)),
                    CAST(MARCA AS CHAR(20)),
                    CAST(CAPACIDAD AS NUMERIC(5,0)),
                    CAST(OBSERVACIONES1 AS CHAR(60)),
                    CAST(MOTIVOVENTA AS CHAR(60)),
                    
                    CAST(CODIGOCLIENTE AS NUMERIC(5,0)),
                    CAST(ANOALTA AS NUMERIC(4,0)),
                    CAST(MESALTA AS NUMERIC(2,0)),
                    CAST(DIAALTA AS NUMERIC(2,0))
                FROM DSEDAC.MEDL1
        `;
        await db.query(createFunc);

        console.log("Creating View...");
        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                CODIGOMEDIO, 
                NUMEROSERIE, 
                DESCRIPCIONMEDIO, 
                ESTADOMEDIO,
                
                -- Client Name Logic (Validated)
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
        console.log("✅ Success! View Updated safely.");

    } catch (e) {
        console.error("Error:", e);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
rebuildSafe();
