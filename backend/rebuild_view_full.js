
const db = require('./app/config/odbcConfig');

async function updateSeniorView() {
    try {
        await db.initialize();

        // Drop old
        console.log("Dropping old objects...");
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating Full UDTF...");
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
                DESCRIPCIONMEDIO CHAR(60),
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
                M.*,
                CASE 
                    WHEN DESCRIPCIONMEDIO LIKE '%FRAPE%' OR DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN DESCRIPCIONMEDIO LIKE '%NESTLE%' OR DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,
                CASE WHEN ANOALTA > 1900 THEN DATE(RTRIM(CHAR(ANOALTA))||'-'||RTRIM(CHAR(MESALTA))||'-'||RTRIM(CHAR(DIAALTA))) ELSE NULL END AS FECHA_ALTA
            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS M
        `;
        await db.query(createView);
        console.log("✅ Success! View updated with ALL columns.");

    } catch (e) {
        console.error("Error:", e);
        if (e.odbcErrors) console.log(e.odbcErrors);
    } finally {
        await db.close();
    }
}
updateSeniorView();
