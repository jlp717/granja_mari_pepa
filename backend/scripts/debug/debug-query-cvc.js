require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Query COMPLETA incluyendo el LEFT JOIN a CVC
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
          SUM(CAC.IMPORTETOTAL) as TOTAL_FACTURA
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
        PA.TERMINALALBARAN as TERMINAL,
        FA.SERIEFACTURA,
        FA.NUMEROFACTURA,
        FA.ANODOCUMENTO,
        FA.TOTAL_FACTURA,
        CVC.SUBEMPRESADOCUMENTO as CVC_SUB,
        CVC.EJERCICIODOCUMENTO as CVC_EJ,
        CVC.SERIEDOCUMENTO as CVC_SERIE,
        CVC.NUMERODOCUMENTO as CVC_NUM
      FROM FacturasAgrupadas FA
      INNER JOIN PrimerAlbaran PA 
        ON PA.SUBEMPRESAALBARAN = FA.SUBEMPRESAALBARAN
        AND PA.EJERCICIOALBARAN = FA.EJERCICIOALBARAN
        AND PA.SERIEFACTURA = FA.SERIEFACTURA
        AND PA.NUMEROFACTURA = FA.NUMEROFACTURA
        AND PA.RN = 1
      LEFT JOIN DSEDAC.CVC 
        ON CVC.SUBEMPRESADOCUMENTO = FA.SUBEMPRESAALBARAN
        AND CVC.EJERCICIODOCUMENTO = FA.EJERCICIOALBARAN
        AND CVC.SERIEDOCUMENTO = FA.SERIEFACTURA
        AND CVC.NUMERODOCUMENTO = FA.NUMEROFACTURA
      ORDER BY FA.ANODOCUMENTO DESC, FA.MESDOCUMENTO DESC, FA.NUMEROFACTURA DESC
    `);
    
    console.log('Query COMPLETA con LEFT JOIN a CVC:');
    console.log(`Total registros: ${facturas.length}\n`);
    
    // Mostrar las primeras 20 facturas
    facturas.slice(0, 25).forEach((f, i) => {
      console.log(`[${i+1}] ${f.SERIEFACTURA}-${f.NUMEROFACTURA}: ANO=${f.ANODOCUMENTO}, EJ=${f.EJERCICIO}, CVC_EJ=${f.CVC_EJ || 'NULL'} -> ${parseFloat(f.TOTAL_FACTURA).toFixed(2)}€`);
    });
    
    // Contar duplicados
    const map = {};
    facturas.forEach(f => {
      const key = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}-${f.EJERCICIO}`;
      if (!map[key]) map[key] = 0;
      map[key]++;
    });
    
    console.log('\nDuplicados por SERIE-NUMERO-EJERCICIO:');
    let hasDups = false;
    Object.entries(map).forEach(([key, count]) => {
      if (count > 1) {
        console.log(`  ${key}: ${count} veces`);
        hasDups = true;
      }
    });
    if (!hasDups) console.log('  (ninguno)');
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}
test();
