const odbcPool = require('./app/config/odbcConfig');

async function investigarLAC() {
  try {
    console.log('=== INVESTIGANDO ESTRUCTURA DE LAC (Líneas de facturas) ===\n');

    // 1. Ver columnas disponibles
    console.log('1. Columnas de la tabla LAC:');
    const columnas = await odbcPool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'LAC'
      ORDER BY ORDINAL_POSITION
    `);

    columnas.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : col.NUMERIC_PRECISION ? `(${col.NUMERIC_PRECISION})` : ''})`);
    });

    // 2. Ver algunas líneas de factura de ejemplo
    console.log('\n2. Ejemplo de líneas de factura del cliente 4300009900:');
    const ejemplo = await odbcPool.query(`
      SELECT * FROM DSEDAC.LAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      FETCH FIRST 3 ROWS ONLY
    `);

    if (ejemplo.length > 0) {
      console.log(`\n   Encontradas ${ejemplo.length} líneas de ejemplo:`);
      ejemplo.forEach((linea, i) => {
        console.log(`\n   === Línea ${i + 1} ===`);
        Object.keys(linea).forEach(key => {
          if (linea[key] !== null && linea[key] !== '') {
            console.log(`   ${key}: ${linea[key]}`);
          }
        });
      });
    } else {
      console.log('   ❌ No se encontraron líneas para este cliente');
    }

    // 3. Contar total de líneas para este cliente
    console.log('\n3. Total de líneas de factura para cliente 4300009900:');
    const conteo = await odbcPool.query(`
      SELECT COUNT(*) AS TOTAL FROM DSEDAC.LAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
    `);
    console.log(`   Total: ${conteo[0].TOTAL} líneas`);

    // 4. Ver columnas relacionadas con productos y cantidades
    console.log('\n4. Campos con ARTICULO, PRODUCTO, CANTIDAD o PRECIO:');
    const camposProducto = columnas.filter(col =>
      col.COLUMN_NAME.includes('ARTICULO') ||
      col.COLUMN_NAME.includes('PRODUCTO') ||
      col.COLUMN_NAME.includes('CANTIDAD') ||
      col.COLUMN_NAME.includes('PRECIO') ||
      col.COLUMN_NAME.includes('DESCRIPCION')
    );

    camposProducto.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
    });

    // 5. Probar query agrupando por producto
    console.log('\n5. Top productos del cliente (usando campos disponibles):');

    // Intentar con los campos que hemos visto
    const camposDisponibles = columnas.map(c => c.COLUMN_NAME);

    let queryProductos = `
      SELECT
        ${camposDisponibles.includes('CODIGOARTICULO') ? 'CODIGOARTICULO' : camposDisponibles.find(c => c.includes('ARTICULO'))},
        ${camposDisponibles.includes('DESCRIPCION') ? 'DESCRIPCION' : camposDisponibles.find(c => c.includes('DESCRIPCION'))},
        COUNT(*) AS LINEAS
      FROM DSEDAC.LAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      GROUP BY ${camposDisponibles.includes('CODIGOARTICULO') ? 'CODIGOARTICULO' : camposDisponibles.find(c => c.includes('ARTICULO'))},
               ${camposDisponibles.includes('DESCRIPCION') ? 'DESCRIPCION' : camposDisponibles.find(c => c.includes('DESCRIPCION'))}
      ORDER BY LINEAS DESC
      FETCH FIRST 10 ROWS ONLY
    `;

    try {
      const topProductos = await odbcPool.query(queryProductos);
      topProductos.forEach((prod, i) => {
        console.log(`\n   ${i + 1}. ${Object.values(prod).join(' - ')}`);
      });
    } catch (error) {
      console.log('   ❌ Error en query de productos:', error.message);
      console.log('\n   Intentando query más simple...');

      // Query aún más simple
      const simple = await odbcPool.query(`
        SELECT * FROM DSEDAC.LAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
        FETCH FIRST 1 ROWS ONLY
      `);

      if (simple.length > 0) {
        console.log('\n   Campos disponibles en la primera línea:');
        Object.keys(simple[0]).forEach(key => {
          console.log(`      ${key}: ${simple[0][key]}`);
        });
      }
    }

    // 6. Verificar años disponibles
    console.log('\n6. Años con datos para este cliente:');
    const anos = await odbcPool.query(`
      SELECT DISTINCT EJERCICIOFACTURA, COUNT(*) AS LINEAS
      FROM DSEDAC.LAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      GROUP BY EJERCICIOFACTURA
      ORDER BY EJERCICIOFACTURA DESC
    `);

    anos.forEach(ano => {
      console.log(`   ${ano.EJERCICIOFACTURA}: ${ano.LINEAS} líneas`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error('   ', e.message));
    }
    process.exit(1);
  }
}

investigarLAC();
