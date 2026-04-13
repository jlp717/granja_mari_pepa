const db = require('../app/config/odbcConfig');

async function verifyDynamicTarifa() {
    await db.initialize();

    console.log('=== VERIFICANDO LÓGICA DE TARIFA DINÁMICA (84/85) ===\n');

    try {
        // 1. Check a January product (e.g. from the 3623 list)
        // We'll join LAC with CAC and ARA to see which price is being picked
        const query = `
      SELECT 
        CAC.MESDOCUMENTO,
        TRIM(LAC.CODIGOARTICULO) AS ART,
        LAC.CANTIDADENVASES,
        LAC.PRECIOVENTA AS PRECIO_ORIGINAL,
        COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA,
        ARA.CODIGOTARIFA
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN 
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      LEFT JOIN DSEDAC.ARA ARA ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
        AND ARA.CODIGOTARIFA = (CASE WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END)
      WHERE CAC.ANODOCUMENTO = 2026
        AND CAC.MESDOCUMENTO IN (1, 2)
        AND TRIM(LAC.CODIGOARTICULO) IS NOT NULL
      FETCH FIRST 10 ROWS ONLY
    `;

        const results = await db.query(query);
        console.table(results);

        const janRows = results.filter(r => r.MESDOCUMENTO === 1);
        const febRows = results.filter(r => r.MESDOCUMENTO === 2);

        if (janRows.length > 0) {
            console.log('Fila Enero encontrada. Tarifa en query fue 84.');
        }
        if (febRows.length > 0) {
            console.log('Fila Febrero encontrada. Tarifa en query fue 85.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

verifyDynamicTarifa();
