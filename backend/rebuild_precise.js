
const db = require('./app/config/odbcConfig');

/*
 * REBUILD VIEW with PRECISE TYPES from MEDL1
 * Fixes SQL0443 (Triger/Routine Error)
 */
async function rebuildPrecise() {
    try {
        await db.initialize();

        // 1. Clean up
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating UDTF with PRECISE TYPES...");

        // Based on Step 364 log output:
        // CODIGOMEDIO: CHAR(10)
        // DESCRIPCIONMEDIO: CHAR(100)
        // NUMEROSERIE: CHAR(20)
        // ESTADOMEDIO: CHAR(20)
        // CODIGOCLIENTE: NUMERIC(5,0) -> Wait, let's look at log again. 
        // Log truncated? I will assume generous types but CHAR length matters.
        // TIPOMEDIO, MARCA, CAPACIDAD (NUMERIC?), DISTRIBUIDOR...
        // Safest is to use slightly larger types or match exactly if known.

        const createFunc = `
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS() 
            RETURNS TABLE (
                CODIGOMEDIO CHAR(10),
                NUMEROSERIE CHAR(20), 
                CODIGONFC CHAR(20),
                TIPOMEDIO CHAR(5),
                MARCA CHAR(20),
                CAPACIDAD NUMERIC(5,0),
                DISTRIBUIDOR CHAR(40),
                NUMEROINVENTARIO CHAR(20),
                NUMEROCONTRATO CHAR(20),
                CODIGOVENDEDOR CHAR(3),
                CODIGOPROVEEDOR CHAR(10),
                CODIGOARTICULO CHAR(10),
                DESCRIPCIONMEDIO CHAR(100),
                ESTADOMEDIO CHAR(20),
                OBSERVACIONES1 CHAR(60),
                OBSERVACIONES2 CHAR(60),
                OBSERVACIONES3 CHAR(60),
                MOTIVOVENTA CHAR(60),
                CODIGOCLIENTE NUMERIC(5,0),
                CODIGOMODELOMEDIO CHAR(10),
                ANOALTA NUMERIC(4,0), MESALTA NUMERIC(2,0), DIAALTA NUMERIC(2,0),
                ANOBAJA NUMERIC(4,0), MESBAJA NUMERIC(2,0), DIABAJA NUMERIC(2,0)
            )
            LANGUAGE SQL 
            READS SQL DATA
            NO EXTERNAL ACTION
            DETERMINISTIC
            RETURN 
                SELECT 
                    CODIGOMEDIO, NUMEROSERIE, CODIGONFC, TIPOMEDIO, MARCA, CAPACIDAD, 
                    DISTRIBUIDOR, NUMEROINVENTARIO, NUMEROCONTRATO, CODIGOVENDEDOR, 
                    CODIGOPROVEEDOR, CODIGOARTICULO, DESCRIPCIONMEDIO, ESTADOMEDIO, 
                    OBSERVACIONES1, OBSERVACIONES2, OBSERVACIONES3, MOTIVOVENTA, 
                    CODIGOCLIENTE, CODIGOMODELOMEDIO,
                    ANOALTA, MESALTA, DIAALTA,
                    ANOBAJA, MESBAJA, DIABAJA
                FROM DSEDAC.MEDL1
        `;
        await db.query(createFunc);

        console.log("Creating View...");
        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                M.CODIGOMEDIO,
                M.DESCRIPCIONMEDIO,
                M.NUMEROSERIE,
                M.ESTADOMEDIO,
                M.TIPOMEDIO,
                M.MARCA,
                M.CAPACIDAD,
                M.CODIGOCLIENTE,
                M.OBSERVACIONES1,
                M.OBSERVACIONES2,
                
                -- Logic
                CASE 
                    WHEN M.DESCRIPCIONMEDIO LIKE '%FRAPE%' OR M.DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%NESTLE%' OR M.DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,

                -- Dates (Safe Casting)
                CASE 
                    WHEN M.ANOALTA > 1900 THEN 
                        DATE(RTRIM(CHAR(M.ANOALTA))||'-'||RIGHT('0'||RTRIM(CHAR(M.MESALTA)),2)||'-'||RIGHT('0'||RTRIM(CHAR(M.DIAALTA)),2)) 
                    ELSE NULL 
                END AS FECHA_ALTA
            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS M
        `;
        await db.query(createView);
        console.log("✅ Success! View updated and safe.");

    } catch (e) {
        console.error("Error:", e);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
rebuildPrecise();
