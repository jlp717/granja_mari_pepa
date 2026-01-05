/**
 * IDENTIFICAR LAS 2 FACTURAS EXTRA EN SERIE A
 * ============================================
 * Nosotros tenemos 381 facturas Serie A
 * La referencia tiene 379 facturas Serie A
 * Diferencia: +2 facturas = ~175€
 * 
 * Hipótesis: Las facturas extra podrían ser del EJERCICIO 2024 con fecha 2025
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function identificarFacturasExtra() {
  let pool;

  try {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║  IDENTIFICAR LAS 2 FACTURAS EXTRA EN SERIE A                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    pool = require('../../app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // ═══════════════════════════════════════════════════════════════
    // 1. AGRUPAR FACTURAS POR EJERCICIOFACTURA
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('1. FACTURAS POR EJERCICIO (Serie A)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryEjercicio = `
      SELECT
        C.EJERCICIOFACTURA,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.EJERCICIOFACTURA
    `;

    const ejercicios = await pool.query(queryEjercicio);
    let total = 0;
    ejercicios.forEach(e => {
      const base = parseFloat(e.BASE) || 0;
      total += base;
      console.log(`Ejercicio ${e.EJERCICIOFACTURA}: ${e.NUM_FACTURAS} facturas, Base=${base.toFixed(2)}€`);
    });
    console.log(`TOTAL: Base=${total.toFixed(2)}€`);

    // ═══════════════════════════════════════════════════════════════
    // 2. LISTAR FACTURAS DEL EJERCICIO 2024 (con fecha 2025)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('2. FACTURAS DE EJERCICIO 2024 CON FECHA 2025 (posibles extra)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const query2024 = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.EJERCICIOFACTURA as EJERC,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.EJERCICIOFACTURA = 2024
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA, C.EJERCICIOFACTURA
    `;

    const fact2024 = await pool.query(query2024);
    let sumaBase2024 = 0;
    console.log('Factura         | Fecha      | Ejerc | Base       | IVA');
    console.log('----------------|------------|-------|------------|----------');
    fact2024.forEach(f => {
      const base = parseFloat(f.BASE) || 0;
      const iva = parseFloat(f.IVA) || 0;
      sumaBase2024 += base;
      console.log(`${f.FACTURA.padEnd(15)} | ${f.FECHA.padEnd(10)} | ${f.EJERC} | ${base.toFixed(2).padStart(10)} | ${iva.toFixed(2).padStart(9)}`);
    });
    console.log('----------------|------------|-------|------------|----------');
    console.log(`TOTAL EJERCICIO 2024: ${fact2024.length} facturas, Base=${sumaBase2024.toFixed(2)}€`);

    // ═══════════════════════════════════════════════════════════════
    // 3. COMPARAR CONTEO: EJERCICIOFACTURA=2025 vs ANOFACTURA=2025
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('3. COMPARAR CONTEO DE FACTURAS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryConteoAno = `
      SELECT COUNT(DISTINCT NUMEROFACTURA) as N
      FROM DSEDAC.CAC
      WHERE ANOFACTURA = 2025
        AND NUMEROFACTURA > 0
        AND TRIM(SERIEFACTURA) = 'A'
        AND TRIM(CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

    const queryConteoEjerc = `
      SELECT COUNT(DISTINCT NUMEROFACTURA) as N
      FROM DSEDAC.CAC
      WHERE EJERCICIOFACTURA = 2025
        AND NUMEROFACTURA > 0
        AND TRIM(SERIEFACTURA) = 'A'
        AND TRIM(CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

    const conteoAno = (await pool.query(queryConteoAno))[0];
    const conteoEjerc = (await pool.query(queryConteoEjerc))[0];

    console.log(`Con ANOFACTURA=2025:        ${conteoAno.N} facturas`);
    console.log(`Con EJERCICIOFACTURA=2025:  ${conteoEjerc.N} facturas`);
    console.log(`Diferencia: ${conteoAno.N - conteoEjerc.N} facturas`);

    // ═══════════════════════════════════════════════════════════════
    // 4. TOTALES CON EJERCICIOFACTURA=2025
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('4. TOTALES USANDO EJERCICIOFACTURA=2025');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const queryTotalEjerc = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(B) as TOTAL_BASE,
        SUM(I) as TOTAL_IVA,
        COUNT(*) as NUM_FACTURAS
      FROM (
        SELECT
          C.SERIEFACTURA,
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as B,
          SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) as I
        FROM DSEDAC.CAC C
        WHERE C.EJERCICIOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
           AND SUM(C.IMPORTEIVA1 + C.IMPORTEIVA2 + C.IMPORTEIVA3 + C.IMPORTEIVA4 + C.IMPORTEIVA5) <> 0
           AND SUM(C.IMPORTETOTAL) <> 0
      ) T
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

    const totalesEjerc = await pool.query(queryTotalEjerc);
    let grandTotal = 0;
    console.log('Serie | Facturas | Base        | IVA');
    console.log('------|----------|-------------|----------');
    totalesEjerc.forEach(t => {
      const base = parseFloat(t.TOTAL_BASE) || 0;
      const iva = parseFloat(t.TOTAL_IVA) || 0;
      grandTotal += base;
      console.log(`${(t.SERIE || '').padEnd(5)} | ${String(t.NUM_FACTURAS).padEnd(8)} | ${base.toFixed(2).padStart(11)} | ${iva.toFixed(2).padStart(9)}`);
    });
    console.log('------|----------|-------------|----------');
    console.log(`TOTAL BASE CON EJERCICIO=2025: ${grandTotal.toFixed(2)}€`);
    console.log(`REFERENCIA: 29.256,80€`);
    console.log(`DIFERENCIA: ${(grandTotal - 29256.80).toFixed(2)}€`);

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

identificarFacturasExtra().catch(console.error);
