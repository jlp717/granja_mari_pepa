/**
 * COMPARACIÓN EXACTA POR TIPO DE IVA
 * ===================================
 * Valores de referencia (página 15/15):
 * - Serie A 10%: Base=23.429,03€, IVA=2.343,05€
 * - Serie A 4%:  Base=5.662,76€, IVA=226,51€
 * - Serie F 10%: Base=165,01€, IVA=16,50€
 * - TOTAL: Base=29.256,80€, IVA=2.586,06€
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

// Valores de referencia exactos de la captura
const REFERENCIA = {
    serieA_10: { base: 23429.03, iva: 2343.05 },
    serieA_4: { base: 5662.76, iva: 226.51 },
    serieF_10: { base: 165.01, iva: 16.50 },
    total: { base: 29256.80, iva: 2586.06 }
};

async function compararPorTipoIVA() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  COMPARACIÓN EXACTA POR TIPO DE IVA                              ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // SERIE A - IVA 10%
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('SERIE A - IVA 10% (Columnas 1 y 5 donde %IVA=10)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieA_10 = `
      SELECT
        SUM(BASE) as TOTAL_BASE,
        SUM(IVA) as TOTAL_IVA
      FROM (
        -- Columna 1 con IVA 10%
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1) as BASE,
          SUM(C.IMPORTEIVA1) as IVA
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.PORCENTAJEIVA1 >= 9.5 AND C.PORCENTAJEIVA1 <= 10.5
        
        UNION ALL
        
        -- Columna 5 con IVA 10%
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE5) as BASE,
          SUM(C.IMPORTEIVA5) as IVA
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.PORCENTAJEIVA5 >= 9.5 AND C.PORCENTAJEIVA5 <= 10.5
      ) T
    `;

        const serieA_10 = (await pool.query(querySerieA_10))[0];
        const baseA10 = parseFloat(serieA_10.TOTAL_BASE) || 0;
        const ivaA10 = parseFloat(serieA_10.TOTAL_IVA) || 0;
        const diffBaseA10 = baseA10 - REFERENCIA.serieA_10.base;
        const diffIvaA10 = ivaA10 - REFERENCIA.serieA_10.iva;

        console.log(`Nuestro:    Base=${baseA10.toFixed(2)}€, IVA=${ivaA10.toFixed(2)}€`);
        console.log(`Referencia: Base=${REFERENCIA.serieA_10.base.toFixed(2)}€, IVA=${REFERENCIA.serieA_10.iva.toFixed(2)}€`);
        console.log(`Diferencia: Base=${diffBaseA10.toFixed(2)}€, IVA=${diffIvaA10.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // SERIE A - IVA 4%
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('SERIE A - IVA 4% (Columna 3 donde %IVA=4)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieA_4 = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE3) as TOTAL_BASE,
        SUM(C.IMPORTEIVA3) as TOTAL_IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.PORCENTAJEIVA3 >= 3.5 AND C.PORCENTAJEIVA3 <= 4.5
    `;

        const serieA_4 = (await pool.query(querySerieA_4))[0];
        const baseA4 = parseFloat(serieA_4.TOTAL_BASE) || 0;
        const ivaA4 = parseFloat(serieA_4.TOTAL_IVA) || 0;
        const diffBaseA4 = baseA4 - REFERENCIA.serieA_4.base;
        const diffIvaA4 = ivaA4 - REFERENCIA.serieA_4.iva;

        console.log(`Nuestro:    Base=${baseA4.toFixed(2)}€, IVA=${ivaA4.toFixed(2)}€`);
        console.log(`Referencia: Base=${REFERENCIA.serieA_4.base.toFixed(2)}€, IVA=${REFERENCIA.serieA_4.iva.toFixed(2)}€`);
        console.log(`Diferencia: Base=${diffBaseA4.toFixed(2)}€, IVA=${diffIvaA4.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // SERIE F - IVA 10%
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('SERIE F - IVA 10%');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieF = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as TOTAL_BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as TOTAL_IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'F'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const serieF = (await pool.query(querySerieF))[0];
        const baseF = parseFloat(serieF.TOTAL_BASE) || 0;
        const ivaF = parseFloat(serieF.TOTAL_IVA) || 0;
        const diffBaseF = baseF - REFERENCIA.serieF_10.base;
        const diffIvaF = ivaF - REFERENCIA.serieF_10.iva;

        console.log(`Nuestro:    Base=${baseF.toFixed(2)}€, IVA=${ivaF.toFixed(2)}€`);
        console.log(`Referencia: Base=${REFERENCIA.serieF_10.base.toFixed(2)}€, IVA=${REFERENCIA.serieF_10.iva.toFixed(2)}€`);
        console.log(`Diferencia: Base=${diffBaseF.toFixed(2)}€, IVA=${diffIvaF.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // RESUMEN TOTAL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('RESUMEN TOTAL');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const nuestroTotal = baseA10 + baseA4 + baseF;
        const refTotal = REFERENCIA.total.base;
        const diffTotal = nuestroTotal - refTotal;

        console.log('Desglose por tipo:');
        console.log(`  Serie A 10%: Diff=${diffBaseA10.toFixed(2)}€`);
        console.log(`  Serie A 4%:  Diff=${diffBaseA4.toFixed(2)}€`);
        console.log(`  Serie F 10%: Diff=${diffBaseF.toFixed(2)}€`);
        console.log('  -------------------');
        console.log(`  TOTAL:       Diff=${diffTotal.toFixed(2)}€`);

        console.log(`\n📊 Nuestro Total: ${nuestroTotal.toFixed(2)}€`);
        console.log(`   Referencia:    ${refTotal.toFixed(2)}€`);
        console.log(`   DIFERENCIA:    ${diffTotal.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // IDENTIFICAR ORIGEN DE LA DIFERENCIA EN SERIE A 10%
        // ═══════════════════════════════════════════════════════════════
        if (Math.abs(diffBaseA10) > 10) {
            console.log('\n═══════════════════════════════════════════════════════════════');
            console.log('ANALIZANDO DIFERENCIA EN SERIE A 10%');
            console.log('═══════════════════════════════════════════════════════════════\n');

            // Desglose columna 1 y 5
            const queryDesglose = `
        SELECT
          'Columna 1' as ORIGEN,
          SUM(C.IMPORTEBASEIMPONIBLE1) as BASE,
          SUM(C.IMPORTEIVA1) as IVA,
          COUNT(*) as REGISTROS
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.IMPORTEBASEIMPONIBLE1 <> 0
          AND C.PORCENTAJEIVA1 >= 9.5 AND C.PORCENTAJEIVA1 <= 10.5
      `;

            const desglose1 = (await pool.query(queryDesglose))[0];
            console.log(`Columna 1 (IVA 10%): Base=${parseFloat(desglose1.BASE).toFixed(2)}€, Registros=${desglose1.REGISTROS}`);

            const queryDesglose5 = `
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE5) as BASE,
          SUM(C.IMPORTEIVA5) as IVA,
          COUNT(*) as REGISTROS
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.IMPORTEBASEIMPONIBLE5 <> 0
          AND C.PORCENTAJEIVA5 >= 9.5 AND C.PORCENTAJEIVA5 <= 10.5
      `;

            const desglose5 = (await pool.query(queryDesglose5))[0];
            console.log(`Columna 5 (IVA 10%): Base=${parseFloat(desglose5.BASE).toFixed(2)}€, Registros=${desglose5.REGISTROS}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // IDENTIFICAR ORIGEN DE LA DIFERENCIA EN SERIE A 4%
        // ═══════════════════════════════════════════════════════════════
        if (Math.abs(diffBaseA4) > 10) {
            console.log('\n═══════════════════════════════════════════════════════════════');
            console.log('ANALIZANDO DIFERENCIA EN SERIE A 4%');
            console.log('═══════════════════════════════════════════════════════════════\n');

            // Las facturas problemáticas del IVA 4%
            const queryProblemas4 = `
        SELECT
          TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
          C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
          C.IMPORTEBASEIMPONIBLE3 as BASE,
          C.IMPORTEIVA3 as IVA
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.IMPORTEBASEIMPONIBLE3 <> 0
          AND C.PORCENTAJEIVA3 >= 3.5 AND C.PORCENTAJEIVA3 <= 4.5
        ORDER BY C.IMPORTEBASEIMPONIBLE3 DESC
        FETCH FIRST 10 ROWS ONLY
      `;

            const problemas4 = await pool.query(queryProblemas4);
            console.log('Top 10 registros con IVA 4%:');
            problemas4.forEach(p => {
                console.log(`  ${p.FACTURA} (${p.FECHA}): Base=${parseFloat(p.BASE).toFixed(2)}€`);
            });
        }

        console.log('\n✓ Comparación completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

compararPorTipoIVA().catch(console.error);
