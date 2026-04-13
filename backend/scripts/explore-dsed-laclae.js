const db = require('../app/config/odbcConfig');

async function testDSEDLACLAE() {
    await db.initialize();

    console.log('=== EXPLORANDO DSED.LACLAE ===\n');

    try {
        const cols = await db.query(`
      SELECT COLUMN_NAME
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSED' AND TABLE_NAME = 'LACLAE'
    `);

        const colNames = cols.map(c => c.COLUMN_NAME);
        console.log('Columnas encontradas en DSED.LACLAE:');
        console.log(colNames.join(', '));

        // Si asumiendo que es una vista de LAC y CAC unidas, tiene columnas parecidas
        // El usuario dijo: "y el TIPOVENTA solo contar el LAC"
        // Vamos a ver cómo se llama la columna de cajas y familia

        // Check first row
        const firstRow = await db.query('SELECT * FROM DSED.LACLAE FETCH FIRST 1 ROWS ONLY');
        console.log('\nMuestra 1 Fila DSED.LACLAE y TIPOVENTA:');
        if (firstRow.length > 0) {
            console.log(Object.keys(firstRow[0]).filter(k => k.includes('TIPO')));
        }

        // Attempt to run the boss exact filters on DSED.LACLAE
        // Assuming the columns are identical to LAC and CAC joined... wait, no. 
        // Is CODIGOFAMILIA in LACLAE?
        const hasFamilia = colNames.includes('CODIGOFAMILIA');
        const familiaCol = hasFamilia ? 'CODIGOFAMILIA' : (colNames.includes('FAMILIA') ? 'FAMILIA' : null);
        const hasCajas = colNames.includes('CANTIDADENVASES');

        if (familiaCol && hasCajas) {
            console.log(`\nEjecutando SELECT con filtros en DSED.LACLAE...`);
            // User requested "el TIPOVENTA solo contar el LAC" -> this translates to LAC.TIPOVENTA o LACLAE.TIPOVENTA IN ('LAC'?? NO, LAC es LACLAE, quiza TIPOVENTA='LAC')? 
            // Let's group by TIPOVENTA first.
            const tipos = await db.query(`SELECT TIPOVENTA, SUM(CANTIDADENVASES) FROM DSED.LACLAE WHERE EJERCICIOALBARAN=2026 AND MESDOCUMENTO=1 GROUP BY TIPOVENTA`);
            console.log('Distintos TIPOSVENTA en DSED.LACLAE en enero 2026:');
            console.table(tipos);

            // Also running the full filter calculation!
            const CONTADO_CLIENT_CODE = '4300005000';
            const sqlFull = `
        SELECT COALESCE(SUM(CANTIDADENVASES), 0) AS CAJAS
        FROM DSED.LACLAE
        WHERE EJERCICIOALBARAN = 2026 
          AND MESDOCUMENTO = 1
          AND TRIM(CODIGOCLIENTEFACTURA) NOT LIKE '44%'
          AND TRIM(${familiaCol}) IN ('700', '701', '702', '704', '705', '706')
          AND TRIM(CLASELINEA) IN ('AB', 'RG', 'VT')
      `;
            const resFull = await db.query(sqlFull);
            console.log('Suma SIN TIPOVENTA condition (familias 700-706):', resFull[0].CAJAS);

        } else {
            console.log('No puedo armar la query porque las columnas tienen otros nombres.');
        }

    } catch (e) {
        console.log('ERROR:', e.message);
    }

    await db.close();
    process.exit(0);
}

testDSEDLACLAE().catch(e => { console.error(e.message); process.exit(1); });
