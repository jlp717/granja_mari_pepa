/**
 * SCRIPT DE DIAGNÓSTICO FINAL: Entender la estructura de IVA CORRECTAMENTE
 * =========================================================================
 * El problema es que hay múltiples tipos de IVA en cada factura:
 * - IMPORTEBASEIMPONIBLE1 + PORCENTAJEIVA1 (ej: 10%)
 * - IMPORTEBASEIMPONIBLE3 + PORCENTAJEIVA3 (ej: 4%)
 * - IMPORTEBASEIMPONIBLE5 + PORCENTAJEIVA5 (ej: 21%)
 * 
 * Debemos agrupar por tipo de IVA sumando TODAS las columnas correspondientes
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;

async function analizarEstructuraIVA() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  ANÁLISIS COMPLETO DE ESTRUCTURA IVA (COLUMNAS 1-5)             ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER QUÉ PORCENTAJES DE IVA EXISTEN EN CADA COLUMNA
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. PORCENTAJES DE IVA POR COLUMNA (Serie A)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        for (let i = 1; i <= 5; i++) {
            const query = `
        SELECT
          C.PORCENTAJEIVA${i} as TIPO_IVA,
          SUM(C.IMPORTEBASEIMPONIBLE${i}) as BASE,
          SUM(C.IMPORTEIVA${i}) as IVA,
          C.PORCENTAJERECARGO${i} as TIPO_REC,
          SUM(C.IMPORTERECARGO${i}) as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE${i} <> 0
        GROUP BY C.PORCENTAJEIVA${i}, C.PORCENTAJERECARGO${i}
        ORDER BY TIPO_IVA DESC
      `;

            const result = await pool.query(query);

            if (result.length > 0) {
                console.log(`Columna ${i} (IMPORTEBASEIMPONIBLE${i}):`);
                console.log('  % IVA   | Base         | IVA          | % Rec  | Recargo');
                console.log('  --------|--------------|--------------|--------|----------');
                let sumBase = 0, sumIva = 0;
                result.forEach(r => {
                    const base = parseFloat(r.BASE) || 0;
                    const iva = parseFloat(r.IVA) || 0;
                    sumBase += base;
                    sumIva += iva;
                    console.log(
                        `  ${(r.TIPO_IVA || 0).toFixed(2).padStart(6)}% | ` +
                        `${base.toFixed(2).padStart(12)} | ` +
                        `${iva.toFixed(2).padStart(12)} | ` +
                        `${(r.TIPO_REC || 0).toFixed(2).padStart(6)} | ` +
                        `${(parseFloat(r.RECARGO) || 0).toFixed(2).padStart(9)}`
                    );
                });
                console.log(`  Total Col${i}: Base=${sumBase.toFixed(2)}, IVA=${sumIva.toFixed(2)}\n`);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. SUMAR CORRECTAMENTE POR TIPO DE IVA (UNION de columnas)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. SUMA CORRECTA POR TIPO DE IVA (combinando columnas 1-5)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryUnion = `
      SELECT TIPO_IVA, TIPO_REC, SUM(BASE) as BASE, SUM(IVA) as IVA, SUM(RECARGO) as RECARGO
      FROM (
        -- Columna 1
        SELECT 
          C.PORCENTAJEIVA1 as TIPO_IVA,
          C.PORCENTAJERECARGO1 as TIPO_REC,
          C.IMPORTEBASEIMPONIBLE1 as BASE,
          C.IMPORTEIVA1 as IVA,
          C.IMPORTERECARGO1 as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE1 <> 0
        
        UNION ALL
        
        -- Columna 2
        SELECT 
          C.PORCENTAJEIVA2 as TIPO_IVA,
          C.PORCENTAJERECARGO2 as TIPO_REC,
          C.IMPORTEBASEIMPONIBLE2 as BASE,
          C.IMPORTEIVA2 as IVA,
          C.IMPORTERECARGO2 as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE2 <> 0
        
        UNION ALL
        
        -- Columna 3
        SELECT 
          C.PORCENTAJEIVA3 as TIPO_IVA,
          C.PORCENTAJERECARGO3 as TIPO_REC,
          C.IMPORTEBASEIMPONIBLE3 as BASE,
          C.IMPORTEIVA3 as IVA,
          C.IMPORTERECARGO3 as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE3 <> 0
        
        UNION ALL
        
        -- Columna 4
        SELECT 
          C.PORCENTAJEIVA4 as TIPO_IVA,
          C.PORCENTAJERECARGO4 as TIPO_REC,
          C.IMPORTEBASEIMPONIBLE4 as BASE,
          C.IMPORTEIVA4 as IVA,
          C.IMPORTERECARGO4 as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE4 <> 0
        
        UNION ALL
        
        -- Columna 5
        SELECT 
          C.PORCENTAJEIVA5 as TIPO_IVA,
          C.PORCENTAJERECARGO5 as TIPO_REC,
          C.IMPORTEBASEIMPONIBLE5 as BASE,
          C.IMPORTEIVA5 as IVA,
          C.IMPORTERECARGO5 as RECARGO
        FROM DSEDAC.CAC C
        WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          AND C.ANOFACTURA = ${EJERCICIO}
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND C.NUMEROFACTURA > 0
          AND C.IMPORTEBASEIMPONIBLE5 <> 0
      ) AS TODAS
      GROUP BY TIPO_IVA, TIPO_REC
      ORDER BY TIPO_IVA DESC
    `;

        const porTipoIVA = await pool.query(queryUnion);

        console.log('% IVA   | Base Imponible | IVA          | % Rec  | Recargo');
        console.log('--------|----------------|--------------|--------|----------');

        let totalBase = 0, totalIva = 0, totalRecargo = 0;

        porTipoIVA.forEach(r => {
            const base = parseFloat(r.BASE) || 0;
            const iva = parseFloat(r.IVA) || 0;
            const rec = parseFloat(r.RECARGO) || 0;

            totalBase += base;
            totalIva += iva;
            totalRecargo += rec;

            console.log(
                `${(r.TIPO_IVA || 0).toFixed(2).padStart(6)}% | ` +
                `${base.toFixed(2).padStart(14)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${(r.TIPO_REC || 0).toFixed(2).padStart(6)} | ` +
                `${rec.toFixed(2).padStart(9)}`
            );
        });

        console.log('--------|----------------|--------------|--------|----------');
        console.log(`TOTAL   | ${totalBase.toFixed(2).padStart(14)} | ${totalIva.toFixed(2).padStart(12)} |        | ${totalRecargo.toFixed(2).padStart(9)}`);

        // COMPARAR CON REFERENCIA
        console.log('\n📊 COMPARACIÓN CON REFERENCIA:');
        console.log('   Referencia Serie A:');
        console.log('     - 21%: ??? (no visible)');
        console.log('     - 10%: Base=23.429,03€, IVA=2.343,05€, Rec=1.40%');
        console.log('     - 4%:  Base=5.662,76€, IVA=226,51€, Rec=0.50%');
        console.log('     - Total: Base=29.091,79€ (aprox)');
        console.log(`\n   Nuestro (Serie A unificado): Base=${totalBase.toFixed(2)}€, IVA=${totalIva.toFixed(2)}€`);
        console.log(`   Diferencia: ${(totalBase - 29091.79).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 3. MISMO ANÁLISIS PARA SERIE F
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('3. SERIE F (para comparar)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieF = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND TRIM(C.SERIEFACTURA) = 'F'
        AND C.NUMEROFACTURA > 0
    `;

        const serieF = (await pool.query(querySerieF))[0];
        console.log(`Serie F: Base=${(parseFloat(serieF.BASE) || 0).toFixed(2)}€, IVA=${(parseFloat(serieF.IVA) || 0).toFixed(2)}€`);
        console.log('Referencia: Base=165,01€, IVA=16,50€');

        // ═══════════════════════════════════════════════════════════════
        // 4. TOTAL GENERAL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. TOTAL GENERAL (A + F)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const totalGeneralBase = totalBase + (parseFloat(serieF.BASE) || 0);
        const totalGeneralIva = totalIva + (parseFloat(serieF.IVA) || 0);

        console.log(`Nuestro Total: Base=${totalGeneralBase.toFixed(2)}€, IVA=${totalGeneralIva.toFixed(2)}€`);
        console.log('Referencia:    Base=29.256,80€, IVA=2.586,06€');
        console.log(`Diferencia:    Base=${(totalGeneralBase - 29256.80).toFixed(2)}€, IVA=${(totalGeneralIva - 2586.06).toFixed(2)}€`);

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

analizarEstructuraIVA().catch(console.error);
