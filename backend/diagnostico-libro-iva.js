const odbcPool = require('./app/config/odbcConfig');

async function diagnosticar() {
  try {
    const codigoCliente = '4300009900';

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 DIAGNÓSTICO DE LIBRO IVA');
    console.log('═══════════════════════════════════════════════════════\n');

    // Query que debería usar el controlador (CON FILTRO DE AÑO)
    const query2025 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = ?
        AND C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
      GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA
    `;

    const facturas2025 = await odbcPool.query(query2025, [codigoCliente]);
    const total2025 = facturas2025.reduce((sum, f) => sum + parseFloat(f.TOTAL || 0), 0);

    console.log(`FACTURAS 2025 (CORRECTAS):`);
    console.log(`  Número de facturas: ${facturas2025.length}`);
    console.log(`  Total: ${total2025.toFixed(2)} € ✅ (debería ser 1946.73)\n`);

    // Query SIN filtro de año (lo que podría estar pasando)
    const queryTodas = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIEFACTURA,
        C.NUMEROFACTURA,
        C.ANOFACTURA,
        SUM(C.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC C
      WHERE TRIM(C.CODIGOCLIENTEFACTURA) = ?
        AND C.NUMEROFACTURA > 0
      GROUP BY TRIM(C.SERIEFACTURA), C.NUMEROFACTURA, C.ANOFACTURA
    `;

    const todasFacturas = await odbcPool.query(queryTodas, [codigoCliente]);
    const totalTodas = todasFacturas.reduce((sum, f) => sum + parseFloat(f.TOTAL || 0), 0);

    console.log(`TODAS LAS FACTURAS (SIN FILTRO DE AÑO):`);
    console.log(`  Número de facturas: ${todasFacturas.length}`);
    console.log(`  Total: ${totalTodas.toFixed(2)} €\n`);

    // Agrupar por año
    const porAno = {};
    todasFacturas.forEach(f => {
      const ano = f.ANOFACTURA;
      if (!porAno[ano]) {
        porAno[ano] = { count: 0, total: 0 };
      }
      porAno[ano].count++;
      porAno[ano].total += parseFloat(f.TOTAL || 0);
    });

    console.log('FACTURAS POR AÑO:');
    Object.keys(porAno).sort().forEach(ano => {
      console.log(`  ${ano}: ${porAno[ano].count} facturas = ${porAno[ano].total.toFixed(2)} €`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('CONCLUSIÓN:');
    if (Math.abs(totalTodas - 5265.89) < 1) {
      console.log('❌ El libro IVA está sumando TODAS las facturas');
      console.log('   sin filtrar por año 2025');
    } else if (Math.abs(total2025 - 1946.73) < 1) {
      console.log('✅ La query del año 2025 es correcta');
    }
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnosticar();
