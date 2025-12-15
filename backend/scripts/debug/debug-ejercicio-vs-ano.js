require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Ver todas las facturas del cliente con EJERCICIO vs ANO
    const r = await conn.query(`
      SELECT 
        SERIEFACTURA, 
        NUMEROFACTURA, 
        EJERCICIOALBARAN,
        ANODOCUMENTO,
        DIADOCUMENTO,
        MESDOCUMENTO,
        SUM(IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300000087'
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND (EJERCICIOALBARAN = 2025 OR ANODOCUMENTO = 2025)
      GROUP BY SERIEFACTURA, NUMEROFACTURA, EJERCICIOALBARAN, ANODOCUMENTO, DIADOCUMENTO, MESDOCUMENTO
      ORDER BY ANODOCUMENTO, MESDOCUMENTO, DIADOCUMENTO
    `);
    
    console.log('Facturas con EJERCICIO o ANO = 2025:');
    let totalEjercicio2025 = 0;
    let totalAno2025 = 0;
    let countEjercicio2025 = 0;
    let countAno2025 = 0;
    
    r.forEach(f => {
      const total = parseFloat(f.TOTAL) || 0;
      console.log(`  ${f.SERIEFACTURA}-${f.NUMEROFACTURA}: EJERCICIO=${f.EJERCICIOALBARAN}, ANO=${f.ANODOCUMENTO}, Fecha=${f.DIADOCUMENTO}/${f.MESDOCUMENTO} -> ${total.toFixed(2)}€`);
      
      if (f.EJERCICIOALBARAN === 2025) {
        totalEjercicio2025 += total;
        countEjercicio2025++;
      }
      if (f.ANODOCUMENTO === 2025) {
        totalAno2025 += total;
        countAno2025++;
      }
    });
    
    console.log(`\nResumen:`);
    console.log(`  Con EJERCICIOALBARAN=2025: ${countEjercicio2025} facturas, Total: ${totalEjercicio2025.toFixed(2)}€`);
    console.log(`  Con ANODOCUMENTO=2025: ${countAno2025} facturas, Total: ${totalAno2025.toFixed(2)}€`);
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}
test();
