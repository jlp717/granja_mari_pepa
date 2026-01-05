/**
 * BÚSQUEDA EXHAUSTIVA EN TODA LA BASE DE DATOS
 * =============================================
 * Objetivo: Encontrar la fuente de datos que produce exactamente:
 *   - Base Imponible: 29.256,80€
 *   - IVA: 2.586,06€
 *   - Total: 31.842,86€
 * 
 * Tablas a explorar:
 * - DSEDAC.FACCLI (Facturas de Cliente - probablemente la fuente correcta)
 * - DSEDAC.CAC (Cabecera de Albaranes de Cliente - la que usamos actualmente)
 * - Otras tablas relacionadas
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;

// Valores de referencia EXACTOS
const REF = {
    base: 29256.80,
    iva: 2586.06,
    total: 31842.86
};

async function buscarFuenteDatos() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  BÚSQUEDA EXHAUSTIVA EN TODA LA BASE DE DATOS                   ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');
        console.log(`OBJETIVO: Encontrar Base=${REF.base}€, IVA=${REF.iva}€, Total=${REF.total}€\n`);

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. EXPLORAR TABLA FACCLI (Facturas de Cliente)
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. TABLA DSEDAC.FACCLI (Facturas de Cliente)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            // Primero ver las columnas disponibles
            const queryColumns = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'FACCLI'
        ORDER BY ORDINAL_POSITION
        FETCH FIRST 50 ROWS ONLY
      `;

            const columns = await pool.query(queryColumns);
            console.log('Columnas de FACCLI:');
            columns.forEach(c => {
                console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
            });

            // Ahora intentar sumar los totales
            const queryFaccli = `
        SELECT
          COUNT(*) as NUM_FACTURAS,
          SUM(F.TOTALFACTURA) as SUMA_BASE,
          SUM(F.IVAFACTURA) as SUMA_IVA,
          SUM(F.RECARGOFACTURA) as SUMA_RECARGO,
          SUM(F.TOTALFACTURA + F.IVAFACTURA + F.RECARGOFACTURA) as SUMA_TOTAL
        FROM DSEDAC.FACCLI F
        WHERE TRIM(F.CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
          AND F.EJERCICIOFACTURA = ${EJERCICIO}
      `;

            const faccli = (await pool.query(queryFaccli))[0];
            const baseFaccli = parseFloat(faccli.SUMA_BASE) || 0;
            const ivaFaccli = parseFloat(faccli.SUMA_IVA) || 0;
            const totalFaccli = parseFloat(faccli.SUMA_TOTAL) || 0;

            console.log(`\nResultados de FACCLI (EJERCICIOFACTURA=${EJERCICIO}):`);
            console.log(`  Facturas: ${faccli.NUM_FACTURAS}`);
            console.log(`  Base:  ${baseFaccli.toFixed(2)}€ (Ref: ${REF.base}€, Diff: ${(baseFaccli - REF.base).toFixed(2)}€)`);
            console.log(`  IVA:   ${ivaFaccli.toFixed(2)}€ (Ref: ${REF.iva}€, Diff: ${(ivaFaccli - REF.iva).toFixed(2)}€)`);
            console.log(`  Total: ${totalFaccli.toFixed(2)}€ (Ref: ${REF.total}€, Diff: ${(totalFaccli - REF.total).toFixed(2)}€)`);

            // Verificar también con FECHAFACTURA en lugar de EJERCICIOFACTURA
            const queryFaccliFecha = `
        SELECT
          COUNT(*) as NUM_FACTURAS,
          SUM(F.TOTALFACTURA) as SUMA_BASE,
          SUM(F.IVAFACTURA) as SUMA_IVA,
          SUM(F.TOTALFACTURA + F.IVAFACTURA + F.RECARGOFACTURA) as SUMA_TOTAL
        FROM DSEDAC.FACCLI F
        WHERE TRIM(F.CODIGOCLIENTE) = '${CODIGO_CLIENTE}'
          AND YEAR(F.FECHAFACTURA) = ${EJERCICIO}
      `;

            const faccliFecha = (await pool.query(queryFaccliFecha))[0];
            const baseFaccliFecha = parseFloat(faccliFecha.SUMA_BASE) || 0;

            console.log(`\nResultados de FACCLI (YEAR(FECHAFACTURA)=${EJERCICIO}):`);
            console.log(`  Facturas: ${faccliFecha.NUM_FACTURAS}`);
            console.log(`  Base:  ${baseFaccliFecha.toFixed(2)}€ (Diff: ${(baseFaccliFecha - REF.base).toFixed(2)}€)`);

        } catch (error) {
            console.log(`❌ Error accediendo a FACCLI: ${error.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. EXPLORAR OTRAS TABLAS DE FACTURACIÓN
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. BUSCAR OTRAS TABLAS DE FACTURACIÓN');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryTablas = `
        SELECT TABLE_NAME, TABLE_TEXT
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND (UPPER(TABLE_NAME) LIKE '%FAC%'
           OR UPPER(TABLE_NAME) LIKE '%IVA%'
           OR UPPER(TABLE_NAME) LIKE '%VEN%')
        ORDER BY TABLE_NAME
      `;

            const tablas = await pool.query(queryTablas);
            console.log('Tablas relacionadas con facturación/IVA:');
            tablas.forEach(t => {
                console.log(`  - ${t.TABLE_NAME}: ${t.TABLE_TEXT || '(sin descripción)'}`);
            });

        } catch (error) {
            console.log(`❌ Error buscando tablas: ${error.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. PROBAR DIFERENTES CÁLCULOS EN CAC
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. PROBAR DIFERENTES CÁLCULOS EN CAC');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Probar SIN sumar BASE2 y BASE4 (solo BASE1, BASE3, BASE5)
        const queryCAC1 = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE3 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA3 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const cac1 = (await pool.query(queryCAC1))[0];
        console.log(`CAC con BASE1+BASE3+BASE5 (sin BASE2, BASE4):`);
        console.log(`  Base: ${parseFloat(cac1.BASE).toFixed(2)}€ (Diff: ${(parseFloat(cac1.BASE) - REF.base).toFixed(2)}€)`);

        // Probar con IMPORTETOTAL directamente
        const queryCAC2 = `
      SELECT
        SUM(C.IMPORTETOTAL) as TOTAL,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const cac2 = (await pool.query(queryCAC2))[0];
        console.log(`\nCAC sumar todas las columnas:`);
        console.log(`  Base: ${parseFloat(cac2.BASE).toFixed(2)}€ (Diff: ${(parseFloat(cac2.BASE) - REF.base).toFixed(2)}€)`);
        console.log(`  IVA: ${parseFloat(cac2.IVA).toFixed(2)}€`);
        console.log(`  Total (IMPORTETOTAL): ${parseFloat(cac2.TOTAL).toFixed(2)}€`);

        // Probar solo facturas agrupadas (no albaranes sueltos)
        const queryCAC3 = `
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
        WHERE C.ANOFACTURA = ${EJERCICIO}
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.NUMEROFACTURA, C.SERIEFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        const cac3 = (await pool.query(queryCAC3))[0];
        console.log(`\nCAC agrupado por factura (solo base <> 0):`);
        console.log(`  Facturas: ${cac3.NUM_FACTURAS}`);
        console.log(`  Base: ${parseFloat(cac3.TOTAL_BASE).toFixed(2)}€ (Diff: ${(parseFloat(cac3.TOTAL_BASE) - REF.base).toFixed(2)}€)`);

        // ═══════════════════════════════════════════════════════════════
        // 4. VERIFICAR SI HAY COLUMNA BASEIMPONIBLEFACTURA EN CAC
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. BUSCAR COLUMNAS ALTERNATIVAS EN CAC');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryColsCAC = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CAC'
          AND (UPPER(COLUMN_NAME) LIKE '%BASE%'
           OR UPPER(COLUMN_NAME) LIKE '%IVA%'
           OR UPPER(COLUMN_NAME) LIKE '%TOTAL%'
           OR UPPER(COLUMN_NAME) LIKE '%IMPORTE%')
        ORDER BY COLUMN_NAME
      `;

            const colsCAC = await pool.query(queryColsCAC);
            console.log('Columnas de CAC relacionadas con importes:');
            colsCAC.forEach(c => {
                console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
            });

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }

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

buscarFuenteDatos().catch(console.error);
