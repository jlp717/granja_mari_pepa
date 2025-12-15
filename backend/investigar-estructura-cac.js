const odbcPool = require('./app/config/odbcConfig');

async function investigarCAC() {
  try {
    console.log('=== INVESTIGANDO ESTRUCTURA DE CAC ===\n');

    // 1. Ver columnas disponibles
    console.log('1. Columnas de la tabla CAC:');
    const columnas = await odbcPool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CAC'
      ORDER BY ORDINAL_POSITION
    `);

    columnas.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : col.NUMERIC_PRECISION ? `(${col.NUMERIC_PRECISION})` : ''})`);
    });

    // 2. Ver una factura de ejemplo con TODOS los campos
    console.log('\n2. Ejemplo de factura con TODOS los campos:');
    const ejemplo = await odbcPool.query(`
      SELECT * FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      FETCH FIRST 1 ROWS ONLY
    `);

    if (ejemplo.length > 0) {
      const factura = ejemplo[0];
      Object.keys(factura).forEach(key => {
        console.log(`   ${key}: ${factura[key]}`);
      });
    }

    // 3. Ver columnas que contienen "IMPORTE" o "TOTAL"
    console.log('\n3. Campos con IMPORTE o TOTAL en el nombre:');
    const camposImporte = columnas.filter(col =>
      col.COLUMN_NAME.includes('IMPORTE') ||
      col.COLUMN_NAME.includes('TOTAL') ||
      col.COLUMN_NAME.includes('BASE') ||
      col.COLUMN_NAME.includes('IVA')
    );

    camposImporte.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
    });

    // 4. Probar query con diferentes campos de importe
    console.log('\n4. Probando diferentes campos de importe:');
    const testImporte = await odbcPool.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        ${camposImporte.map(c => c.COLUMN_NAME).join(',\n        ')}
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      FETCH FIRST 3 ROWS ONLY
    `);

    testImporte.forEach((f, i) => {
      console.log(`\n   Factura ${i + 1}: ${f.SERIEFACTURA}-${f.NUMEROFACTURA}/${f.EJERCICIOFACTURA}`);
      camposImporte.forEach(campo => {
        const valor = f[campo.COLUMN_NAME];
        if (valor && valor !== 0) {
          console.log(`      ${campo.COLUMN_NAME}: ${valor}`);
        }
      });
    });

    // 5. Sumar con el campo correcto
    console.log('\n5. Totales del cliente por campo:');
    for (const campo of camposImporte) {
      const suma = await odbcPool.query(`
        SELECT SUM(${campo.COLUMN_NAME}) as TOTAL
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300009900'
      `);
      if (suma[0].TOTAL && suma[0].TOTAL !== 0) {
        console.log(`   ${campo.COLUMN_NAME}: ${suma[0].TOTAL}`);
      }
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

investigarCAC();
