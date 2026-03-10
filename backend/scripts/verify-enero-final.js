/**
 * Verifies the final 3623 number exactly using the new service definition
 * (Using ANODOCUMENTO = 2026 instead of EJERCICIOALBARAN = 2026)
 */
const db = require('../app/config/odbcConfig');
const { ANO_FIJO } = require('../app/services/panamarService');

async function run() {
    await db.initialize();

    console.log('=== VERIFICACION FINAL: ENERO 2026 (Usando Año de Calendario) ===');

    const r = await db.query(`
    SELECT COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 1
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
  `);

    const total = r[0]?.CAJAS || 0;
    console.log('RESULTADO CON LA FAMILIA 703 OCULTA Y LA 900 SIN INCLUIR:', total, 'CAJAS');
    if (total === 3623) {
        console.log('✅ EXITO: La cifra coincide exactamente con lo esperado (3623).');
    } else {
        console.log(`❌ ERROR: Se esperaban 3623, pero se obtuvieron ${total}.`);
    }

    await db.close();
    process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
