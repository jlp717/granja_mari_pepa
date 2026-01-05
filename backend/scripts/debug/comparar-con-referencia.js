/**
 * SCRIPT DE DIAGNÓSTICO: Comparar desglose por tipo de IVA con referencia
 * =======================================================================
 * La referencia muestra para Serie A:
 *   - 21%: ???
 *   - 10%: Base=23.429,03, IVA=2.343,05
 *   - 4%:  Base=5.662,76, IVA=226,51
 *   - Total Serie A: debe ser igual a suma
 *   
 * Nosotros obtenemos Serie A = 29.266,90€
 * Diferencia = 175,11€
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;

async function compararPorTipoIVA() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  COMPARACIÓN DETALLADA POR TIPO DE IVA                          ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // Valores de referencia (de la captura del usuario)
        const REFERENCIA = {
            serieA: {
                iva21: { base: null, iva: null }, // No visible completo
                iva10: { base: 23429.03, iva: 2343.05, recargo: 1.40 },
                iva4: { base: 5662.76, iva: 226.51, recargo: 0.50 },
                totalBase: 29256.80 - 165.01 // 29091.79
            },
            serieF: {
                iva10: { base: 165.01, iva: 16.50 }
            },
            totalBase: 29256.80,
            totalIva: 2586.06,
            totalGeneral: 31842.86
        };

        console.log('📋 VALORES DE REFERENCIA (de la captura):');
        console.log('   Serie A - IVA 10%: Base=23.429,03€, IVA=2.343,05€');
        console.log('   Serie A - IVA 4%:  Base=5.662,76€, IVA=226,51€');
        console.log('   Serie F - IVA 10%: Base=165,01€, IVA=16,50€');
        console.log(`   Total Base: 29.256,80€\n`);

        // ═══════════════════════════════════════════════════════════════
        // 1. DESGLOSE SERIE A POR TIPO DE IVA (con todos los campos)
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. NUESTRO DESGLOSE SERIE A POR TIPO DE IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Query que agrupa por porcentaje de IVA en Serie A
        const querySerieA = `
      SELECT
        C.PORCENTAJEIVA1 as TIPO_IVA,
        SUM(C.IMPORTEBASEIMPONIBLE1) as BASE_IMPONIBLE,
        SUM(C.IMPORTEIVA1) as IVA,
        C.PORCENTAJERECARGO1 as TIPO_RECARGO,
        SUM(C.IMPORTERECARGO1) as RECARGO,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND C.NUMEROFACTURA > 0
      GROUP BY C.PORCENTAJEIVA1, C.PORCENTAJERECARGO1
      ORDER BY TIPO_IVA DESC
    `;

        const serieA = await pool.query(querySerieA);

        console.log('% IVA   | Base Imponible | IVA          | % Rec  | Recargo    | Facturas');
        console.log('--------|----------------|--------------|--------|------------|----------');

        let totalBaseA = 0, totalIvaA = 0;

        serieA.forEach(row => {
            const base = parseFloat(row.BASE_IMPONIBLE) || 0;
            const iva = parseFloat(row.IVA) || 0;
            const rec = parseFloat(row.RECARGO) || 0;

            totalBaseA += base;
            totalIvaA += iva;

            console.log(
                `${(row.TIPO_IVA || 0).toFixed(2).padStart(6)}% | ` +
                `${base.toFixed(2).padStart(14)} | ` +
                `${iva.toFixed(2).padStart(12)} | ` +
                `${(row.TIPO_RECARGO || 0).toFixed(2).padStart(6)} | ` +
                `${rec.toFixed(2).padStart(10)} | ` +
                `${row.NUM_FACTURAS}`
            );
        });

        console.log('--------|----------------|--------------|--------|------------|----------');
        console.log(`TOTAL   | ${totalBaseA.toFixed(2).padStart(14)} | ${totalIvaA.toFixed(2).padStart(12)} |`);

        console.log('\n📊 COMPARACIÓN CON REFERENCIA:');

        // Buscar valores específicos
        const nuestroIva10 = serieA.find(r => Math.abs(r.TIPO_IVA - 10) < 0.1);
        const nuestroIva4 = serieA.find(r => Math.abs(r.TIPO_IVA - 4) < 0.1);

        if (nuestroIva10) {
            const baseNuestra10 = parseFloat(nuestroIva10.BASE_IMPONIBLE) || 0;
            const diff10 = baseNuestra10 - REFERENCIA.serieA.iva10.base;
            console.log(`   IVA 10%: Nuestra=${baseNuestra10.toFixed(2)}€ vs Ref=${REFERENCIA.serieA.iva10.base.toFixed(2)}€ → Diff=${diff10.toFixed(2)}€`);
        }

        if (nuestroIva4) {
            const baseNuestra4 = parseFloat(nuestroIva4.BASE_IMPONIBLE) || 0;
            const diff4 = baseNuestra4 - REFERENCIA.serieA.iva4.base;
            console.log(`   IVA 4%:  Nuestra=${baseNuestra4.toFixed(2)}€ vs Ref=${REFERENCIA.serieA.iva4.base.toFixed(2)}€ → Diff=${diff4.toFixed(2)}€`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. POSIBLES CAUSAS DEL PROBLEMA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n\n═══════════════════════════════════════════════════════════════');
        console.log('2. BUSCANDO LA CAUSA: Facturas/registros que suman ~175€ extra');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Buscar si hay registros duplicados por la suma de IMPORTEBASEIMPONIBLE2, 3, 4, 5
        const queryOtrasColumnas = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE2) as BASE2,
        SUM(C.IMPORTEBASEIMPONIBLE3) as BASE3,
        SUM(C.IMPORTEBASEIMPONIBLE4) as BASE4,
        SUM(C.IMPORTEBASEIMPONIBLE5) as BASE5,
        SUM(C.IMPORTEIVA2) as IVA2,
        SUM(C.IMPORTEIVA3) as IVA3,
        SUM(C.IMPORTEIVA4) as IVA4,
        SUM(C.IMPORTEIVA5) as IVA5
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND C.NUMEROFACTURA > 0
    `;

        const otras = (await pool.query(queryOtrasColumnas))[0];

        console.log('Verificando columnas IMPORTEBASEIMPONIBLE2-5:');
        const base2 = parseFloat(otras.BASE2) || 0;
        const base3 = parseFloat(otras.BASE3) || 0;
        const base4 = parseFloat(otras.BASE4) || 0;
        const base5 = parseFloat(otras.BASE5) || 0;
        console.log(`   BASE2=${base2.toFixed(2)}, BASE3=${base3.toFixed(2)}, BASE4=${base4.toFixed(2)}, BASE5=${base5.toFixed(2)}`);
        console.log(`   Total adicional: ${(base2 + base3 + base4 + base5).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 3. VERIFICAR SI HAY FACTURAS DE 2024 CON FECHA 2025
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. FACTURAS CON DIFERENTE EJERCICIO vs FECHA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryEjercicio = `
      SELECT
        C.EJERCICIOFACTURA,
        C.ANOFACTURA,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND (C.ANOFACTURA = ${EJERCICIO} OR C.EJERCICIOFACTURA = ${EJERCICIO})
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND C.NUMEROFACTURA > 0
      GROUP BY C.EJERCICIOFACTURA, C.ANOFACTURA
    `;

        const ejercicios = await pool.query(queryEjercicio);

        console.log('EJERCICIO | AÑO FACTURA | Facturas | Base');
        console.log('----------|-------------|----------|------------');
        ejercicios.forEach(e => {
            console.log(
                `${String(e.EJERCICIOFACTURA).padEnd(9)} | ` +
                `${String(e.ANOFACTURA).padEnd(11)} | ` +
                `${String(e.NUM_FACTURAS).padEnd(8)} | ` +
                `${(parseFloat(e.BASE) || 0).toFixed(2).padStart(10)}`
            );
        });

        // ═══════════════════════════════════════════════════════════════
        // 4. COMPARAR SUMA TOTAL DE BASE1 SOLO (sin BASE2-5)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. SUMA USANDO SOLO IMPORTEBASEIMPONIBLE1 (sin BASE2-5)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySoloBase1 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(C.IMPORTEBASEIMPONIBLE1) as BASE1,
        SUM(C.IMPORTEIVA1) as IVA1
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const soloBase1 = await pool.query(querySoloBase1);

        let totalBase1 = 0, totalIva1 = 0;

        console.log('Serie | Base1        | IVA1');
        console.log('------|--------------|------------');
        soloBase1.forEach(s => {
            const b = parseFloat(s.BASE1) || 0;
            const i = parseFloat(s.IVA1) || 0;
            totalBase1 += b;
            totalIva1 += i;
            console.log(
                `${(s.SERIE || '').padEnd(5)} | ` +
                `${b.toFixed(2).padStart(12)} | ` +
                `${i.toFixed(2).padStart(11)}`
            );
        });
        console.log('------|--------------|------------');
        console.log(`TOTAL | ${totalBase1.toFixed(2).padStart(12)} | ${totalIva1.toFixed(2).padStart(11)}`);

        const diffConRef = totalBase1 - REFERENCIA.totalBase;
        console.log(`\n📊 Comparación con referencia (29.256,80€):`);
        console.log(`   Nuestra Base1 total: ${totalBase1.toFixed(2)}€`);
        console.log(`   Diferencia: ${diffConRef.toFixed(2)}€`);

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

compararPorTipoIVA().catch(console.error);
