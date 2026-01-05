/**
 * PROBAR COLUMNAS ALTERNATIVAS Y TABLA IVA
 * =========================================
 * Objetivo: Encontrar la fuente exacta para 29.256,80€
 * 
 * Nuevas pistas:
 * - IMPORTEBASEIMPONIBLEBRUTA1-5 (diferente a IMPORTEBASEIMPONIBLE1-5)
 * - Tabla DSEDAC.IVA
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const EJERCICIO = 2025;
const REF_BASE = 29256.80;

async function probarAlternativas() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  PROBAR COLUMNAS ALTERNATIVAS Y TABLA IVA                       ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');
        console.log(`OBJETIVO: Base=${REF_BASE}€\n`);

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. PROBAR IMPORTEBASEIMPONIBLEBRUTA vs IMPORTEBASEIMPONIBLE
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. COMPARAR IMPORTEBASEIMPONIBLE vs IMPORTEBASEIMPONIBLEBRUTA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryComparar = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE_NORMAL,
        SUM(C.IMPORTEBASEIMPONIBLEBRUTA1 + C.IMPORTEBASEIMPONIBLEBRUTA2 + C.IMPORTEBASEIMPONIBLEBRUTA3 +
            C.IMPORTEBASEIMPONIBLEBRUTA4 + C.IMPORTEBASEIMPONIBLEBRUTA5) as BASE_BRUTA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const comparar = (await pool.query(queryComparar))[0];
        const baseNormal = parseFloat(comparar.BASE_NORMAL) || 0;
        const baseBruta = parseFloat(comparar.BASE_BRUTA) || 0;

        console.log(`IMPORTEBASEIMPONIBLE (normal):     ${baseNormal.toFixed(2)}€ (Diff: ${(baseNormal - REF_BASE).toFixed(2)}€)`);
        console.log(`IMPORTEBASEIMPONIBLEBRUTA:         ${baseBruta.toFixed(2)}€ (Diff: ${(baseBruta - REF_BASE).toFixed(2)}€)`);
        console.log(`Diferencia entre ambas:            ${(baseNormal - baseBruta).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 2. EXPLORAR TABLA IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. EXPLORAR TABLA DSEDAC.IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryColsIVA = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'IVA'
        ORDER BY ORDINAL_POSITION
      `;

            const colsIVA = await pool.query(queryColsIVA);
            console.log('Columnas de tabla IVA:');
            colsIVA.forEach(c => {
                console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
            });

            // Intentar ver contenido
            const queryIVA = `SELECT * FROM DSEDAC.IVA FETCH FIRST 5 ROWS ONLY`;
            const datosIVA = await pool.query(queryIVA);
            console.log(`\nPrimeros registros de tabla IVA (${datosIVA.length} filas):`);
            if (datosIVA.length > 0) {
                console.log(JSON.stringify(datosIVA[0], null, 2));
            }
        } catch (error) {
            console.log(`❌ Error con tabla IVA: ${error.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. VER SI HAY DIFERENCIA POR BONIFICACIÓN O DESCUENTO
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. VERIFICAR BONIFICACIONES Y DESCUENTOS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryBonif = `
      SELECT
        SUM(C.IMPORTEBONIFICACION) as BONIFICACION,
        SUM(C.IMPORTEBONIFICACIONDIRECTA) as BONIFICACION_DIRECTA,
        SUM(C.IMPORTEDESCUENTO1) as DESCUENTO1,
        SUM(C.IMPORTEDESCUENTO2) as DESCUENTO2,
        SUM(C.IMPORTESINCARGO) as SIN_CARGO
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const bonif = (await pool.query(queryBonif))[0];
        console.log(`Bonificación: ${parseFloat(bonif.BONIFICACION).toFixed(2)}€`);
        console.log(`Bonificación Directa: ${parseFloat(bonif.BONIFICACION_DIRECTA).toFixed(2)}€`);
        console.log(`Descuento 1: ${parseFloat(bonif.DESCUENTO1).toFixed(2)}€`);
        console.log(`Descuento 2: ${parseFloat(bonif.DESCUENTO2).toFixed(2)}€`);
        console.log(`Sin Cargo: ${parseFloat(bonif.SIN_CARGO).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 4. PROBAR: BASE - BONIFICACIONES/DESCUENTOS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. PROBAR CÁLCULOS ALTERNATIVOS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Base bruta - descuentos podría dar la base neta correcta
        const totalBonif = parseFloat(bonif.BONIFICACION) + parseFloat(bonif.BONIFICACION_DIRECTA) +
            parseFloat(bonif.DESCUENTO1) + parseFloat(bonif.DESCUENTO2) +
            parseFloat(bonif.SIN_CARGO);

        console.log(`Base Normal - Bonificaciones: ${(baseNormal - totalBonif).toFixed(2)}€ (Diff: ${(baseNormal - totalBonif - REF_BASE).toFixed(2)}€)`);
        console.log(`Base Bruta - Bonificaciones: ${(baseBruta - totalBonif).toFixed(2)}€ (Diff: ${(baseBruta - totalBonif - REF_BASE).toFixed(2)}€)`);

        // ═══════════════════════════════════════════════════════════════
        // 5. VER REGISTROS INDIVIDUALES PARA ENTENDER LA DIFERENCIA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. ANALIZAR REGISTROS CON DIFERENCIA ENTRE BASE Y BASEBRUTA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryDiff = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
         C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        (C.IMPORTEBASEIMPONIBLEBRUTA1 + C.IMPORTEBASEIMPONIBLEBRUTA2 + C.IMPORTEBASEIMPONIBLEBRUTA3 +
         C.IMPORTEBASEIMPONIBLEBRUTA4 + C.IMPORTEBASEIMPONIBLEBRUTA5) as BASE_BRUTA,
        (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
         C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) -
        (C.IMPORTEBASEIMPONIBLEBRUTA1 + C.IMPORTEBASEIMPONIBLEBRUTA2 + C.IMPORTEBASEIMPONIBLEBRUTA3 +
         C.IMPORTEBASEIMPONIBLEBRUTA4 + C.IMPORTEBASEIMPONIBLEBRUTA5) as DIFERENCIA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
             C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <>
            (C.IMPORTEBASEIMPONIBLEBRUTA1 + C.IMPORTEBASEIMPONIBLEBRUTA2 + C.IMPORTEBASEIMPONIBLEBRUTA3 +
             C.IMPORTEBASEIMPONIBLEBRUTA4 + C.IMPORTEBASEIMPONIBLEBRUTA5)
      ORDER BY ABS((C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) -
                  (C.IMPORTEBASEIMPONIBLEBRUTA1 + C.IMPORTEBASEIMPONIBLEBRUTA2 + C.IMPORTEBASEIMPONIBLEBRUTA3 +
                   C.IMPORTEBASEIMPONIBLEBRUTA4 + C.IMPORTEBASEIMPONIBLEBRUTA5)) DESC
      FETCH FIRST 20 ROWS ONLY
    `;

        const diffs = await pool.query(queryDiff);
        console.log(`Registros donde BASE != BASE_BRUTA: ${diffs.length}`);
        if (diffs.length > 0) {
            console.log('\nFactura       | Fecha      | Base      | BaseBruta | Diferencia');
            console.log('--------------|------------|-----------|-----------|----------');
            let sumaDiff = 0;
            diffs.forEach(d => {
                const diff = parseFloat(d.DIFERENCIA) || 0;
                sumaDiff += diff;
                console.log(
                    `${d.FACTURA.padEnd(13)} | ${d.FECHA.padEnd(10)} | ` +
                    `${parseFloat(d.BASE).toFixed(2).padStart(9)} | ` +
                    `${parseFloat(d.BASE_BRUTA).toFixed(2).padStart(9)} | ` +
                    `${diff.toFixed(2).padStart(9)}`
                );
            });
            console.log(`\nSuma de diferencias en estos 20: ${sumaDiff.toFixed(2)}€`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. VERIFICAR USANDO IMPORTEBRUTO
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. VERIFICAR COLUMNA IMPORTEBRUTO');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryBruto = `
      SELECT
        SUM(C.IMPORTEBRUTO) as IMPORTE_BRUTO,
        SUM(C.IMPORTETOTAL) as IMPORTE_TOTAL
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = ${EJERCICIO}
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const bruto = (await pool.query(queryBruto))[0];
        console.log(`IMPORTEBRUTO: ${parseFloat(bruto.IMPORTE_BRUTO).toFixed(2)}€ (Diff: ${(parseFloat(bruto.IMPORTE_BRUTO) - REF_BASE).toFixed(2)}€)`);
        console.log(`IMPORTETOTAL: ${parseFloat(bruto.IMPORTE_TOTAL).toFixed(2)}€`);

        console.log('\n✓ Pruebas completadas\n');

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

probarAlternativas().catch(console.error);
