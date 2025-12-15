const odbcPool = require('./app/config/odbcConfig');

async function testProductosQuery() {
  try {
    console.log('=== PROBANDO QUERY DE PRODUCTOS ===\n');

    const codigoCliente = '4300009900';
    const limit = 10;

    // Query actualizada (la misma que está en databaseService.js)
    const query = `
      SELECT
        TRIM(LAC.CODIGOARTICULO) AS CODIGOARTICULO,
        TRIM(LAC.DESCRIPCION) AS DESCRIPCION,
        AVG(LAC.PRECIOVENTA) AS PRECIOPROMEDIO,
        SUM(ABS(LAC.CANTIDADUNIDADES)) AS CANTIDADTOTAL,
        SUM(ABS(LAC.IMPORTEVENTA)) AS IMPORTETOTAL,
        COUNT(DISTINCT LAC.NUMEROALBARAN) AS NUMEROPEDIDOS
      FROM DSEDAC.LAC
      WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
        AND LAC.EJERCICIOALBARAN >= YEAR(CURRENT_DATE) - 2
      GROUP BY TRIM(LAC.CODIGOARTICULO), TRIM(LAC.DESCRIPCION)
      ORDER BY IMPORTETOTAL DESC
      FETCH FIRST ${limit} ROWS ONLY
    `;

    console.log('Ejecutando query...');
    const result = await odbcPool.query(query, [codigoCliente]);

    console.log(`\n✅ Productos obtenidos: ${result.length}\n`);

    if (result.length > 0) {
      console.log('Top 10 productos:');
      result.forEach((prod, i) => {
        console.log(`\n${i + 1}. ${prod.DESCRIPCION}`);
        console.log(`   Código: ${prod.CODIGOARTICULO}`);
        console.log(`   Cantidad total: ${prod.CANTIDADTOTAL}`);
        console.log(`   Importe total: ${prod.IMPORTETOTAL}€`);
        console.log(`   Número de pedidos: ${prod.NUMEROPEDIDOS}`);
        console.log(`   Precio promedio: ${prod.PRECIOPROMEDIO}€`);
      });

      console.log('\n=== FORMATO PARA FRONTEND (camelCase) ===\n');
      const productosFormatted = result.slice(0, 3).map(p => ({
        codigo: p.CODIGOARTICULO || '',
        nombre: p.DESCRIPCION || '',
        cantidad: p.CANTIDADTOTAL || 0,
        importe: p.IMPORTETOTAL || 0,
        pedidos: p.NUMEROPEDIDOS || 0
      }));

      console.log(JSON.stringify(productosFormatted, null, 2));
    } else {
      console.log('❌ No se encontraron productos');

      // Verificar si hay datos sin el filtro de año
      const querySinFiltro = `
        SELECT COUNT(*) AS TOTAL
        FROM DSEDAC.LAC
        WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
      `;

      const totalSinFiltro = await odbcPool.query(querySinFiltro, [codigoCliente]);
      console.log(`\nTotal de líneas sin filtro de año: ${totalSinFiltro[0].TOTAL}`);

      // Verificar años disponibles
      const queryAnos = `
        SELECT DISTINCT EJERCICIOALBARAN, COUNT(*) AS LINEAS
        FROM DSEDAC.LAC
        WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
        GROUP BY EJERCICIOALBARAN
        ORDER BY EJERCICIOALBARAN DESC
      `;

      const anos = await odbcPool.query(queryAnos, [codigoCliente]);
      console.log('\nAños disponibles:');
      anos.forEach(a => console.log(`   ${a.EJERCICIOALBARAN}: ${a.LINEAS} líneas`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error('   ', e.message));
    }
    process.exit(1);
  }
}

testProductosQuery();
