require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Verificar por qué F-2200 y F-1165 se duplican
    const r = await conn.query(`
      SELECT
        CAC.SUBEMPRESAALBARAN,
        CAC.EJERCICIOALBARAN,
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        MAX(CAC.ANODOCUMENTO) as ANODOCUMENTO,
        MAX(CAC.MESDOCUMENTO) as MESDOCUMENTO
      FROM DSEDAC.CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300000087'
        AND CAC.NUMEROFACTURA IN (2200, 1165)
        AND CAC.NUMEROALBARAN > 0
      GROUP BY 
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        CAC.SUBEMPRESAALBARAN,
        CAC.EJERCICIOALBARAN
      ORDER BY CAC.NUMEROFACTURA, CAC.EJERCICIOALBARAN
    `);
    
    console.log('Facturas F-2200 y F-1165 agrupadas por SUBEMPRESA+EJERCICIO:');
    r.forEach(f => {
      console.log(`  ${f.SERIEFACTURA}-${f.NUMEROFACTURA}: SUBEMPRESA=${f.SUBEMPRESAALBARAN}, EJERCICIO=${f.EJERCICIOALBARAN}, ANO=${f.ANODOCUMENTO}, MES=${f.MESDOCUMENTO}`);
    });
    
    console.log('\nEl problema: Hay albaranes de EJERCICIO 2024 que se facturaron en 2025');
    console.log('La query actual agrupa por EJERCICIOALBARAN, lo cual crea duplicados');
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}
test();
