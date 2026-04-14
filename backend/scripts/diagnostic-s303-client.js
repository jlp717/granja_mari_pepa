/**
 * DIAGNÓSTICO - Albarán S-303 y Cliente 4300032679 (BAR EL TONEL)
 * ==================================================================
 * Verificar si el albarán S-303 está asociado al cliente 4300032679
 * y verificar la factura S-1166.
 * 
 * node scripts/diagnostic-s303-client.js
 */

const db = require('../app/config/odbcConfig');

async function main() {
  console.log('=== DIAGNÓSTICO: Albarán S-303, Cliente 4300032679 ===\n');
  await db.initialize();

  // 1. Verificar si el albarán S-303 existe en CAC y a qué cliente está asignado
  console.log('--- 1. Albarán S-303 en CAC (cabecera) ---');
  const sqlAlbaran = `
    SELECT
      TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
      CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
      CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
      TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
      CAC.NUMEROFACTURA AS NUMERO_FACTURA,
      CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_CLIENTE_ALBARAN,
      CAC.DIAFACTURA AS DIA_FACTURA,
      CAC.MESFACTURA AS MES_FACTURA,
      CAC.ANOFACTURA AS ANO_FACTURA,
      CAC.IMPORTEBASEIMPONIBLE1 AS BASE_1,
      CAC.IMPORTEBASEIMPONIBLE2 AS BASE_2,
      CAC.IMPORTEBASEIMPONIBLE3 AS BASE_3,
      CAC.IMPORTEBASEIMPONIBLE4 AS BASE_4,
      CAC.IMPORTEBASEIMPONIBLE5 AS BASE_5,
      CAC.IMPORTEIVA1 AS IVA_1,
      CAC.IMPORTEIVA2 AS IVA_2,
      CAC.IMPORTEIVA3 AS IVA_3,
      CAC.IMPORTEIVA4 AS IVA_4,
      CAC.IMPORTEIVA5 AS IVA_5,
      CAC.IMPORTECOBRADOPENDIENTE AS IMPORTE_PENDIENTE
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SERIEALBARAN) = 'S'
      AND CAC.NUMEROALBARAN = 303
      AND CAC.EJERCICIOALBARAN = 2026
  `;

  const albaranes = await db.query(sqlAlbaran);
  if (albaranes.length === 0) {
    console.log('  NO SE ENCONTRÓ el albarán S-303 en CAC para ejercicio 2026.');
    console.log('  Buscando en otros ejercicios...');
    
    const sqlOtrosEjercicios = `
      SELECT
        TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
        CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
        CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
        TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
        CAC.NUMEROFACTURA AS NUMERO_FACTURA,
        CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
        TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
        TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_CLIENTE_ALBARAN
      FROM DSEDAC.CAC CAC
      WHERE TRIM(CAC.SERIEALBARAN) = 'S'
        AND CAC.NUMEROALBARAN = 303
      ORDER BY CAC.EJERCICIOALBARAN DESC
    `;
    const otros = await db.query(sqlOtrosEjercicios);
    if (otros.length === 0) {
      console.log('  NO EXISTE ningún albarán S-303 en la base de datos.');
    } else {
      console.log('  Albaranes S-303 encontrados en otros ejercicios:');
      otros.forEach(a => {
        console.log(`  Ejercicio: ${a.EJERCICIO_ALBARAN}, Factura: ${a.SERIE_FACTURA}-${a.NUMERO_FACTURA}, ` +
          `Cliente Factura: ${a.CODIGO_CLIENTE_FACTURA}, Cliente Albarán: ${a.CODIGO_CLIENTE_ALBARAN}`);
      });
    }
  } else {
    console.log(`  Se encontraron ${albaranes} registro(s) para el albarán S-303:`);
    albaranes.forEach(a => {
      console.log(`  Ejercicio Albarán: ${a.EJERCICIO_ALBARAN}`);
      console.log(`  Factura: ${a.SERIE_FACTURA}-${a.NUMERO_FACTURA} (${a.EJERCICIO_FACTURA})`);
      console.log(`  Cliente Factura: ${a.CODIGO_CLIENTE_FACTURA}`);
      console.log(`  Cliente Albarán: ${a.CODIGO_CLIENTE_ALBARAN}`);
      console.log(`  Fecha: ${a.DIA_FACTURA}/${a.MES_FACTURA}/${a.ANO_FACTURA}`);
      console.log(`  Importe Pendiente: ${a.IMPORTE_PENDIENTE}`);
      console.log('');
    });
  }

  // 2. Verificar si el albarán S-303 está asociado al cliente 4300032679
  console.log('\n--- 2. ¿Está S-303 asociado al cliente 4300032679? ---');
  const sqlCliente = `
    SELECT
      TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
      CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
      CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
      TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
      CAC.NUMEROFACTURA AS NUMERO_FACTURA,
      CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_CLIENTE_ALBARAN
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SERIEALBARAN) = 'S'
      AND CAC.NUMEROALBARAN = 303
      AND CAC.EJERCICIOALBARAN = 2026
      AND (TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300032679' 
           OR TRIM(CAC.CODIGOCLIENTEALBARAN) = '4300032679')
  `;

  const clienteAlbaran = await db.query(sqlCliente);
  if (clienteAlbaran.length === 0) {
    console.log('  NO: El albarán S-303 NO está asociado al cliente 4300032679.');
    console.log('  (Esto confirmaría que la factura S-1166 no debería aparecer para este cliente)');
  } else {
    console.log('  SÍ: El albarán S-303 SÍ está asociado al cliente 4300032679.');
    clienteAlbaran.forEach(a => {
      console.log(`  Factura: ${a.SERIE_FACTURA}-${a.NUMERO_FACTURA} (${a.EJERCICIO_FACTURA})`);
      console.log(`  Cliente Factura: ${a.CODIGO_CLIENTE_FACTURA}`);
      console.log(`  Cliente Albarán: ${a.CODIGO_CLIENTE_ALBARAN}`);
    });
  }

  // 3. Verificar la factura S-1166 para el cliente 4300032679
  console.log('\n--- 3. Factura S-1166 para cliente 4300032679 ---');
  const sqlFactura = `
    SELECT
      TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
      CAC.NUMEROFACTURA AS NUMERO_FACTURA,
      CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
      TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
      CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
      CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_CLIENTE_ALBARAN,
      CAC.DIAFACTURA AS DIA_FACTURA,
      CAC.MESFACTURA AS MES_FACTURA,
      CAC.ANOFACTURA AS ANO_FACTURA,
      CAC.IMPORTECOBRADOPENDIENTE AS IMPORTE_PENDIENTE
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SERIEFACTURA) = 'S'
      AND CAC.NUMEROFACTURA = 1166
      AND CAC.EJERCICIOFACTURA = 2026
      AND (TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300032679' 
           OR TRIM(CAC.CODIGOCLIENTEALBARAN) = '4300032679')
  `;

  const facturas = await db.query(sqlFactura);
  if (facturas.length === 0) {
    console.log('  NO SE ENCONTRÓ la factura S-1166 para el cliente 4300032679.');
  } else {
    console.log(`  Se encontraron ${facturas.length} registro(s) para la factura S-1166:`);
    facturas.forEach(f => {
      console.log(`  Albarán: ${f.SERIE_ALBARAN}-${f.NUMERO_ALBARAN} (${f.EJERCICIO_ALBARAN})`);
      console.log(`  Cliente Factura: ${f.CODIGO_CLIENTE_FACTURA}`);
      console.log(`  Cliente Albarán: ${f.CODIGO_CLIENTE_ALBARAN}`);
      console.log(`  Fecha: ${f.DIA_FACTURA}/${f.MES_FACTURA}/${f.ANO_FACTURA}`);
      console.log(`  Importe Pendiente: ${f.IMPORTE_PENDIENTE}`);
      console.log('');
    });
  }

  // 4. Verificar en DSED.LACLAE (vista Power BI)
  console.log('\n--- 4. Verificar en DSED.LACLAE (vista Power BI) ---');
  const sqlLACLAE = `
    SELECT
      TRIM(LCCL) AS CLIENTE,
      LCNCL AS NOMBRE_CLIENTE,
      LCDOPO AS DIRECCION,
      LCPOBL AS POBLACION,
      LCPROV AS PROVINCIA,
      LCRUTA AS RUTA
    FROM DSED.LACLAE
    WHERE TRIM(LCCL) = '4300032679'
  `;

  try {
    const laclae = await db.query(sqlLACLAE);
    if (laclae.length === 0) {
      console.log('  NO SE ENCONTRÓ el cliente 4300032679 en DSED.LACLAE.');
    } else {
      console.log(`  Cliente encontrado en DSED.LACLAE:`);
      laclae.forEach(c => {
        console.log(`  Código: ${c.CLIENTE}`);
        console.log(`  Nombre: ${c.NOMBRE_CLIENTE}`);
        console.log(`  Dirección: ${c.DIRECCION}`);
        console.log(`  Población: ${c.POBLACION}`);
        console.log(`  Provincia: ${c.PROVINCIA}`);
        console.log(`  Ruta: ${c.RUTA}`);
      });
    }
  } catch (err) {
    console.log('  ERROR al consultar DSED.LACLAE: ' + err.message);
    console.log('  (Puede que la vista no exista o no tenga permisos)');
  }

  // 5. Ver todas las facturas del cliente 4300032679 que contienen el albarán S-303
  console.log('\n--- 5. Todas las facturas del cliente 4300032679 con albarán S-303 ---');
  const sqlTodasFacturas = `
    SELECT
      TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
      CAC.NUMEROFACTURA AS NUMERO_FACTURA,
      CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
      TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
      CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
      CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_CLIENTE_ALBARAN,
      CAC.DIAFACTURA AS DIA_FACTURA,
      CAC.MESFACTURA AS MES_FACTURA,
      CAC.ANOFACTURA AS ANO_FACTURA
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SERIEALBARAN) = 'S'
      AND CAC.NUMEROALBARAN = 303
      AND CAC.EJERCICIOALBARAN = 2026
    ORDER BY CAC.SERIEFACTURA, CAC.NUMEROFACTURA
  `;

  const todasFacturas = await db.query(sqlTodasFacturas);
  if (todasFacturas.length === 0) {
    console.log('  NO hay facturas que contengan el albarán S-303.');
  } else {
    console.log(`  Se encontraron ${todasFacturas.length} factura(s):`);
    todasFacturas.forEach(f => {
      console.log(`  Factura: ${f.SERIE_FACTURA}-${f.NUMERO_FACTURA} (${f.EJERCICIO_FACTURA})`);
      console.log(`  Cliente Factura: ${f.CODIGO_CLIENTE_FACTURA}`);
      console.log(`  Cliente Albarán: ${f.CODIGO_CLIENTE_ALBARAN}`);
      console.log(`  Fecha: ${f.DIA_FACTURA}/${f.MES_FACTURA}/${f.ANO_FACTURA}`);
      console.log('');
    });
  }

  // 6. Datos del cliente 4300032679
  console.log('\n--- 6. Datos del cliente 4300032679 ---');
  const sqlClienteDatos = `
    SELECT
      TRIM(CLI.CODIGOCLIENTE) AS CODIGO_CLIENTE,
      CLI.NOMBRECLIENTE AS NOMBRE,
      CLI.NOMBREALTERNATIVO AS NOMBRE_ALTERNATIVO,
      CLI.NIF AS NIF,
      CLI.DIRECCION AS DIRECCION,
      CLI.POBLACION AS POBLACION,
      CLI.PROVINCIA AS PROVINCIA,
      CLI.CODIGOPOSTAL AS CODIGO_POSTAL,
      CLI.TELEFONO1 AS TELEFONO
    FROM DSEDAC.CLI CLI
    WHERE TRIM(CLI.CODIGOCLIENTE) = '4300032679'
  `;

  const clienteDatos = await db.query(sqlClienteDatos);
  if (clienteDatos.length === 0) {
    console.log('  NO SE ENCONTRÓ el cliente 4300032679 en DSEDAC.CLI.');
  } else {
    console.log('  Datos del cliente:');
    clienteDatos.forEach(c => {
      console.log(`  Código: ${c.CODIGO_CLIENTE}`);
      console.log(`  Nombre: ${c.NOMBRE}`);
      console.log(`  Nombre Alternativo: ${c.NOMBRE_ALTERNATIVO}`);
      console.log(`  NIF: ${c.NIF}`);
      console.log(`  Dirección: ${c.DIRECCION}`);
      console.log(`  Población: ${c.POBLACION}`);
      console.log(`  Provincia: ${c.PROVINCIA}`);
      console.log(`  CP: ${c.CODIGO_POSTAL}`);
      console.log(`  Teléfono: ${c.TELEFONO}`);
    });
  }

  console.log('\n=== FIN DIAGNÓSTICO ===');
  await db.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
