/**
 * DIAGNÓSTICO - Línea con importe 0€ (Napolitana Chocolate)
 * ============================================================
 * Factura S-417, Cliente 4300032679
 * Verificar: ¿Es SC? ¿Qué tarifa se aplica? ¿Por qué importe = 0?
 */

const db = require('../app/config/odbcConfig');

async function diagnosticZeroImport() {
  console.log('=== DIAGNÓSTICO: Factura S-417 ===\n');

  await db.initialize();

  // 1. Verificar tipo de venta de esta línea específica
  const sqlTipo = `
    SELECT
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      LAC.PRECIOVENTA,
      LAC.PORCENTAJEDESCUENTO AS DESCUENTO,
      LAC.IMPORTEVENTA,
      LAC.CANTIDADENVASES AS CAJAS,
      LAC.CANTIDADUNIDADES AS UNIDADES,
      CAC.MESFACTURA,
      CAC.MESDOCUMENTO,
      CAC.DIADOCUMENTO,
      TRIM(LAC.CODIGOARTICULO) AS ARTICULO,
      TRIM(LAC.DESCRIPCION) AS DESCRIPCION
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    WHERE TRIM(CAC.SERIEFACTURA) = 'S'
      AND CAC.NUMEROFACTURA = 417
      AND CAC.EJERCICIOFACTURA = 2026
      AND TRIM(LAC.CODIGOARTICULO) = '7358'
  `;

  const rows = await db.query(sqlTipo);
  console.log('--- Datos de la línea en BD ---');
  rows.forEach(r => {
    console.log(`  TIPO_VENTA: "${r.TIPO_VENTA}"`);
    console.log(`  PRECIOVENTA: ${r.PRECIOVENTA}`);
    console.log(`  DESCUENTO: ${r.DESCUENTO}%`);
    console.log(`  IMPORTEVENTA: ${r.IMPORTEVENTA}`);
    console.log(`  CAJAS: ${r.CAJAS}`);
    console.log(`  UNIDADES: ${r.UNIDADES}`);
    console.log(`  MESFACTURA: ${r.MESFACTURA}`);
    console.log(`  MESDOCUMENTO: ${r.MESDOCUMENTO}`);
    console.log(`  DIA_DOCUMENTO: ${r.DIADOCUMENTO}`);
    console.log(`  ARTICULO: ${r.ARTICULO}`);
    console.log(`  DESCRIPCION: ${r.DESCRIPCION}`);
    console.log('');

    // Calcular tarifa esperada
    const tarifaEsperada = r.MESDOCUMENTO === 1 ? 84 : 85;
    console.log(`  >>> Tarifa esperada (por MESDOCUMENTO=${r.MESDOCUMENTO}): ${tarifaEsperada}`);

    // Calcular importe esperado
    const cantidad = r.CAJAS > 0 ? r.CAJAS : r.UNIDADES;
    const precioVenta = Number(r.PRECIOVENTA) || 0;
    const dto = Number(r.DESCUENTO) || 0;
    const importeEsperado = precioVenta * cantidad * (1 - dto / 100);
    console.log(`  >>> Importe esperado (precioVenta * cantidad * (1-dto)): ${importeEsperado.toFixed(2)}€`);

    // ¿Es SC?
    const esSC = String(r.TIPO_VENTA || '').trim().toUpperCase() === 'SC';
    console.log(`  >>> ¿Es SC? ${esSC}`);
    console.log(`  >>> ¿Debería ser 0€? ${esSC ? 'SÍ (SC = sin cargo)' : 'NO, debería tener importe'}`);
  });

  // 2. Verificar tarifa en ARA para este artículo
  const sqlTarifa = `
    SELECT
      TRIM(ARA.CODIGOARTICULO) AS ARTICULO,
      ARA.CODIGOTARIFA AS TARIFA,
      ARA.PRECIOTARIFA AS PRECIO
    FROM DSEDAC.ARA ARA
    WHERE TRIM(ARA.CODIGOARTICULO) = '7358'
      AND ARA.CODIGOTARIFA IN (84, 85)
    ORDER BY ARA.CODIGOTARIFA
  `;

  const tarifas = await db.query(sqlTarifa);
  console.log('\n--- Tarifas ARA para artículo 7358 ---');
  tarifas.forEach(t => {
    console.log(`  Tarifa ${t.TARIFA}: ${t.PRECIO}`);
  });

  // 3. Simular el JOIN que hace el CTE
  const row = rows[0];
  if (row) {
    const mesDoc = row.MESDOCUMENTO;
    const tarifaCodigo = mesDoc === 1 ? 84 : 85;
    const tarifaEnARA = tarifas.find(t => Number(t.TARIFA) === tarifaCodigo);

    console.log('\n--- Simulación del JOIN del CTE ---');
    console.log(`  MESDOCUMENTO = ${mesDoc}`);
    console.log(`  Tarifa seleccionada por CTE: ${tarifaCodigo}`);
    console.log(`  ¿Existe en ARA? ${tarifaEnARA ? `SÍ, precio=${tarifaEnARA.PRECIO}` : 'NO'}`);

    if (tarifaEnARA) {
      const cantidad = row.CAJAS > 0 ? row.CAJAS : row.UNIDADES;
      const precioTarifa = Number(tarifaEnARA.PRECIO) || 0;
      const dto = Number(row.DESCUENTO) || 0;
      const importeConTarifa = precioTarifa * cantidad * (1 - dto / 100);
      console.log(`  >>> Importe con tarifa ${tarifaCodigo}: ${precioTarifa} × ${cantidad} × (1 - ${dto}/100) = ${importeConTarifa.toFixed(2)}€`);
    }
  }

  // 4. Verificar qué pasa con la columna TIPOVENTA en la tabla LAC
  const sqlAllTipos = `
    SELECT TRIM(TIPOVENTA) AS TIPO, COUNT(*) AS CANTIDAD
    FROM DSEDAC.LAC
    WHERE EJERCICIOALBARAN = 2026
    GROUP BY TRIM(TIPOVENTA)
    ORDER BY TRIM(TIPOVENTA)
  `;

  const tipos = await db.query(sqlAllTipos);
  console.log('\n--- Tipos de venta en LAC (2026) ---');
  tipos.forEach(t => {
    console.log(`  "${t.TIPO}": ${t.CANTIDAD} líneas`);
  });

  process.exit(0);
}

diagnosticZeroImport().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
