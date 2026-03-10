/**
 * Quick verification: January 2026 cajas should be 3623
 */
const db = require('../app/config/odbcConfig');

async function run() {
    await db.initialize();

    const r = await db.query(`
    SELECT
      COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS TOTAL_CAJAS,
      COUNT(*) AS LINEAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.EJERCICIOALBARAN = 2026
      AND CAC.MESDOCUMENTO = 1
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN ('701','702','703','704','705')
      AND LAC.IMPORTEVENTA <> 0
      AND TRIM(LAC.CLASELINEA) IN ('AB','RG','VT')
  `);

    const total = r[0]?.TOTAL_CAJAS || 0;
    console.log('ENERO 2026:', JSON.stringify(r[0]));
    console.log('ESPERADO: 3623 | OBTENIDO:', total);
    console.log(total === 3623 ? '>>> COINCIDE PERFECTO <<<' : '>>> NO COINCIDE <<<');

    await db.close();
    process.exit(total === 3623 ? 0 : 1);
}

run().catch(e => { console.error(e.message); process.exit(1); });
