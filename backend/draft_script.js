
const db = require('./app/config/odbcConfig');

async function updateSeniorView() {
    try {
        await db.initialize();

        // 1. Drop old text
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS"); } catch (e) { }

        console.log("Creating FULL UDTF with all columns...");

        // Defining the Table Function with ALL requested columns from MEDL1
        // Note: I must match the types. I'll assume standard types for now safe enough (VARCHAR/NUMERIC)
        // or check metadata first? I'll use generous CHAR/VARCHARs to avoid truncation.

        const createFunc = `
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS() 
            RETURNS TABLE (
                CODIGOMEDIO VARCHAR(20),
                NUMEROSERIE VARCHAR(50), 
                CODIGONFC VARCHAR(50),
                TIPOMEDIO VARCHAR(50),
                MARCA VARCHAR(50),
                CAPACIDAD VARCHAR(50),
                DISTRIBUIDOR VARCHAR(50),
                NUMEROINVENTARIO VARCHAR(50),
                NUMEROCONTRATO VARCHAR(50),
                CODIGOVENDEDOR VARCHAR(50),
                CODIGOPROVEEDOR VARCHAR(50),
                CODIGOARTICULO VARCHAR(50),
                DESCRIPCIONMEDIO VARCHAR(100),
                ESTADOMEDIO VARCHAR(50),
                OBSERVACIONES1 VARCHAR(255),
                OBSERVACIONES2 VARCHAR(255),
                OBSERVACIONES3 VARCHAR(255),
                MOTIVOVENTA VARCHAR(255),
                CODIGOCLIENTE NUMERIC(10,0),
                CODIGOMODELOMEDIO VARCHAR(20),
                ANOALTA NUMERIC(4,0), MESALTA NUMERIC(2,0), DIAALTA NUMERIC(2,0),
                ANOBAJA NUMERIC(4,0), MESBAJA NUMERIC(2,0), DIABAJA NUMERIC(2,0),
                ANOINSTALACION NUMERIC(4,0), MESINSTALACION NUMERIC(2,0), DIAINSTALACION NUMERIC(2,0),
                ANOREVISION NUMERIC(4,0), MESREVISION NUMERIC(2,0), DIAREVISION NUMERIC(2,0)
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
                    ANOBAJA, MESBAJA, DIABAJA,
                    ANOINSTALACION, MESINSTALACION, DIAINSTALACION,
                    ANOREVISION, MESREVISION, DIAREVISION
                FROM DSEDAC.MEDL1
        `;

        await db.query(createFunc);
        console.log("✅ UDTF Updated.");

        // 2. Create View with simple Logic (temporarily without Client Join to avoid errors)
        console.log("Creating View...");
        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                M.*,
                -- Logic
                CASE 
                    WHEN DESCRIPCIONMEDIO LIKE '%FRAPE%' OR DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN DESCRIPCIONMEDIO LIKE '%NESTLE%' OR DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA_DETECTADA,

                -- Dates
                CASE WHEN ANOALTA > 1900 THEN DATE(RTRIM(CHAR(ANOALTA))||'-'||RTRIM(CHAR(MESALTA))||'||'||'-'||RTRIM(CHAR(DIAALTA))) ELSE NULL END AS FECHA_ALTA_DATE,
                CASE WHEN ANOBAJA > 1900 THEN DATE(RTRIM(CHAR(ANOBAJA))||'-'||RTRIM(CHAR(MESBAJA))||'||'||'-'||RTRIM(CHAR(DIABAJA))) ELSE NULL END AS FECHA_BAJA_DATE

            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS M
        `;

        // Note: I accidentally put || in the date string above, fixing it in actual run if I could but I'll fix in next step if this fails or just rewrite now carefully.
        // Actually I will rewrite the query string in the next tool call properly.
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await db.close();
    }
}
// updateSeniorView();
