
const db = require('./app/config/odbcConfig');
const fs = require('fs');

async function generateScript() {
    try {
        await db.initialize();

        // 1. Get ALL MEDL1 Colums
        const mCols = await db.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'MEDL1'
        `);

        // 2. Sample CLI Row to confirm Name Column (RAZONSOCIAL vs NOMBREALTERNATIVO)
        // From previous log: "RAZONSOCIAL" and "NOMBREALTERNATIVO" exist.
        // We will select RAZONSOCIAL as primary name.

        // Generate dynamic UDTF code
        let fields = [];
        let casts = [];

        mCols.forEach(c => {
            let type = "";
            let castType = "";

            // LOGIC: Force everything to string/char except Dates if needed, 
            // but user wants safe display.
            // NUMERIC -> CHAR to avoid truncation/overflow.
            // CHAR -> CHAR
            // DATE -> CHAR?

            // We use generous VARCHAR length.
            if (c.DATA_TYPE === 'NUMERIC' || c.DATA_TYPE === 'DECIMAL' || c.DATA_TYPE === 'INTEGER') {
                type = `VARCHAR(50)`;
                castType = `VARCHAR(50)`;
            } else {
                let len = c.LENGTH > 255 ? 255 : c.LENGTH;
                if (len < 10) len = 20; // safe min
                type = `VARCHAR(${len})`;
                castType = `VARCHAR(${len})`;
            }

            fields.push(`${c.COLUMN_NAME} ${type}`);
            casts.push(`CAST(${c.COLUMN_NAME} AS ${castType})`);
        });

        const script = `
const db = require('./app/config/odbcConfig');

async function rebuildUltimate() {
    try {
        await db.initialize();

        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI"); } catch (e) {}
        try { await db.query("DROP VIEW JAVIER.V_MEDIOS_POWERBI_OPTIMIZED"); } catch (e) {}
        try { await db.query("DROP FUNCTION JAVIER.FN_GET_MEDIOS_FULL"); } catch (e) {}

        console.log("Creating ULTIMATE UDTF...");
        const createFunc = \`
            CREATE FUNCTION JAVIER.FN_GET_MEDIOS_FULL() 
            RETURNS TABLE (
${fields.join(',\n')}
            )
            LANGUAGE SQL 
           READS SQL DATA
           NO EXTERNAL ACTION
           DETERMINISTIC
           RETURN 
               SELECT 
${casts.join(',\n')}
               FROM DSEDAC.MEDL1
        \`;
        await db.query(createFunc);

        console.log("Creating ULTIMATE VIEW...");
        const createView = \`
            CREATE VIEW JAVIER.V_MEDIOS_POWERBI AS 
            SELECT 
                M.*,
                TRIM(C.NOMBRECLIENTE) AS NOMBRE_CLIENTE,
                TRIM(C.NOMBREALTERNATIVO) AS NOMBRE_CLIENTE_ALT,
                TRIM(C.POBLACION) AS POBLACION,
                TRIM(C.PROVINCIA) AS PROVINCIA,
                TRIM(C.DIRECCION) AS DOMICILIO,
                TRIM(C.CODIGORUTA) AS CODIGO_RUTA_CLIENTE,

                -- Categorization
                CASE 
                    WHEN M.DESCRIPCIONMEDIO LIKE '%FRAPE%' OR M.DESCRIPCIONMEDIO LIKE '%FRAPPE%' THEN 'FRAPE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%NESTLE%' OR M.DESCRIPCIONMEDIO LIKE '%NESTLÉ%' THEN 'NESTLE'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%VITRINA%' THEN 'VITRINA'
                    WHEN M.DESCRIPCIONMEDIO LIKE '%CAFETERA%' THEN 'CAFETERA'
                    ELSE 'OTRO' 
                END AS CATEGORIA,
                
                -- Date Formatter (Trying robust logic or NULL)
                -- M.ANOALTA is now VARCHAR, so we CAST back to INT safely or use string manipulation
                CASE 
                   WHEN TRANSLATE(M.ANOALTA, '0', '0123456789') = '' AND INT(M.ANOALTA) > 1900 THEN
                        DATE( TRIM(M.ANOALTA) || '-' || RIGHT('0'||TRIM(M.MESALTA), 2) || '-' || RIGHT('0'||TRIM(M.DIAALTA), 2) )
                   ELSE NULL
                END AS FECHA_ALTA

            FROM TABLE(JAVIER.FN_GET_MEDIOS_FULL()) AS M
            LEFT JOIN DSEDAC.CLI C ON 
                -- Join Logic: M.CODIGOCLIENTE is VARCHAR(50), C.CODIGOCLIENTE is CHAR(10) or NUMERIC
                -- We trim both to rely on string match which is safest here
                TRIM(M.CODIGOCLIENTE) = TRIM(CAST(C.CODIGOCLIENTE AS VARCHAR(50)))
        \`;
        
        await db.query(createView);
        console.log("✅ ULTIMATE VIEW CREATED!");

    } catch(e) { console.error(e); } finally { await db.close(); }
}
rebuildUltimate();
`;

        // Write file
        fs.writeFileSync('c:\\Users\\Javier\\Desktop\\Repositorios\\granja_mari_pepa\\backend\\rebuild_ultimate.js', script);
        console.log("Script Generated.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.close();
    }
}
generateScript();
