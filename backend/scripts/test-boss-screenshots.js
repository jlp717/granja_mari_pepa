const db = require('../app/config/odbcConfig');

async function checkScreenshots() {
    await db.initialize();

    const CONTADO_CLIENT_CODE = '4300005000';
    const RESOLVED_CLIENT_EXPR = `
    CASE WHEN TRIM(CAC.CODIGOCLIENTEFACTURA) = '${CONTADO_CLIENT_CODE}'
         THEN TRIM(CAC.CODIGOCLIENTEALBARAN)
         ELSE TRIM(CAC.CODIGOCLIENTEFACTURA)
    END`;

    console.log('=== TESTEANDO FILTROS DE LAS CAPTURAS ===\n');

    // Test 1: Only Exclude 44% (allow all 43xx, etc) instead of strict 4300%
    let where = `
    CAC.EJERCICIOALBARAN = 2026 
    AND CAC.MESDOCUMENTO = 1 
    AND TRIM(CAC.CODIGOCLIENTEFACTURA) NOT LIKE '44%'
    AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '704', '705', '706')
    AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
  `;

    // Query without any IMPORTEVENTA <> 0 filter
    const sql = `
    SELECT COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE ${where}
  `;

    console.log('1. NOT LIKE "44%":');
    try {
        const r = await db.query(sql);
        console.log(`Resultado: ${r[0]?.CAJAS} cajas`);
    } catch (e) {
        console.log('ERROR:', e.message);
    }

    // Test 2: What about the resolved client code? 
    // Maybe "NOT LIKE 44%" applies to the resolved code, not simply CAC.CODIGOCLIENTEFACTURA?
    let where2 = `
    CAC.EJERCICIOALBARAN = 2026 
    AND CAC.MESDOCUMENTO = 1 
    AND ${RESOLVED_CLIENT_EXPR} NOT LIKE '44%'
    AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '704', '705', '706')
    AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
  `;

    const sql2 = `
    SELECT COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE ${where2}
  `;

    console.log('\n2. Resolved Client NOT LIKE "44%":');
    try {
        const r2 = await db.query(sql2);
        console.log(`Resultado: ${r2[0]?.CAJAS} cajas`);
    } catch (e) {
        console.log('ERROR:', e.message);
    }

    // Check if LACLAE is actually a table or simply the alias the boss uses
    // We'll query SYSTABLES for LACLAE
    console.log('\n3. Comprobando si existe DSEDAC.LACLAE...');
    try {
        const sysR = await db.query("SELECT TABLE_NAME FROM QSYS2.SYSTABLES WHERE SYSTEM_TABLE_NAME = 'LACLAE' OR TABLE_NAME = 'LACLAE'");
        if (sysR.length > 0) {
            console.log('¡SÍ existe una tabla/vista LACLAE!');
        } else {
            console.log('No existe LACLAE en DB2 (debe ser alias en la herramienta del jefe, por ej. LAC = Líneas, LAE = ?)');
        }
    } catch (e) {
        console.log('Error limitando systables:', e.message);
    }

    await db.close();
    process.exit(0);
}

checkScreenshots().catch(e => { console.error(e.message); process.exit(1); });
