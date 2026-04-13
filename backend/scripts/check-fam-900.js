const db = require('../app/config/odbcConfig');

async function check900() {
    await db.initialize();
    const r = await db.query(`
    SELECT DISTINCT TRIM(LAC.CODIGOARTICULO) AS ARTICULO, TRIM(ARTX.DESCRIPCION) AS DESC, TRIM(ART.CODIGOFAMILIA) AS FAMILIA
    FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARTX ARTX ON TRIM(ARTX.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE TRIM(ART.CODIGOFAMILIA) IN ('900', '703')
      AND LAC.EJERCICIOALBARAN = 2026 
    FETCH FIRST 20 ROWS ONLY
  `);
    console.table(r);

    await db.close();
    process.exit(0);
}

check900().catch(e => { console.error(e.message); process.exit(1); });
