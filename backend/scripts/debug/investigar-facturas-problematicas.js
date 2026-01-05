/**
 * SCRIPT DE DIAGNÓSTICO DETALLADO: Investigar facturas problemáticas
 * ===================================================================
 * Busca las causas específicas de la diferencia de 175€
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;

async function investigar() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  INVESTIGACIÓN DETALLADA DE FACTURAS PROBLEMÁTICAS              ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. FACTURAS CON VALORES CERO O NEGATIVOS
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. FACTURAS CON BASE IMPONIBLE = 0 O NEGATIVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryProblematicas = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTETOTAL) as TOTAL,
        COUNT(*) as NUM_LINEAS
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA,
        C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
      HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <= 0
      ORDER BY BASE_IMPONIBLE
    `;

        const problematicas = await pool.query(queryProblematicas);

        let sumaBaseNegativa = 0;
        let sumaIvaNegativa = 0;
        let sumaTotalNegativa = 0;

        if (problematicas.length > 0) {
            console.log('Serie   | Número  | Fecha      | Base Imp.    | IVA          | Total        | Líneas');
            console.log('--------|---------|------------|--------------|--------------|--------------|-------');

            problematicas.forEach(f => {
                const base = parseFloat(f.BASE_IMPONIBLE) || 0;
                const iva = parseFloat(f.IVA) || 0;
                const tot = parseFloat(f.TOTAL) || 0;
                const fecha = `${f.DIAFACTURA}/${f.MESFACTURA}/${f.ANOFACTURA}`;

                sumaBaseNegativa += base;
                sumaIvaNegativa += iva;
                sumaTotalNegativa += tot;

                console.log(
                    `${(f.SERIEFACTURA || '').padEnd(7)} | ` +
                    `${String(f.NUMEROFACTURA).padEnd(7)} | ` +
                    `${fecha.padEnd(10)} | ` +
                    `${base.toFixed(2).padStart(12)} | ` +
                    `${iva.toFixed(2).padStart(12)} | ` +
                    `${tot.toFixed(2).padStart(12)} | ` +
                    `${f.NUM_LINEAS}`
                );
            });

            console.log(`\n📊 Total facturas problemáticas: ${problematicas.length}`);
            console.log(`   Suma Base: ${sumaBaseNegativa.toFixed(2)} €`);
            console.log(`   Suma IVA: ${sumaIvaNegativa.toFixed(2)} €`);
            console.log(`   Suma Total: ${sumaTotalNegativa.toFixed(2)} €`);
        } else {
            console.log('✅ No hay facturas con base imponible <= 0');
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. FACTURAS CON MÚLTIPLES LÍNEAS (posibles duplicados)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('2. FACTURAS CON MÚLTIPLES LÍNEAS EN CAC (posibles duplicados)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryMultiples = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        COUNT(*) as NUM_LINEAS,
        COUNT(DISTINCT C.NUMEROALBARAN) as NUM_ALBARANES,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_SUMADA,
        SUM(C.IMPORTETOTAL) as TOTAL_SUMADO
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY
        TRIM(C.SERIEFACTURA),
        C.NUMEROFACTURA
      HAVING COUNT(*) > 1
      ORDER BY NUM_LINEAS DESC
    `;

        const multiples = await pool.query(queryMultiples);

        if (multiples.length > 0) {
            console.log('Serie   | Número  | Líneas | Albaranes | Base Sumada  | Total Sumado');
            console.log('--------|---------|--------|-----------|--------------|-------------');
            multiples.forEach(m => {
                console.log(
                    `${(m.SERIEFACTURA || '').padEnd(7)} | ` +
                    `${String(m.NUMEROFACTURA).padEnd(7)} | ` +
                    `${String(m.NUM_LINEAS).padEnd(6)} | ` +
                    `${String(m.NUM_ALBARANES).padEnd(9)} | ` +
                    `${(parseFloat(m.BASE_SUMADA) || 0).toFixed(2).padStart(12)} | ` +
                    `${(parseFloat(m.TOTAL_SUMADO) || 0).toFixed(2).padStart(12)}`
                );
            });
        } else {
            console.log('✅ No hay facturas con múltiples líneas');
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. DETALLE DE FACTURA F-7370 (tiene 3 líneas)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('3. DETALLE DE FACTURA F-7370 (3 líneas identificadas)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryF7370 = `
      SELECT
        C.NUMEROALBARAN,
        C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA,
        C.IMPORTEBASEIMPONIBLE1 as BASE1,
        C.PORCENTAJEIVA1 as PIVA1,
        C.IMPORTEIVA1 as IVA1,
        C.IMPORTEBASEIMPONIBLE2 as BASE2,
        C.PORCENTAJEIVA2 as PIVA2,
        C.IMPORTEIVA2 as IVA2,
        C.IMPORTETOTAL as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) = 'F'
        AND C.NUMEROFACTURA = 7370
      ORDER BY C.NUMEROALBARAN
    `;

        const f7370 = await pool.query(queryF7370);

        if (f7370.length > 0) {
            console.log('Albarán | Fecha      | Base1      | %IVA1 | IVA1       | Base2     | %IVA2 | IVA2      | Total');
            console.log('--------|------------|------------|-------|------------|-----------|-------|-----------|----------');

            let sumBase = 0, sumIva = 0, sumTotal = 0;

            f7370.forEach(l => {
                const fecha = `${l.DIAFACTURA}/${l.MESFACTURA}/${l.ANOFACTURA}`;
                const base1 = parseFloat(l.BASE1) || 0;
                const iva1 = parseFloat(l.IVA1) || 0;
                const base2 = parseFloat(l.BASE2) || 0;
                const iva2 = parseFloat(l.IVA2) || 0;
                const total = parseFloat(l.TOTAL) || 0;

                sumBase += base1 + base2;
                sumIva += iva1 + iva2;
                sumTotal += total;

                console.log(
                    `${String(l.NUMEROALBARAN).padEnd(7)} | ` +
                    `${fecha.padEnd(10)} | ` +
                    `${base1.toFixed(2).padStart(10)} | ` +
                    `${(l.PIVA1 || 0).toFixed(2).padStart(5)} | ` +
                    `${iva1.toFixed(2).padStart(10)} | ` +
                    `${base2.toFixed(2).padStart(9)} | ` +
                    `${(l.PIVA2 || 0).toFixed(2).padStart(5)} | ` +
                    `${iva2.toFixed(2).padStart(9)} | ` +
                    `${total.toFixed(2).padStart(9)}`
                );
            });

            console.log(`\nSuma de ${f7370.length} líneas: Base=${sumBase.toFixed(2)}, IVA=${sumIva.toFixed(2)}, Total=${sumTotal.toFixed(2)}`);
        } else {
            console.log('⚠️  Factura F-7370 no encontrada');
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. VERIFICAR SI HAY FACTURAS SIN SERIE O CON SERIE EXTRAÑA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('4. DESGLOSE POR SERIE (como la captura del usuario)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryPorSerie = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA,
        SUM(C.IMPORTERECARGO1 + C.IMPORTERECARGO2 + C.IMPORTERECARGO3 +
            C.IMPORTERECARGO4 + C.IMPORTERECARGO5) as RECARGO,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY TRIM(C.SERIEFACTURA)
      ORDER BY SERIEFACTURA
    `;

        const porSerie = await pool.query(queryPorSerie);

        console.log('Serie   | Facturas | Base Imp.    | IVA          | Recargo   | Total');
        console.log('--------|----------|--------------|--------------|-----------|-------------');

        let totalBaseGeneral = 0, totalIvaGeneral = 0, totalRecargoGeneral = 0, totalGeneral = 0;

        porSerie.forEach(s => {
            const base = parseFloat(s.BASE_IMPONIBLE) || 0;
            const iva = parseFloat(s.IVA) || 0;
            const rec = parseFloat(s.RECARGO) || 0;
            const tot = parseFloat(s.TOTAL) || 0;

            totalBaseGeneral += base;
            totalIvaGeneral += iva;
            totalRecargoGeneral += rec;
            totalGeneral += tot;

            console.log(
                `${(s.SERIEFACTURA || '').padEnd(7)} | ` +
                `${String(s.NUM_FACTURAS).padEnd(8)} | ` +
                `${base.toFixed(2).padStart(12)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${rec.toFixed(2).padStart(9)} | ` +
                `${tot.toFixed(2).padStart(12)}`
            );
        });

        console.log('--------|----------|--------------|--------------|-----------|-------------');
        console.log(
            `TOTAL   |          | ${totalBaseGeneral.toFixed(2).padStart(12)} | ` +
            `${totalIvaGeneral.toFixed(2).padStart(12)} | ` +
            `${totalRecargoGeneral.toFixed(2).padStart(9)} | ` +
            `${totalGeneral.toFixed(2).padStart(12)}`
        );

        // COMPARAR CON VALORES ESPERADOS DE LA CAPTURA
        console.log('\n📊 COMPARACIÓN CON VALORES ESPERADOS (captura del usuario):');
        console.log('   ESPERADO Serie A: Base=29.266,90 € (FACTURAS DIRECTAS TERMINALES 8,82%)');
        console.log('   ESPERADO Serie F: Base=165,01 € (FACTURAS VENTAS 10,00%)');
        console.log('   ESPERADO TOTAL: Base=29.431,91 € ...');
        console.log('   ¡Espera! Los datos del sistema sí dan 29.431,91€');
        console.log('   Pero la captura 1 muestra 29.256,80€... ¿Cuál es la referencia correcta?');

        // ═══════════════════════════════════════════════════════════════
        // 5. BUSCAR FACTURAS SERIE A CON DIFERENTES TIPOS DE IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('5. DESGLOSE SERIE A POR TIPO DE IVA (como captura 1)');
        console.log('   Captura 1 muestra: 21%, 10%, 4%');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryPorIVA = `
      SELECT
        C.PORCENTAJEIVA1 as TIPO_IVA,
        SUM(C.IMPORTEBASEIMPONIBLE1) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1) as IVA,
        SUM(C.IMPORTERECARGO1) as RECARGO,
        C.PORCENTAJERECARGO1 as TIPO_RECARGO
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND C.NUMEROFACTURA > 0
        AND C.IMPORTEBASEIMPONIBLE1 <> 0
      GROUP BY C.PORCENTAJEIVA1, C.PORCENTAJERECARGO1
      ORDER BY TIPO_IVA DESC
    `;

        const porIVA = await pool.query(queryPorIVA);

        console.log('% IVA    | Base Imp.    | IVA          | % Rec. | Recargo');
        console.log('---------|--------------|--------------|--------|----------');

        let sumBaseIVA = 0, sumIVA = 0;

        porIVA.forEach(i => {
            const base = parseFloat(i.BASE_IMPONIBLE) || 0;
            const iva = parseFloat(i.IVA) || 0;
            const rec = parseFloat(i.RECARGO) || 0;

            sumBaseIVA += base;
            sumIVA += iva;

            console.log(
                `${(i.TIPO_IVA || 0).toFixed(2).padStart(7)}% | ` +
                `${base.toFixed(2).padStart(12)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${(i.TIPO_RECARGO || 0).toFixed(2).padStart(6)} | ` +
                `${rec.toFixed(2).padStart(9)}`
            );
        });

        console.log(`\nSuma Serie A: Base=${sumBaseIVA.toFixed(2)}, IVA=${sumIVA.toFixed(2)}`);

        // VALORES DE LA CAPTURA 1 (referencia)
        console.log('\n📋 VALORES DE LA CAPTURA 1 (sistema de referencia):');
        console.log('   21%: Base=??? (no visible completo)');
        console.log('   10%: Base=23.429,03, IVA=2.343,05');
        console.log('   4%:  Base=5.662,76, IVA=226,51');
        console.log('   Total Serie A (según captura): Base=29.256,80, IVA=2.586,06');

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

investigar().catch(console.error);
