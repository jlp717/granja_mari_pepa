require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Ejecutar la MISMA query que usa authService
    const facturas = await conn.query(`
      WITH FacturasAgrupadas AS (
        SELECT
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN,
          CAC.SERIEFACTURA,
          CAC.NUMEROFACTURA,
          MAX(CAC.ANODOCUMENTO) as ANODOCUMENTO,
          MAX(CAC.MESDOCUMENTO) as MESDOCUMENTO,
          MAX(CAC.DIADOCUMENTO) as DIADOCUMENTO,
          SUM(CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 + CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) as TOTAL_BASE,
          SUM(CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5) as TOTAL_IVA,
          SUM(CAC.IMPORTETOTAL) as TOTAL_FACTURA,
          MIN(CAC.CODIGOFORMAPAGO) as CODIGOFORMAPAGO,
          MIN(CAC.CODIGOTIPOALBARAN) as TIPO_DOCUMENTO,
          LISTAGG(CAST(CAC.NUMEROALBARAN AS VARCHAR(10)), ', ') WITHIN GROUP (ORDER BY CAC.SERIEALBARAN, CAC.NUMEROALBARAN) as LISTA_ALBARANES
        FROM DSEDAC.CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300000087'
          AND CAC.NUMEROFACTURA > 0
          AND CAC.NUMEROALBARAN > 0
        GROUP BY 
          CAC.SERIEFACTURA,
          CAC.NUMEROFACTURA,
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN
      ),
      PrimerAlbaran AS (
        SELECT
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN,
          CAC.SERIEFACTURA,
          CAC.NUMEROFACTURA,
          CAC.SERIEALBARAN,
          CAC.TERMINALALBARAN,
          CAC.NUMEROALBARAN,
          ROW_NUMBER() OVER (
            PARTITION BY CAC.SUBEMPRESAALBARAN, CAC.EJERCICIOALBARAN, CAC.SERIEFACTURA, CAC.NUMEROFACTURA
            ORDER BY CAC.SERIEALBARAN, CAC.NUMEROALBARAN
          ) as RN
        FROM DSEDAC.CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300000087'
          AND CAC.NUMEROFACTURA > 0
          AND CAC.NUMEROALBARAN > 0
      )
      SELECT
        FA.SUBEMPRESAALBARAN as SUBEMPRESA,
        FA.EJERCICIOALBARAN as EJERCICIO,
        PA.SERIEALBARAN as SERIE,
        PA.TERMINALALBARAN as TERMINAL,
        PA.NUMEROALBARAN as NUMERO_ALBARAN,
        FA.LISTA_ALBARANES,
        FA.SERIEFACTURA,
        FA.NUMEROFACTURA,
        FA.ANODOCUMENTO,
        FA.MESDOCUMENTO,
        FA.DIADOCUMENTO,
        FA.TOTAL_FACTURA
      FROM FacturasAgrupadas FA
      INNER JOIN PrimerAlbaran PA 
        ON PA.SUBEMPRESAALBARAN = FA.SUBEMPRESAALBARAN
        AND PA.EJERCICIOALBARAN = FA.EJERCICIOALBARAN
        AND PA.SERIEFACTURA = FA.SERIEFACTURA
        AND PA.NUMEROFACTURA = FA.NUMEROFACTURA
        AND PA.RN = 1
      WHERE FA.ANODOCUMENTO = 2025
      ORDER BY FA.NUMEROFACTURA
    `);
    
    console.log('Resultado de la query exacta del authService (filtrada a 2025):');
    console.log(`Total registros: ${facturas.length}\n`);
    
    facturas.forEach(f => {
      console.log(`${f.SERIEFACTURA}-${f.NUMEROFACTURA}: SUB=${f.SUBEMPRESA}, EJ=${f.EJERCICIO}, TERMINAL=${f.TERMINAL}, ALBARAN=${f.NUMERO_ALBARAN} -> ${parseFloat(f.TOTAL_FACTURA).toFixed(2)}€`);
    });
    
    // Buscar duplicados
    const map = {};
    facturas.forEach(f => {
      const key = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;
      if (!map[key]) map[key] = 0;
      map[key]++;
    });
    
    console.log('\nDuplicados:');
    Object.entries(map).forEach(([key, count]) => {
      if (count > 1) console.log(`  ${key}: ${count} veces`);
    });
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}
test();
