const odbcPool = require('./app/config/odbcConfig');

async function verificarDatos() {
  try {
    console.log('=== VERIFICANDO DATOS CLIENTE 9900 ===\n');

    // Query del dashboard (la que muestra 1946,73)
    const queryDashboard = `
      SELECT
        COUNT(*) AS NUM_FACTURAS,
        SUM(IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
            IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) AS BASE_TOTAL,
        SUM(IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) AS IVA_TOTAL,
        SUM(IMPORTETOTAL) AS TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
        AND EJERCICIOFACTURA = 2025
    `;

    const resultDashboard = await odbcPool.query(queryDashboard);
    console.log('DATOS DEL DASHBOARD (2025):');
    console.log(resultDashboard[0]);
    console.log('');

    // Query del libro IVA (sin GROUP BY para ver si hay duplicados)
    const queryLibroIVA = `
      SELECT
        TRIM(SERIEFACTURA) as SERIE,
        NUMEROFACTURA,
        ANOFACTURA,
        MESFACTURA,
        DIAFACTURA,
        IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
        IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5 as BASE_IMPONIBLE,
        IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5 as IVA,
        IMPORTETOTAL as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
        AND ANOFACTURA = 2025
        AND NUMEROFACTURA > 0
      ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC
    `;

    const resultLibroIVA = await odbcPool.query(queryLibroIVA);
    console.log(`DATOS DEL LIBRO IVA (registros individuales): ${resultLibroIVA.length} registros`);

    let totalBaseLibro = 0;
    let totalIVALibro = 0;
    let totalLibro = 0;

    const facturas = {};
    resultLibroIVA.forEach(r => {
      const key = `${r.SERIE}-${r.NUMEROFACTURA}`;
      if (!facturas[key]) {
        facturas[key] = [];
      }
      facturas[key].push(r);

      totalBaseLibro += parseFloat(r.BASE_IMPONIBLE) || 0;
      totalIVALibro += parseFloat(r.IVA) || 0;
      totalLibro += parseFloat(r.TOTAL) || 0;
    });

    console.log('');
    console.log('TOTALES SIN AGRUPAR:');
    console.log(`Base: ${totalBaseLibro.toFixed(2)} €`);
    console.log(`IVA: ${totalIVALibro.toFixed(2)} €`);
    console.log(`Total: ${totalLibro.toFixed(2)} €`);
    console.log('');

    console.log('FACTURAS DUPLICADAS (aparecen más de una vez):');
    let hayDuplicados = false;
    Object.keys(facturas).forEach(key => {
      if (facturas[key].length > 1) {
        hayDuplicados = true;
        console.log(`  ${key}: aparece ${facturas[key].length} veces`);
        facturas[key].forEach((f, i) => {
          console.log(`    [${i+1}] Base: ${parseFloat(f.BASE_IMPONIBLE).toFixed(2)}, Total: ${parseFloat(f.TOTAL).toFixed(2)}`);
        });
      }
    });

    if (!hayDuplicados) {
      console.log('  No hay facturas duplicadas');
    }

    // Query con GROUP BY (como debería ser)
    const queryAgrupado = `
      SELECT
        TRIM(SERIEFACTURA) as SERIE,
        NUMEROFACTURA,
        SUM(IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
            IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) as BASE_IMPONIBLE,
        SUM(IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) as IVA,
        SUM(IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
        AND ANOFACTURA = 2025
        AND NUMEROFACTURA > 0
      GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA
      ORDER BY SERIE, NUMEROFACTURA
    `;

    const resultAgrupado = await odbcPool.query(queryAgrupado);
    console.log('');
    console.log(`DATOS AGRUPADOS: ${resultAgrupado.length} facturas únicas`);

    let totalBaseAgrupado = 0;
    let totalIVAAgrupado = 0;
    let totalAgrupado = 0;

    resultAgrupado.forEach(r => {
      totalBaseAgrupado += parseFloat(r.BASE_IMPONIBLE) || 0;
      totalIVAAgrupado += parseFloat(r.IVA) || 0;
      totalAgrupado += parseFloat(r.TOTAL) || 0;
    });

    console.log('');
    console.log('TOTALES AGRUPADOS:');
    console.log(`Base: ${totalBaseAgrupado.toFixed(2)} €`);
    console.log(`IVA: ${totalIVAAgrupado.toFixed(2)} €`);
    console.log(`Total: ${totalAgrupado.toFixed(2)} €`);

    // Verificar la factura F-14074 específicamente
    console.log('\n=== DETALLE DE FACTURA F-14074 ===');
    const queryF14074 = `
      SELECT
        TRIM(SERIEFACTURA) as SERIE,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        IMPORTEBASEIMPONIBLE1, IMPORTEBASEIMPONIBLE2, IMPORTEBASEIMPONIBLE3,
        IMPORTEBASEIMPONIBLE4, IMPORTEBASEIMPONIBLE5,
        IMPORTEIVA1, IMPORTEIVA2, IMPORTEIVA3, IMPORTEIVA4, IMPORTEIVA5,
        IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
        AND TRIM(SERIEFACTURA) = 'F'
        AND NUMEROFACTURA = 14074
    `;

    const resultF14074 = await odbcPool.query(queryF14074);
    console.log(`Registros encontrados: ${resultF14074.length}`);
    resultF14074.forEach((r, i) => {
      console.log(`\nRegistro ${i+1}:`);
      console.log(`  Base1: ${r.IMPORTEBASEIMPONIBLE1}, Base2: ${r.IMPORTEBASEIMPONIBLE2}, Base3: ${r.IMPORTEBASEIMPONIBLE3}`);
      console.log(`  Base4: ${r.IMPORTEBASEIMPONIBLE4}, Base5: ${r.IMPORTEBASEIMPONIBLE5}`);
      console.log(`  IVA1: ${r.IMPORTEIVA1}, IVA2: ${r.IMPORTEIVA2}, IVA3: ${r.IMPORTEIVA3}`);
      console.log(`  IVA4: ${r.IMPORTEIVA4}, IVA5: ${r.IMPORTEIVA5}`);
      console.log(`  Total: ${r.IMPORTETOTAL}`);

      const baseTotal = (r.IMPORTEBASEIMPONIBLE1 || 0) + (r.IMPORTEBASEIMPONIBLE2 || 0) +
                        (r.IMPORTEBASEIMPONIBLE3 || 0) + (r.IMPORTEBASEIMPONIBLE4 || 0) +
                        (r.IMPORTEBASEIMPONIBLE5 || 0);
      const ivaTotal = (r.IMPORTEIVA1 || 0) + (r.IMPORTEIVA2 || 0) + (r.IMPORTEIVA3 || 0) +
                       (r.IMPORTEIVA4 || 0) + (r.IMPORTEIVA5 || 0);

      console.log(`  Base Total Calculada: ${baseTotal.toFixed(2)}`);
      console.log(`  IVA Total Calculado: ${ivaTotal.toFixed(2)}`);
      console.log(`  Total con IVA: ${(baseTotal + ivaTotal).toFixed(2)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verificarDatos();
