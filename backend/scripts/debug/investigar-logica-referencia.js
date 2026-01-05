/**
 * INVESTIGAR LA LÓGICA DEL SISTEMA DE REFERENCIA
 * ================================================
 * El sistema de referencia muestra 29.256,80€
 * - Con ANOFACTURA=2025: 29.431,91€ (+175€)
 * - Con EJERCICIOFACTURA=2025: 28.817,17€ (-440€)
 * 
 * El sistema de referencia INCLUYE las 3 facturas de enero 2025 con ejercicio 2024
 * Suma de esas 3 facturas: 614,74€ en base
 * 
 * ¿Qué pasa si usamos ANOFACTURA=2025 pero EXCLUYENDO ciertas facturas?
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

// Referencia exacta
const REF_TOTAL = 29256.80;

async function investigarLogica() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  INVESTIGAR LÓGICA DEL SISTEMA DE REFERENCIA                    ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // HIPÓTESIS 1: ¿Hay facturas con TIPOALBARAN diferente que se excluyen?
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('HIPÓTESIS 1: Desglose por CODIGOTIPOALBARAN');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryTipos = `
      SELECT
        C.CODIGOTIPOALBARAN,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.CODIGOTIPOALBARAN
    `;

        const tipos = await pool.query(queryTipos);
        console.log('Tipo Alb | Facturas | Base');
        console.log('---------|----------|------------');
        tipos.forEach(t => {
            console.log(`${String(t.CODIGOTIPOALBARAN).padEnd(8)} | ${String(t.NUM_FACTURAS).padEnd(8)} | ${parseFloat(t.BASE).toFixed(2)}`);
        });

        // ═══════════════════════════════════════════════════════════════
        // HIPÓTESIS 2: ¿Hay registros con IMPORTETOTAL que no coincide con suma BASE+IVA?
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('HIPÓTESIS 2: Verificar si hay facturas con NUMEROFACTURA <= 0 que SÍ aparecen en ref');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryNegFactura = `
      SELECT
        C.NUMEROFACTURA,
        COUNT(*) as REGISTROS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA <= 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA
    `;

        const negFact = await pool.query(queryNegFactura);
        console.log(`Registros con NUMEROFACTURA <= 0: ${negFact.length}`);
        negFact.forEach(n => {
            console.log(`  NumFactura=${n.NUMEROFACTURA}: ${n.REGISTROS} registros, Base=${parseFloat(n.BASE).toFixed(2)}€`);
        });

        // ═══════════════════════════════════════════════════════════════
        // HIPÓTESIS 3: Calcular usando la lógica del libro de IVA con HAVING correcto
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('HIPÓTESIS 3: ¿Qué total da si filtramos factura > 0 Y base > 0?');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Contar facturas que tienen base=0 pero IVA≠0 o viceversa
        const queryIncoherentes = `
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
      GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
      HAVING (SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) = 0
         OR SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) = 0
         OR SUM(C.IMPORTETOTAL) = 0)
        AND (SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                 C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
         OR SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
         OR SUM(C.IMPORTETOTAL) <> 0)
    `;

        const incoherentes = await pool.query(queryIncoherentes);
        console.log(`Facturas con valores incoherentes (alguno es 0 pero otros no): ${incoherentes.length}`);
        if (incoherentes.length > 0) {
            console.log('Factura     | Fecha      | Base      | IVA       | Total');
            console.log('------------|------------|-----------|-----------|----------');
            let sumaBaseInc = 0;
            incoherentes.forEach(i => {
                const base = parseFloat(i.BASE) || 0;
                sumaBaseInc += base;
                console.log(
                    `${i.FACTURA.padEnd(11)} | ${i.FECHA.padEnd(10)} | ` +
                    `${base.toFixed(2).padStart(9)} | ${parseFloat(i.IVA).toFixed(2).padStart(9)} | ${parseFloat(i.TOTAL).toFixed(2).padStart(9)}`
                );
            });
            console.log(`\nSuma de base de estas facturas: ${sumaBaseInc.toFixed(2)}€`);
        }

        // ═══════════════════════════════════════════════════════════════
        // HIPÓTESIS 4: Comparar conteo de facturas únicas vs la referencia
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('HIPÓTESIS 4: Contar facturas exactas del sistema de referencia');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // ¿Cuántas facturas tiene el sistema de referencia? Contar en la página 1 y extrapolar
        // Primeras líneas: 2024-A-000-009112, luego 2024-A-000-009160, etc.

        // Vamos a contar cuántas facturas tenemos con las condiciones del controlador actual
        const queryConteo = `
      SELECT COUNT(*) as TOTAL
      FROM (
        SELECT C.NUMEROFACTURA
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
           AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
           AND SUM(C.IMPORTETOTAL) <> 0
      ) T
    `;

        const conteo = (await pool.query(queryConteo))[0];
        console.log(`Nuestro sistema tiene: ${conteo.TOTAL} facturas (con HAVING actual)`);
        console.log(`El sistema de referencia tiene ~385 facturas/líneas de detalle (15 páginas * ~26 líneas)`);

        // ═══════════════════════════════════════════════════════════════
        // CONCLUSIÓN TEMPORAL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('CONCLUSIÓN');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('La diferencia de 175€ parece venir de una lógica de cálculo diferente.');
        console.log('Posibilidades:');
        console.log('1. El sistema de referencia suma los valores SIN incluir algunas columnas BASE2-5');
        console.log('2. Hay redondeos diferentes en el cálculo');
        console.log('3. El sistema de referencia usa una tabla diferente (no CAC)');

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

investigarLogica().catch(console.error);
