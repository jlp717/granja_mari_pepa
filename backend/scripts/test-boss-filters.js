const db = require('../app/config/odbcConfig');

async function testBossFilters() {
    await db.initialize();

    const combos = [
        {
            name: 'Familias exactas (700,701,702,704,705,706) + todos los filtros (Clase + Importe)',
            fams: "('700','701','702','704','705','706')",
            clase: true,
            importe: true
        },
        {
            name: 'Familias exactas (700,701,702,704,705,706) + Clase (Sin ImporteVenta)',
            fams: "('700','701','702','704','705','706')",
            clase: true,
            importe: false
        },
        {
            name: 'Familias exactas (700,701,702,704,705,706) + ImporteVenta (Sin Clase)',
            fams: "('700','701','702','704','705','706')",
            clase: false,
            importe: true
        },
        {
            name: 'Familias exactas (700,701,702,704,705,706) SIN filtros extra',
            fams: "('700','701','702','704','705','706')",
            clase: false,
            importe: false
        }
    ];

    console.log('=== TESTEANDO CONFIGURACIÓN EXACTA DEL JEFE ===\n');

    for (const c of combos) {
        let where = `CAC.EJERCICIOALBARAN = 2026 AND CAC.MESDOCUMENTO = 1 AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'`;
        where += ` AND TRIM(ART.CODIGOFAMILIA) IN ${c.fams}`;

        if (c.clase) where += ` AND TRIM(LAC.CLASELINEA) IN ('AB','RG','VT')`;
        if (c.importe) where += ` AND LAC.IMPORTEVENTA <> 0`;

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

        try {
            const r = await db.query(sql);
            const cajas = r[0]?.CAJAS || 0;
            const marker = cajas === 3623 ? ' <<< MATCH 3623!!!' : '';
            console.log(`[${String(cajas).padStart(6)} cajas] | ${c.name}${marker}`);
        } catch (e) {
            console.log(`[  ERR  ] | ${c.name}: ${e.message}`);
        }
    }

    // Also verify what 706 and 703 contribute
    console.log('\n--- Contribución individual de familias en Enero ---');
    const indv = await db.query(`
    SELECT TRIM(ART.CODIGOFAMILIA) AS FAMILIA, COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.EJERCICIOALBARAN = 2026 AND CAC.MESDOCUMENTO = 1 AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706', '900')
    GROUP BY TRIM(ART.CODIGOFAMILIA)
    ORDER BY TRIM(ART.CODIGOFAMILIA)
  `);

    indv.forEach(r => console.log(`Familia ${r.FAMILIA.padEnd(3)}: ${r.CAJAS} cajas`));

    await db.close();
    process.exit(0);
}

testBossFilters().catch(e => { console.error(e.message); process.exit(1); });
