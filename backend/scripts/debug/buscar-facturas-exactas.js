/**
 * BUSCAR LAS FACTURAS EXACTAS QUE CAUSAN LA DIFERENCIA
 * =====================================================
 * Diferencia identificada:
 * - Serie A 10%: +87,31€
 * - Serie A 4%:  +87,80€
 * 
 * Vamos a comparar usando EJERCICIOFACTURA vs ANOFACTURA para ver la diferencia
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function buscarFacturasExactas() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  BUSCAR FACTURAS EXACTAS QUE CAUSAN LA DIFERENCIA               ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // COMPARAR: ANOFACTURA=2025 vs EJERCICIOFACTURA=2025 para IVA 10%
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('SERIE A - IVA 10%: Comparar por ANOFACTURA vs EJERCICIOFACTURA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Con ANOFACTURA
        const queryAno10 = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1) + SUM(C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND (C.PORCENTAJEIVA1 BETWEEN 9.5 AND 10.5 OR C.PORCENTAJEIVA5 BETWEEN 9.5 AND 10.5)
    `;

        // Con EJERCICIOFACTURA
        const queryEjerc10 = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1) + SUM(C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.EJERCICIOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND (C.PORCENTAJEIVA1 BETWEEN 9.5 AND 10.5 OR C.PORCENTAJEIVA5 BETWEEN 9.5 AND 10.5)
    `;

        const ano10 = (await pool.query(queryAno10))[0];
        const ejerc10 = (await pool.query(queryEjerc10))[0];
        const baseAno10 = parseFloat(ano10.BASE) || 0;
        const baseEjerc10 = parseFloat(ejerc10.BASE) || 0;

        console.log(`Con ANOFACTURA=2025:        Base=${baseAno10.toFixed(2)}€`);
        console.log(`Con EJERCICIOFACTURA=2025:  Base=${baseEjerc10.toFixed(2)}€`);
        console.log(`Diferencia (extra):         ${(baseAno10 - baseEjerc10).toFixed(2)}€`);
        console.log(`Referencia espera:          23.429,03€`);

        // ═══════════════════════════════════════════════════════════════
        // COMPARAR: ANOFACTURA=2025 vs EJERCICIOFACTURA=2025 para IVA 4%
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('SERIE A - IVA 4%: Comparar por ANOFACTURA vs EJERCICIOFACTURA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryAno4 = `
      SELECT SUM(C.IMPORTEBASEIMPONIBLE3) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.PORCENTAJEIVA3 BETWEEN 3.5 AND 4.5
    `;

        const queryEjerc4 = `
      SELECT SUM(C.IMPORTEBASEIMPONIBLE3) as BASE
      FROM DSEDAC.CAC C
      WHERE C.EJERCICIOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.PORCENTAJEIVA3 BETWEEN 3.5 AND 4.5
    `;

        const ano4 = (await pool.query(queryAno4))[0];
        const ejerc4 = (await pool.query(queryEjerc4))[0];
        const baseAno4 = parseFloat(ano4.BASE) || 0;
        const baseEjerc4 = parseFloat(ejerc4.BASE) || 0;

        console.log(`Con ANOFACTURA=2025:        Base=${baseAno4.toFixed(2)}€`);
        console.log(`Con EJERCICIOFACTURA=2025:  Base=${baseEjerc4.toFixed(2)}€`);
        console.log(`Diferencia (extra):         ${(baseAno4 - baseEjerc4).toFixed(2)}€`);
        console.log(`Referencia espera:          5.662,76€`);

        // ═══════════════════════════════════════════════════════════════
        // LISTAR LAS FACTURAS "EXTRA" (ANOFACTURA=2025 pero EJERCICIO<>2025)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('FACTURAS "EXTRA" (están en 2025 por fecha pero ejercicio ≠ 2025)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryExtras = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.EJERCICIOFACTURA as EJERC,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as BASE1,
        C.PORCENTAJEIVA1 as IVA1,
        C.IMPORTEBASEIMPONIBLE3 as BASE3,
        C.PORCENTAJEIVA3 as IVA3,
        C.IMPORTEBASEIMPONIBLE5 as BASE5,
        C.PORCENTAJEIVA5 as IVA5,
        C.IMPORTETOTAL as TOTAL
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.EJERCICIOFACTURA <> 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      ORDER BY C.NUMEROFACTURA
    `;

        const extras = await pool.query(queryExtras);

        let sumaBase1 = 0, sumaBase3 = 0, sumaBase5 = 0;

        console.log('Factura    | Ejerc | Fecha      | Base1(10%)  | Base3(4%)   | Base5(10%)  | Total');
        console.log('-----------|-------|------------|-------------|-------------|-------------|----------');
        extras.forEach(e => {
            const b1 = parseFloat(e.BASE1) || 0;
            const b3 = parseFloat(e.BASE3) || 0;
            const b5 = parseFloat(e.BASE5) || 0;
            const t = parseFloat(e.TOTAL) || 0;
            sumaBase1 += b1;
            sumaBase3 += b3;
            sumaBase5 += b5;
            console.log(
                `${e.FACTURA.padEnd(10)} | ${e.EJERC} | ${e.FECHA.padEnd(10)} | ` +
                `${b1.toFixed(2).padStart(11)} | ${b3.toFixed(2).padStart(11)} | ${b5.toFixed(2).padStart(11)} | ` +
                `${t.toFixed(2).padStart(9)}`
            );
        });
        console.log('-----------|-------|------------|-------------|-------------|-------------|----------');
        console.log(`TOTALES:              | ${sumaBase1.toFixed(2).padStart(11)} | ${sumaBase3.toFixed(2).padStart(11)} | ${sumaBase5.toFixed(2).padStart(11)} |`);

        const totalExtra10 = sumaBase1 + sumaBase5;
        const totalExtra4 = sumaBase3;
        console.log(`\nSuma extra IVA 10% (Base1+Base5): ${totalExtra10.toFixed(2)}€`);
        console.log(`Suma extra IVA 4% (Base3): ${totalExtra4.toFixed(2)}€`);
        console.log(`Total extra (debería ser ~175€): ${(totalExtra10 + totalExtra4).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // RESUMEN Y VERIFICACIÓN FINAL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('VERIFICACIÓN FINAL');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const totalConEjerc = baseEjerc10 + baseEjerc4;
        const totalConAno = baseAno10 + baseAno4;

        console.log('SERIE A (sin Serie F):');
        console.log(`  Con ANOFACTURA=2025:       ${totalConAno.toFixed(2)}€`);
        console.log(`  Con EJERCICIOFACTURA=2025: ${totalConEjerc.toFixed(2)}€`);
        console.log(`  Referencia Serie A:        29.091,79€ (23.429,03 + 5.662,76)`);
        console.log(`\n  Diff ANOFACTURA vs Ref:    ${(totalConAno - 29091.79).toFixed(2)}€`);
        console.log(`  Diff EJERCICIO vs Ref:     ${(totalConEjerc - 29091.79).toFixed(2)}€`);

        console.log('\n✓ Análisis completado\n');

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

buscarFacturasExactas().catch(console.error);
