
const db = require('./app/config/odbcConfig');

async function updateViewWithClientName() {
    try {
        await db.initialize();

        // No need to rebuild UDTF if it already has DISTRIBUIDOR (it does from previous step)
        // Just Drop and Recreate View
        console.log("Updating View JAVIER.V_MEDIOS_POWERBI...");

        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) { }

        const createView = `
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                M.CODIGOMEDIO,
                M.NUMEROSERIE,
                M.DESCRIPCIONMEDIO,
                M.ESTADOMEDIO,
                
                -- Client Name Logic
                -- User indicated 'NOMBRE ALTERNATIVO' -> We map DISTRIBUIDOR here based on data analysis
                M.DISTRIBUIDOR AS NOMBRE_CLIENTE, 
                M.CODIGOCLIENTE,
                
                M.TIPOMEDIO,
                M.MARCA,
                M.CAPACIDAD,
                M.OBSERVACIONES1,
                M.MOTIVOVENTA,

                -- Logic Categories
                CASE 
                    WHEN M.DESCRIPCIONMEDIO LIKE '%FRAPE%' OR M.DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%NESTLE%' OR M.DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,

                -- Date
                CASE 
                    WHEN M.ANOALTA > 1900 THEN 
                        DATE(RTRIM(CHAR(M.ANOALTA))||'-'||RIGHT('0'||RTRIM(CHAR(M.MESALTA)),2)||'-'||RIGHT('0'||RTRIM(CHAR(M.DIAALTA)),2)) 
                    ELSE NULL 
                END AS FECHA_ALTA

            FROM TABLE(JAVIER.FN_GET_MEDIOS()) AS M
        `;

        await db.query(createView);
        console.log("✅ View Updated with NOMBRE_CLIENTE (Distribuidor).");

        // Verify
        const check = await db.query("SELECT CODIGOMEDIO, NOMBRE_CLIENTE FROM JAVIER.V_MEDIOS_POWERBI FETCH FIRST 5 ROWS ONLY");
        console.log("Check Data:", JSON.stringify(check, null, 2));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
updateViewWithClientName();
