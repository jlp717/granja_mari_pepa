
const db = require('./app/config/odbcConfig');

async function createView() {
    try {
        await db.initialize();

        // Dropping if exists (ignoring error)
        try {
            await db.query(`DROP VIEW DSEDAC.V_MEDIOS_POWERBI`);
            console.log("View dropped (if it existed).");
        } catch (e) { }

        // Constructing a robust CREATE VIEW statement
        // We select specific columns to avoid issues with hidden/weird system columns in logical files
        const sql = `
            CREATE VIEW DSEDAC.V_MEDIOS_POWERBI AS 
            SELECT 
                M.CODIGOMEDIO,
                M.NUMEROSERIE,
                M.CODIGONFC,
                M.DESCRIPCIONMEDIO,
                M.ESTADOMEDIO,
                M.CODIGOCLIENTE,
                -- Date Construction
                CASE WHEN M.ANOALTA > 1900 THEN DATE(RTRIM(CHAR(M.ANOALTA)) || '-' || RTRIM(CHAR(M.MESALTA)) || '-' || RTRIM(CHAR(M.DIAALTA))) ELSE NULL END AS FECHA_ALTA,
                
                -- Joined Columns (Only if we can joins in the view, simpler is safer first)
                 C.LCNCL AS NOMBRE_CLIENTE,
                 C.LCPOBL AS POBLACION,
                 C.LCPROV AS PROVINCIA

            FROM DSEDAC.MEDL1 M
            LEFT JOIN DSED.LACLAE C ON M.CODIGOCLIENTE = C.LCCL
        `;

        console.log("Attempting to create VIEW DSEDAC.V_MEDIOS_POWERBI...");
        await db.query(sql);
        console.log("✅ VIEW CREATED SUCCESSFULLY!");

        // Verify
        const test = await db.query("SELECT * FROM DSEDAC.V_MEDIOS_POWERBI FETCH FIRST 5 ROWS ONLY");
        console.log("Verification Data:", test);

    } catch (e) {
        console.error("❌ CREATE VIEW FAILED:", e);
        if (e.odbcErrors) console.error("ODBC Details:", e.odbcErrors);
    } finally {
        await db.close();
    }
}
createView();
