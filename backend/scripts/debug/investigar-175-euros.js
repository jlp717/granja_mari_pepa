/**
 * INVESTIGAR LA DIFERENCIA DE 175€
 * ==================================
 * Sabemos que:
 * - Con ANOFACTURA=2025: +175€ extra
 * - Con EJERCICIOFACTURA=2025: -440€ faltante
 * - Referencia: 29.256,80€
 * 
 * Hipótesis: El sistema de referencia usa ANOFACTURA pero EXCLUYE ciertas facturas
 * (quizás abonos consolidados o duplicados)
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const REF_BASE = 29256.80;

async function investigarDiferencia() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  INVESTIGAR LA DIFERENCIA DE 175€                               ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER TODAS LAS FACTURAS EN ENERO 2025
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. FACTURAS DE ENERO 2025 (donde está la diferencia)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryEnero = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.EJERCICIOFACTURA as EJERC,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.MESFACTURA = 1
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.EJERCICIOFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
      ORDER BY C.DIAFACTURA, C.NUMEROFACTURA
    `;

        const enero = await pool.query(queryEnero);
        let sumaEnero = 0;
        console.log('Factura       | Ejerc | Fecha      | Base      | IVA       | Total');
        console.log('--------------|-------|------------|-----------|-----------|----------');
        enero.forEach(f => {
            const base = parseFloat(f.BASE) || 0;
            sumaEnero += base;
            console.log(
                `${f.FACTURA.padEnd(13)} | ${f.EJERC} | ${f.FECHA.padEnd(10)} | ` +
                `${base.toFixed(2).padStart(9)} | ${parseFloat(f.IVA).toFixed(2).padStart(9)} | ` +
                `${parseFloat(f.TOTAL).toFixed(2).padStart(9)}`
            );
        });
        console.log(`\nTotal facturas enero: ${enero.length}, Suma base: ${sumaEnero.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 2. CONTAR FACTURAS NEGATIVAS (ABONOS)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. FACTURAS CON BASE NEGATIVA (ABONOS)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryNegativos = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) < 0
      ORDER BY ABS(SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5)) DESC
    `;

        const negativos = await pool.query(queryNegativos);
        let sumaNegativos = 0;
        console.log(`Facturas negativas (abonos): ${negativos.length}`);
        console.log('\nFactura       | Fecha      | Base      | IVA');
        console.log('--------------|------------|-----------|----------');
        negativos.forEach(f => {
            const base = parseFloat(f.BASE) || 0;
            sumaNegativos += base;
            console.log(
                `${f.FACTURA.padEnd(13)} | ${f.FECHA.padEnd(10)} | ` +
                `${base.toFixed(2).padStart(9)} | ${parseFloat(f.IVA).toFixed(2).padStart(9)}`
            );
        });
        console.log(`\nSuma de abonos (negativos): ${sumaNegativos.toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 3. PROBAR EXCLUYENDO LOS ABONOS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. TOTAL EXCLUYENDO ABONOS (HAVING BASE > 0)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySinAbonos = `
      SELECT
        SUM(BASE) as TOTAL_BASE,
        SUM(IVA) as TOTAL_IVA,
        COUNT(*) as NUM_FACTURAS
      FROM (
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
          SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) > 0
      ) T
    `;

        const sinAbonos = (await pool.query(querySinAbonos))[0];
        const baseSinAbonos = parseFloat(sinAbonos.TOTAL_BASE) || 0;

        console.log(`Sin abonos (BASE > 0):`);
        console.log(`  Facturas: ${sinAbonos.NUM_FACTURAS}`);
        console.log(`  Base: ${baseSinAbonos.toFixed(2)}€`);
        console.log(`  Diff vs Ref: ${(baseSinAbonos - REF_BASE).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 4. VER LA DIFERENCIA EXACTA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. RESUMEN DE DIFERENCIAS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const diffOriginal = 175.11;
        const diffSinAbonos = baseSinAbonos - REF_BASE;

        console.log(`Referencia:                   ${REF_BASE.toFixed(2)}€`);
        console.log(`Con todos (ANOFACTURA=2025):  29431.91€ (+175.11€)`);
        console.log(`Sin abonos (BASE > 0):        ${baseSinAbonos.toFixed(2)}€ (${diffSinAbonos >= 0 ? '+' : ''}${diffSinAbonos.toFixed(2)}€)`);
        console.log(`Suma de abonos:               ${sumaNegativos.toFixed(2)}€`);
        console.log(`\nSi restamos abonos: 29431.91 + (${sumaNegativos.toFixed(2)}) = ${(29431.91 + sumaNegativos).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 5. BUSCAR FACTURAS QUE SUMEN EXACTAMENTE 175€
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. BUSCAR COMBINACIONES QUE SUMEN ~175€');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Facturas pequeñas que podrían sumar 175€
        const queryPequenas = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.EJERCICIOFACTURA as EJERC,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA, C.EJERCICIOFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) BETWEEN 80 AND 180
      ORDER BY SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) DESC
      FETCH FIRST 20 ROWS ONLY
    `;

        const pequenas = await pool.query(queryPequenas);
        console.log('Facturas con base entre 80€ y 180€:');
        console.log('Factura       | Fecha      | Ejerc | Base');
        console.log('--------------|------------|-------|----------');
        pequenas.forEach(f => {
            console.log(
                `${f.FACTURA.padEnd(13)} | ${f.FECHA.padEnd(10)} | ${f.EJERC} | ${parseFloat(f.BASE).toFixed(2).padStart(9)}`
            );
        });

        console.log('\n✓ Investigación completada\n');

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

investigarDiferencia().catch(console.error);
