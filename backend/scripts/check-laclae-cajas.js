const db = require('../app/config/odbcConfig');

async function checkLACLAECajas() {
    await db.initialize();

    try {
        const tiposL = await db.query(`SELECT TRIM(TIPOVENTA) AS TIPO, SUM(CANTIDADENVASES) AS CAJAS FROM DSEDAC.LAC WHERE EJERCICIOALBARAN = 2026 AND MESDOCUMENTO = 1 GROUP BY TRIM(TIPOVENTA)`);
        console.log('--- TIPOS DE VENTA (Tabla LAC Enero) ---');
        tiposL.forEach(t => console.log(`${t.TIPO || 'NULL'}: ${t.CAJAS} cajas`));

        const boss = await db.query(`
      SELECT TRIM(LAC.TIPOVENTA) AS TIPO_VENTA, COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
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
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) NOT LIKE '44%'
        AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '704', '705', '706')
        AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
      GROUP BY TRIM(LAC.TIPOVENTA)
    `);

        console.log('\n--- CAJAS POR TIPOVENTA (Filtro Jefe exacto) ---');
        boss.forEach(t => console.log(`${t.TIPO_VENTA || 'NULL'}: ${t.CAJAS} cajas`));

    } catch (e) {
        console.log('ERROR:', e.message);
    }

    await db.close();
    process.exit(0);
}

checkLACLAECajas().catch(e => { console.error(e.message); process.exit(1); });
