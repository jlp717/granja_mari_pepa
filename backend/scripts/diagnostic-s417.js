/**
 * DIAGNÓSTICO SERVIDOR - Factura S-417 (importe 0€)
 * ===================================================
 * node scripts/diagnostic-s417.js
 */

const db = require('../app/config/odbcConfig');

async function main() {
  console.log('=== DIAGNÓSTICO: Factura S-417, Cliente 4300032679 ===\n');
  await db.initialize();

  // 1. Datos de la línea en BD
  console.log('--- 1. Datos de la línea en BD ---');
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
      CAC.ANODOCUMENTO,
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
  if (rows.length === 0) {
    console.log('  NO SE ENCONTRÓ la línea. Verificar serie/número/ejercicio.');
  } else {
    const r = rows[0];
    console.log('  TIPO_VENTA: "' + r.TIPO_VENTA + '"');
    console.log('  PRECIOVENTA: ' + r.PRECIOVENTA);
    console.log('  DESCUENTO: ' + r.DESCUENTO + '%');
    console.log('  IMPORTEVENTA: ' + r.IMPORTEVENTA);
    console.log('  CAJAS: ' + r.CAJAS);
    console.log('  UNIDADES: ' + r.UNIDADES);
    console.log('  MESFACTURA: ' + r.MESFACTURA);
    console.log('  MESDOCUMENTO: ' + r.MESDOCUMENTO);
    console.log('  DIA_DOCUMENTO: ' + r.DIADOCUMENTO + '/' + r.MESDOCUMENTO + '/' + r.ANODOCUMENTO);
    console.log('  ARTICULO: ' + r.ARTICULO);

    const esSC = String(r.TIPO_VENTA || '').trim().toUpperCase() === 'SC';
    console.log('  ¿Es SC? ' + esSC);
    if (esSC) {
      console.log('  Si es SC -> importe = 0 EUR (CORRECTO, sin cargo para el cliente)');
    } else {
      console.log('  NO es SC pero importe = 0 EUR. Hay un BUG en la logica.');
    }

    const tarifaEsperada = r.MESDOCUMENTO === 1 ? 84 : 85;
    console.log('  Tarifa esperada (MESDOCUMENTO=' + r.MESDOCUMENTO + '): ' + tarifaEsperada);
  }

  // 2. Tarifas ARA para el artículo
  console.log('\n--- 2. Tarifas ARA para artículo 7358 ---');
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
  if (tarifas.length === 0) {
    console.log('  NO hay tarifas 84/85 para este articulo');
  } else {
    tarifas.forEach(t => console.log('  Tarifa ' + t.TARIFA + ': ' + t.PRECIO + ' EUR'));
  }

  // 3. Simular resultado del CTE con MESDOCUMENTO
  console.log('\n--- 3. Simulación CTE (MESDOCUMENTO para tarifa) ---');
  const sqlCTE = `
    WITH TARIFAS_PANAMAR AS (
      SELECT
        TRIM(ARA.CODIGOARTICULO) AS CODIGO_ARTICULO,
        ARA.CODIGOTARIFA,
        MAX(ARA.PRECIOTARIFA) AS PRECIOTARIFA
      FROM DSEDAC.ARA ARA
      WHERE ARA.CODIGOTARIFA IN (84, 85)
      GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
    ),
    RESULTADO AS (
      SELECT
        TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
        LAC.PRECIOVENTA,
        LAC.PORCENTAJEDESCUENTO AS DESCUENTO,
        LAC.IMPORTEVENTA,
        LAC.CANTIDADENVASES AS CAJAS,
        LAC.CANTIDADUNIDADES AS UNIDADES,
        CAC.MESDOCUMENTO,
        COALESCE(TP.PRECIOTARIFA, 0) AS PRECIO_TARIFA_PANAMAR,
        CASE WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END AS TARIFA_SELECCIONADA
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      LEFT JOIN TARIFAS_PANAMAR TP
        ON TRIM(LAC.CODIGOARTICULO) = TP.CODIGO_ARTICULO
        AND TP.CODIGOTARIFA = (CASE WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END)
      WHERE TRIM(CAC.SERIEFACTURA) = 'S'
        AND CAC.NUMEROFACTURA = 417
        AND CAC.EJERCICIOFACTURA = 2026
        AND TRIM(LAC.CODIGOARTICULO) = '7358'
    )
    SELECT * FROM RESULTADO
  `;
  const cteResult = await db.query(sqlCTE);
  if (cteResult.length > 0) {
    const c = cteResult[0];
    console.log('  MESDOCUMENTO: ' + c.MESDOCUMENTO);
    console.log('  TARIFA_SELECCIONADA: ' + c.TARIFA_SELECCIONADA);
    console.log('  PRECIO_TARIFA_PANAMAR: ' + c.PRECIO_TARIFA_PANAMAR);
    console.log('  PRECIOVENTA (original): ' + c.PRECIOVENTA);

    const cantidad = c.CAJAS > 0 ? c.CAJAS : c.UNIDADES;
    const precioUsado = c.PRECIO_TARIFA_PANAMAR > 0 ? c.PRECIO_TARIFA_PANAMAR : c.PRECIOVENTA;
    const dto = c.DESCUENTO || 0;
    const importeCalc = precioUsado * cantidad * (1 - dto / 100);

    console.log('  Precio que se usaría: ' + precioUsado + ' EUR');
    console.log('  Cantidad: ' + cantidad);
    console.log('  Descuento: ' + dto + '%');
    console.log('  Importe calculado: ' + importeCalc.toFixed(2) + ' EUR');

    const esSC = String(c.TIPO_VENTA || '').trim().toUpperCase() === 'SC';
    if (esSC) {
      console.log('  Como TIPO_VENTA = SC -> IMPORTE FINAL = 0 EUR (sin cargo)');
    }
  } else {
    console.log('  El CTE no devolvió resultados');
  }

  // 4. Tipos de venta en LAC
  console.log('\n--- 4. Tipos de venta en LAC (2026) ---');
  const sqlTipos = `
    SELECT TRIM(TIPOVENTA) AS TIPO, COUNT(*) AS CANTIDAD
    FROM DSEDAC.LAC
    WHERE EJERCICIOALBARAN = 2026
    GROUP BY TRIM(TIPOVENTA)
    ORDER BY TRIM(TIPOVENTA)
  `;
  const tipos = await db.query(sqlTipos);
  tipos.forEach(t => console.log('  "' + t.TIPO + '": ' + t.CANTIDAD + ' lineas'));

  console.log('\n=== FIN DIAGNÓSTICO ===');
  await db.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
