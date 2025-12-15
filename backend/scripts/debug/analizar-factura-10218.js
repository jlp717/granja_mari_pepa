require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function analizar() {
  // Inicializar pool
  await pool.initialize();
  
  const conn = await pool.acquire();
  
  try {
    console.log('=== VERIFICACIÓN IVA REPERCUTIDO DIEGO 2025 ===\n');
    
    // Calcular IVA repercutido de Diego en 2025 - suma de todas las facturas
    const ivaRepercutido = await conn.query(`
      SELECT 
        SUM(CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5) as TOTAL_IVA_REPERCUTIDO,
        COUNT(DISTINCT CAC.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(CAC.IMPORTETOTAL) as TOTAL_VENTAS
      FROM DSEDAC.CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300009900'
        AND CAC.EJERCICIOALBARAN = 2025
        AND CAC.NUMEROFACTURA > 0
    `);
    
    console.log('IVA Repercutido total de Diego 2025:');
    console.log(JSON.stringify(ivaRepercutido[0], null, 2));
    
    // Desglose por factura - usando la query corregida con CTE
    console.log('\n=== DESGLOSE POR FACTURA ===');
    const desglose = await conn.query(`
      SELECT
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        SUM(CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3) as BASE,
        SUM(CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3) as IVA,
        SUM(CAC.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300009900'
        AND CAC.EJERCICIOALBARAN = 2025
        AND CAC.NUMEROFACTURA > 0
      GROUP BY CAC.SERIEFACTURA, CAC.NUMEROFACTURA
      ORDER BY CAC.NUMEROFACTURA
    `);
    
    let sumaIVA = 0;
    desglose.forEach(f => {
      const iva = parseFloat(f.IVA) || 0;
      sumaIVA += iva;
      console.log(`${f.SERIEFACTURA}-${f.NUMEROFACTURA}: Base ${parseFloat(f.BASE).toFixed(2)}€, IVA ${iva.toFixed(2)}€, Total ${parseFloat(f.TOTAL).toFixed(2)}€`);
    });
    
    console.log(`\n=== SUMA TOTAL IVA REPERCUTIDO: ${sumaIVA.toFixed(2)}€ ===`);
    
    // Verificar si es 1715.11 o 1715.13
    const esperado1 = 1715.11;
    const esperado2 = 1715.13;
    const diferencia1 = Math.abs(sumaIVA - esperado1);
    const diferencia2 = Math.abs(sumaIVA - esperado2);
    
    if (diferencia1 < 0.05 || diferencia2 < 0.05) {
      console.log('✅ El IVA repercutido está dentro del rango esperado (1715.11 - 1715.13)');
    } else {
      console.log(`⚠️ Diferencia con esperado: ${Math.min(diferencia1, diferencia2).toFixed(2)}€`);
    }
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}

analizar().catch(e => { console.error(e); process.exit(1); });
