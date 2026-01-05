/**
 * DIAGNÓSTICO FINAL: Comparar método de suma
 * ============================================
 * El sistema de referencia muestra líneas separadas por tipo de IVA.
 * Quizás el problema está en cómo sumamos los valores.
 * 
 * Vamos a verificar si la suma de IMPORTETOTAL coincide con BASE+IVA+RECARGO
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function diagnosticoFinal() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  DIAGNÓSTICO FINAL: VERIFICAR CÁLCULO DE TOTALES                ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // VALORES DE REFERENCIA
        const REF_BASE = 29256.80;
        const REF_IVA = 2586.06;
        const REF_TOTAL = 31842.86;

        // ═══════════════════════════════════════════════════════════════
        // 1. VERIFICAR: ¿HAY DIFERENCIA ENTRE SUMAR BASE+IVA VS IMPORTETOTAL?
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. COMPARAR MÉTODOS DE SUMA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryMetodos = `
      SELECT
        'Método A: SUM(BASE)' as METODO,
        SUM(B) as VALOR
      FROM (
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as B
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
           AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
           AND SUM(C.IMPORTETOTAL) <> 0
      ) T
    `;

        const metodoA = (await pool.query(queryMetodos))[0];
        console.log(`Método A (SUM de BASE1-5 con HAVING actual): ${parseFloat(metodoA.VALOR).toFixed(2)}€`);
        console.log(`Diferencia con referencia: ${(parseFloat(metodoA.VALOR) - REF_BASE).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 2. VER SI HAY FACTURAS CON IVA=0 PERO BASE!=0
        //    (que se excluyen incorrectamente por el AND)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. FACTURAS CON BASE!=0 PERO IVA=0 (posible exclusión incorrecta)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryIva0 = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) = 0
    `;

        const factIva0 = await pool.query(queryIva0);
        console.log(`Facturas con BASE!=0 pero IVA=0: ${factIva0.length}`);
        if (factIva0.length > 0) {
            let sumaBase = 0;
            factIva0.forEach(f => {
                console.log(`  ${f.FACTURA} - ${f.FECHA}: Base=${parseFloat(f.BASE).toFixed(2)}, IVA=${parseFloat(f.IVA).toFixed(2)}`);
                sumaBase += parseFloat(f.BASE) || 0;
            });
            console.log(`  TOTAL BASE EXCLUIDA: ${sumaBase.toFixed(2)}€`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. VER SI HAY FACTURAS CON TOTAL=0 PERO BASE!=0
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. FACTURAS CON BASE!=0 PERO TOTAL=0 (otra exclusión incorrecta)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryTotal0 = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
         AND SUM(C.IMPORTETOTAL) = 0
    `;

        const factTotal0 = await pool.query(queryTotal0);
        console.log(`Facturas con BASE!=0, IVA!=0 pero TOTAL=0: ${factTotal0.length}`);
        if (factTotal0.length > 0) {
            let sumaBase = 0;
            factTotal0.forEach(f => {
                console.log(`  ${f.FACTURA} - ${f.FECHA}: Base=${parseFloat(f.BASE).toFixed(2)}, Total=${parseFloat(f.TOTAL).toFixed(2)}`);
                sumaBase += parseFloat(f.BASE) || 0;
            });
            console.log(`  TOTAL BASE EXCLUIDA: ${sumaBase.toFixed(2)}€`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. COMPARAR USANDO SOLO BASE <> 0 (sin chequear IVA ni TOTAL)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. SUMA USANDO SOLO HAVING BASE <> 0');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySoloBase = `
      SELECT
        SUM(B) as TOTAL_BASE,
        SUM(I) as TOTAL_IVA,
        COUNT(*) as NUM_FACTURAS
      FROM (
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as B,
          SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as I
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        const soloBase = (await pool.query(querySoloBase))[0];
        const baseSoloBase = parseFloat(soloBase.TOTAL_BASE) || 0;
        const ivaSoloBase = parseFloat(soloBase.TOTAL_IVA) || 0;
        console.log(`Usando HAVING BASE <> 0:`);
        console.log(`  Facturas: ${soloBase.NUM_FACTURAS}`);
        console.log(`  Base: ${baseSoloBase.toFixed(2)}€ (Diff: ${(baseSoloBase - REF_BASE).toFixed(2)}€)`);
        console.log(`  IVA: ${ivaSoloBase.toFixed(2)}€ (Diff: ${(ivaSoloBase - REF_IVA).toFixed(2)}€)`);

        // ═══════════════════════════════════════════════════════════════
        // 5. COMPARAR F-7370 EN NUESTRO SISTEMA VS REFERENCIA
        //    En referencia: Base=159,18€
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. VERIFICAR FACTURA F-7370 (debería ser ~159€ base)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryF7370 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.NUMEROFACTURA,
        C.NUMEROALBARAN,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as B1,
        C.PORCENTAJEIVA1 as IVA1,
        C.IMPORTEIVA1 as I1,
        C.IMPORTETOTAL as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.SERIEFACTURA) = 'F'
        AND C.NUMEROFACTURA = 7370
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const f7370 = await pool.query(queryF7370);
        console.log(`Factura F-7370 tiene ${f7370.length} registros (albaranes):`);
        let sumaBase7370 = 0, sumaIva7370 = 0, sumaTotal7370 = 0;
        f7370.forEach(l => {
            const b = parseFloat(l.B1) || 0;
            const i = parseFloat(l.I1) || 0;
            const t = parseFloat(l.TOTAL) || 0;
            sumaBase7370 += b;
            sumaIva7370 += i;
            sumaTotal7370 += t;
            console.log(`  Albarán ${l.NUMEROALBARAN}: Base=${b.toFixed(2)}, IVA${l.IVA1}%=${i.toFixed(2)}, Total=${t.toFixed(2)}`);
        });
        console.log(`  SUMA F-7370: Base=${sumaBase7370.toFixed(2)}, IVA=${sumaIva7370.toFixed(2)}, Total=${sumaTotal7370.toFixed(2)}`);
        console.log(`  REFERENCIA: Base=159,18€, IVA=15,92€, Total=175,10€`);

        // ═══════════════════════════════════════════════════════════════
        // 6. CONCLUSIÓN
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('CONCLUSIÓN');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('📊 RESUMEN DE TOTALES:');
        console.log(`   Nuestro sistema: Base=${baseSoloBase.toFixed(2)}€, IVA=${ivaSoloBase.toFixed(2)}€`);
        console.log(`   Referencia:      Base=${REF_BASE.toFixed(2)}€, IVA=${REF_IVA.toFixed(2)}€`);
        console.log(`   Diferencia:      Base=${(baseSoloBase - REF_BASE).toFixed(2)}€, IVA=${(ivaSoloBase - REF_IVA).toFixed(2)}€`);

        console.log('\n✓ Diagnóstico completado\n');

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

diagnosticoFinal().catch(console.error);
