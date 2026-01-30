
const db = require('./app/config/odbcConfig');

async function createNewView() {
    try {
        await db.initialize();

        console.log("Creating JAVIER.V_MEDIOS_POWERBI_OPTIMIZED...");

        // This view points to V2 UDTF which we know was created successfully
        // (Step 490 showed 'UDTF V2 Created' implicitly or execution passed it)
        // Wait, I should verify V2 UDTF exists? 
        // The previous script executed `await db.query(createFunc)` and printed `Note...` if error.
        // I'll ensure the UDTF exists or recreate it here just in case.

        try {
            const createFunc = `
                CREATE OR REPLACE FUNCTION JAVIER.FN_GET_MEDIOS_V2() 
                RETURNS TABLE (
                    CODIGOMEDIO VARCHAR(20),
                    NUMEROSERIE VARCHAR(50), 
                    DESCRIPCIONMEDIO VARCHAR(100),
                    ESTADOMEDIO VARCHAR(50),
                    DISTRIBUIDOR VARCHAR(100),
                    TIPOMEDIO VARCHAR(20),
                    MARCA VARCHAR(50),
                    CAPACIDAD VARCHAR(50),
                    OBSERVACIONES1 VARCHAR(100),
                    MOTIVOVENTA VARCHAR(100),
                    CODIGOCLIENTE VARCHAR(50),
                    ANOALTA NUMERIC(4,0), MESALTA NUMERIC(2,0), DIAALTA NUMERIC(2,0)
                )
                LANGUAGE SQL 
                READS SQL DATA
                NO EXTERNAL ACTION
                DETERMINISTIC
                RETURN 
                    SELECT 
                        CAST(CODIGOMEDIO AS VARCHAR(20)),
                        CAST(NUMEROSERIE AS VARCHAR(50)),
                        CAST(DESCRIPCIONMEDIO AS VARCHAR(100)),
                        CAST(ESTADOMEDIO AS VARCHAR(50)),
                        CAST(DISTRIBUIDOR AS VARCHAR(100)),
                        CAST(TIPOMEDIO AS VARCHAR(20)),
                        CAST(MARCA AS VARCHAR(50)),
                        CAST(CAPACIDAD AS VARCHAR(50)),
                        CAST(OBSERVACIONES1 AS VARCHAR(100)),
                        CAST(MOTIVOVENTA AS VARCHAR(100)),
                        CAST(CODIGOCLIENTE AS VARCHAR(50)),
                        CAST(ANOALTA AS NUMERIC(4,0)),
                        CAST(MESALTA AS NUMERIC(2,0)),
                        CAST(DIAALTA AS NUMERIC(2,0))
                    FROM DSEDAC.MEDL1
            `;
            await db.query(createFunc);
        } catch (e) { }

        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI_OPTIMIZED AS 
            SELECT 
                TRIM(CODIGOMEDIO) AS CODIGOMEDIO, 
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

            FROM TABLE(JAVIER.FN_GET_MEDIOS_V2()) AS T
        `;

        // Safety: Drop optimized view if exists from previous attempt
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI_OPTIMIZED"); } catch (e) { }

        await db.query(createView);
        console.log("✅ SUCCESS: JAVIER.V_MEDIOS_POWERBI_OPTIMIZED Created!");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
createNewView();
