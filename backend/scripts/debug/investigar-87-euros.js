/**
 * INVESTIGAR DIFERENCIA DE 87€ EN CADA TIPO DE IVA
 * =================================================
 * Sabemos que:
 * - Serie A 10%: +87,31€ extra
 * - Serie A 4%: +87,80€ extra
 * - Total: +175,11€
 * 
 * Posibles causas:
 * 1. Líneas que nosotros sumamos pero no deberían (ej: IVA 21%)
 * 2. Valores negativos que se suman diferente
 * 3. Algún criterio de exclusión que desconocemos
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function investigarDiferencia87() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  INVESTIGAR DIFERENCIA DE 87€ EN CADA TIPO DE IVA              ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER SI HAY LÍNEAS CON IVA 21%
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. LÍNEAS CON IVA 21%');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const query21 = `
      SELECT
        SUM(CASE WHEN C.PORCENTAJEIVA1 BETWEEN 20.5 AND 21.5 THEN C.IMPORTEBASEIMPONIBLE1 ELSE 0 END) as BASE1_21,
        SUM(CASE WHEN C.PORCENTAJEIVA2 BETWEEN 20.5 AND 21.5 THEN C.IMPORTEBASEIMPONIBLE2 ELSE 0 END) as BASE2_21,
        SUM(CASE WHEN C.PORCENTAJEIVA3 BETWEEN 20.5 AND 21.5 THEN C.IMPORTEBASEIMPONIBLE3 ELSE 0 END) as BASE3_21,
        SUM(CASE WHEN C.PORCENTAJEIVA4 BETWEEN 20.5 AND 21.5 THEN C.IMPORTEBASEIMPONIBLE4 ELSE 0 END) as BASE4_21,
        SUM(CASE WHEN C.PORCENTAJEIVA5 BETWEEN 20.5 AND 21.5 THEN C.IMPORTEBASEIMPONIBLE5 ELSE 0 END) as BASE5_21
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
    `;

        const iva21 = (await pool.query(query21))[0];
        console.log('Base con IVA 21%:');
        console.log('  Col 1: ' + (parseFloat(iva21.BASE1_21) || 0).toFixed(2));
        console.log('  Col 2: ' + (parseFloat(iva21.BASE2_21) || 0).toFixed(2));
        console.log('  Col 3: ' + (parseFloat(iva21.BASE3_21) || 0).toFixed(2));
        console.log('  Col 4: ' + (parseFloat(iva21.BASE4_21) || 0).toFixed(2));
        console.log('  Col 5: ' + (parseFloat(iva21.BASE5_21) || 0).toFixed(2));

        // ═══════════════════════════════════════════════════════════════
        // 2. VER LÍNEAS CON BASE=0 PERO IVA<>0
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. LÍNEAS DONDE BASE=0 PERO EN TEXTO APARECE % IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // En el texto veo líneas como "10,00" o "4,00" sola - esto indica base=0
        // Ejemplo: factura 2025-A-000-000672 tiene "10,00 15,70" 
        // donde la primera línea tiene base=0 e IVA 10% (solo aparece el %)

        const queryBase0 = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as B1,
        C.PORCENTAJEIVA1 as P1,
        C.IMPORTEBASEIMPONIBLE2 as B2,
        C.PORCENTAJEIVA2 as P2
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND (
          (C.IMPORTEBASEIMPONIBLE1 = 0 AND C.PORCENTAJEIVA1 > 0) OR
          (C.IMPORTEBASEIMPONIBLE2 = 0 AND C.PORCENTAJEIVA2 > 0)
        )
      ORDER BY C.NUMEROFACTURA
      FETCH FIRST 10 ROWS ONLY
    `;

        const base0 = await pool.query(queryBase0);
        console.log('Líneas con Base=0 pero porcentaje de IVA: ' + base0.length);
        if (base0.length > 0) {
            base0.forEach(b => {
                console.log('  ' + b.FACTURA + ' ' + b.FECHA + ': B1=' + (parseFloat(b.B1) || 0) + '(' + b.P1 + '%) B2=' + (parseFloat(b.B2) || 0) + '(' + b.P2 + '%)');
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. BUSCAR EN COLUMNA 2 (PUEDE TENER DATOS)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. TOTALES EN COLUMNA 2 (que no estamos sumando)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryCol2 = `
      SELECT
        C.PORCENTAJEIVA2 as PORC,
        SUM(C.IMPORTEBASEIMPONIBLE2) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
        AND C.IMPORTEBASEIMPONIBLE2 <> 0
      GROUP BY C.PORCENTAJEIVA2
    `;

        const col2 = await pool.query(queryCol2);
        if (col2.length > 0) {
            console.log('Columna 2 tiene datos:');
            col2.forEach(c => {
                console.log('  IVA ' + c.PORC + '%: ' + (parseFloat(c.BASE) || 0).toFixed(2));
            });
        } else {
            console.log('Columna 2 no tiene datos (todas las bases son 0)');
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. BUSCAR EN COLUMNA 4
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. TOTALES EN COLUMNA 4');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryCol4 = `
      SELECT
        C.PORCENTAJEIVA4 as PORC,
        SUM(C.IMPORTEBASEIMPONIBLE4) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
        AND C.IMPORTEBASEIMPONIBLE4 <> 0
      GROUP BY C.PORCENTAJEIVA4
    `;

        const col4 = await pool.query(queryCol4);
        if (col4.length > 0) {
            console.log('Columna 4 tiene datos:');
            col4.forEach(c => {
                console.log('  IVA ' + c.PORC + '%: ' + (parseFloat(c.BASE) || 0).toFixed(2));
            });
        } else {
            console.log('Columna 4 no tiene datos');
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. PROBAR CON DSEDAC.M347 (la tabla del modelo 347)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. PROBAR TABLA DSEDAC.M347');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCols = `
        SELECT COLUMN_NAME
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'M347'
        ORDER BY ORDINAL_POSITION
        FETCH FIRST 20 ROWS ONLY
      `;
            const cols = await pool.query(queryCols);
            console.log('Columnas de DSEDAC.M347:');
            cols.forEach(c => console.log('  ' + c.COLUMN_NAME));
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. VER FACTURAS QUE SUMAN CERCA DE 87€ (IVA 10%)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. FACTURAS CON BASE ~87€ EN IVA 10%');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // La diferencia exacta es 87,31€ en IVA 10%, buscar facturas que sumen eso
        const query87 = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE5 as BASE_10
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE5) BETWEEN 40 AND 90
      ORDER BY (C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE5) DESC
      FETCH FIRST 10 ROWS ONLY
    `;

        const f87 = await pool.query(query87);
        console.log('Facturas con base 10% entre 40-90 EUR:');
        f87.forEach(f => {
            console.log('  ' + f.FACTURA + ' ' + f.FECHA + ': ' + (parseFloat(f.BASE_10) || 0).toFixed(2));
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

investigarDiferencia87().catch(console.error);
