/**
 * BUSCAR EXACTAMENTE LAS FACTURAS QUE CAUSAN LA DIFERENCIA
 * =========================================================
 * Sabemos que la diferencia es +175,11€ en base
 * Necesitamos encontrar QUÉ facturas incluimos nosotros que el sistema de referencia NO incluye
 * 
 * Posibles causas:
 * 1. Facturas de series diferentes (no A ni F)
 * 2. Facturas duplicadas
 * 3. Facturas con fecha fuera del rango
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function buscarFacturasDiferencia() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  BUSCAR FACTURAS QUE CAUSAN LA DIFERENCIA DE 175€               ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER SI HAY OTRAS SERIES APARTE DE A Y F
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. SERIES DE FACTURAS EN NUESTRO SISTEMA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySeries = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const series = await pool.query(querySeries);
        series.forEach(s => {
            console.log(`Serie ${s.SERIE || '(vacía)'}: ${s.NUM_FACTURAS} facturas, Base=${parseFloat(s.BASE).toFixed(2)}€`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 2. VERIFICAR SI HAY FACTURAS DUPLICADAS (mismo número, diferente fecha)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. FACTURAS DUPLICADAS (mismo número, diferente fecha)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryDuplicadas = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.NUMEROFACTURA,
        COUNT(DISTINCT (C.DIAFACTURA * 10000 + C.MESFACTURA * 100 + C.ANOFACTURA)) as NUM_FECHAS
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA
      HAVING COUNT(DISTINCT (C.DIAFACTURA * 10000 + C.MESFACTURA * 100 + C.ANOFACTURA)) > 1
    `;

        const duplicadas = await pool.query(queryDuplicadas);
        console.log(`Facturas con múltiples fechas: ${duplicadas.length}`);
        duplicadas.forEach(d => {
            console.log(`  ${d.SERIE}-${d.NUMEROFACTURA}: ${d.NUM_FECHAS} fechas diferentes`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 3. COMPARAR CUENTA DE FACTURAS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. CONTAR FACTURAS POR SERIE (comparar con referencia)');
        console.log('   Referencia: 379 facturas Serie A + 2 facturas Serie F = 381');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryConteo = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        COUNT(*) as NUM_REGISTROS_CAC,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS_UNICAS
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const conteo = await pool.query(queryConteo);
        conteo.forEach(c => {
            console.log(`Serie ${c.SERIE}: ${c.NUM_FACTURAS_UNICAS} facturas únicas (${c.NUM_REGISTROS_CAC} registros en CAC)`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 4. VERIFICAR SI F-7370 se está contando DOBLE
        //    (aparece con serie F Y también como A-7370)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. VERIFICAR SI HAY FACTURA 7370 EN AMBAS SERIES');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const query7370 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.NUMEROFACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.NUMEROFACTURA = 7370
        AND C.ANOFACTURA = 2025
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
    `;

        const fact7370 = await pool.query(query7370);
        console.log(`Número 7370 aparece en:`);
        fact7370.forEach(f => {
            console.log(`  Serie ${f.SERIE}: ${f.FECHA}, Base=${parseFloat(f.BASE).toFixed(2)}€`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 5. LISTAR TODAS LAS FACTURAS SERIE F
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. TODAS LAS FACTURAS SERIE F (deberían ser 2)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieF = `
      SELECT
        C.NUMEROFACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'F'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
    `;

        const serieF = await pool.query(querySerieF);
        console.log(`Serie F tiene ${serieF.length} facturas:`);
        serieF.forEach(f => {
            console.log(`  F-${f.NUMEROFACTURA}: ${f.FECHA}, Base=${parseFloat(f.BASE).toFixed(2)}€, IVA=${parseFloat(f.IVA).toFixed(2)}€`);
        });

        // ═══════════════════════════════════════════════════════════════
        // 6. VER SI HAY FACTURA A-7370 TAMBIÉN
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. VERIFICAR FACTURA A-7370 (¿existe?)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryA7370 = `
      SELECT
        C.NUMEROFACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.NUMEROFACTURA = 7370
        AND C.ANOFACTURA = 2025
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
    `;

        const a7370 = await pool.query(queryA7370);
        if (a7370.length > 0) {
            console.log(`¡SÍ EXISTE A-7370!`);
            a7370.forEach(f => {
                console.log(`  A-7370: ${f.FECHA}, Base=${parseFloat(f.BASE).toFixed(2)}€, IVA=${parseFloat(f.IVA).toFixed(2)}€`);
            });
        } else {
            console.log(`A-7370 NO existe (solo F-7370)`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 7. VER SI HAY FACTURAS CON FECHA FUERA DEL RANGO ESPERADO
        //    (enero-diciembre 2025)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('7. FECHAS MÍNIMA Y MÁXIMA DE FACTURAS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryFechas = `
      SELECT
        MIN(C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA) as FECHA_MIN,
        MAX(C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA) as FECHA_MAX
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const fechas = (await pool.query(queryFechas))[0];
        console.log(`Fecha mínima: ${fechas.FECHA_MIN}`);
        console.log(`Fecha máxima: ${fechas.FECHA_MAX}`);

        console.log('\n✓ Búsqueda completada\n');

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

buscarFacturasDiferencia().catch(console.error);
