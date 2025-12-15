require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

async function test() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Problema: El frontend agrupa también por SUBEMPRESAALBARAN y EJERCICIOALBARAN
    // Esto puede crear "duplicados" si una factura tiene líneas de diferentes ejercicios
    
    console.log('=== ANÁLISIS DEL PROBLEMA DE CONTEO ===\n');
    
    // Query del FRONTEND (como está ahora en authService)
    const facturasFrontend = await conn.query(`
      WITH FacturasAgrupadas AS (
        SELECT
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN,
          CAC.SERIEFACTURA,
          CAC.NUMEROFACTURA,
          MAX(CAC.ANODOCUMENTO) as ANODOCUMENTO,
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
      )
      SELECT * FROM FacturasAgrupadas
      WHERE ANODOCUMENTO = 2025
      ORDER BY NUMEROFACTURA
    `);
    
    console.log('FRONTEND (agrupa por SUBEMPRESA + EJERCICIO + SERIE + NUMERO):');
    let totalFront = 0;
    facturasFrontend.forEach(f => {
      const total = parseFloat(f.TOTAL_FACTURA) || 0;
      totalFront += total;
      console.log(`  ${f.SERIEFACTURA}-${f.NUMEROFACTURA}: SUB=${f.SUBEMPRESAALBARAN}, EJ=${f.EJERCICIOALBARAN} -> ${total.toFixed(2)}€`);
    });
    console.log(`  Total: ${totalFront.toFixed(2)}€ (${facturasFrontend.length} registros)\n`);
    
    // Query del LIBRO IVA (solo agrupa por SERIE + NUMERO)
    const facturasLibro = await conn.query(`
      SELECT 
        TRIM(SERIEFACTURA) as serie,
        NUMEROFACTURA as numero,
        SUM(COALESCE(IMPORTETOTAL, 0)) as total
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300000087'
        AND ANODOCUMENTO = 2025
        AND NUMEROFACTURA > 0
      GROUP BY SERIEFACTURA, NUMEROFACTURA
      ORDER BY NUMEROFACTURA
    `);
    
    console.log('LIBRO IVA (agrupa SOLO por SERIE + NUMERO):');
    let totalLibro = 0;
    facturasLibro.forEach(f => {
      const total = parseFloat(f.TOTAL) || 0;
      totalLibro += total;
      console.log(`  ${f.SERIE}-${f.NUMERO}: ${total.toFixed(2)}€`);
    });
    console.log(`  Total: ${totalLibro.toFixed(2)}€ (${facturasLibro.length} facturas)\n`);
    
    // La diferencia
    if (facturasFrontend.length !== facturasLibro.length) {
      console.log('⚠️ PROBLEMA ENCONTRADO:');
      console.log(`   Frontend cuenta ${facturasFrontend.length} registros`);
      console.log(`   Libro IVA cuenta ${facturasLibro.length} facturas`);
      console.log(`   Diferencia de conteo: ${facturasFrontend.length - facturasLibro.length}`);
      console.log(`   Diferencia de importe: ${(totalFront - totalLibro).toFixed(2)}€`);
      
      // Buscar duplicados en frontend
      const facturasMap = {};
      facturasFrontend.forEach(f => {
        const key = `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`;
        if (!facturasMap[key]) {
          facturasMap[key] = [];
        }
        facturasMap[key].push(f);
      });
      
      console.log('\n   Facturas duplicadas en frontend (diferentes SUBEMPRESA/EJERCICIO):');
      Object.entries(facturasMap).forEach(([key, arr]) => {
        if (arr.length > 1) {
          console.log(`     ${key}:`);
          arr.forEach(f => {
            console.log(`       - SUBEMPRESA=${f.SUBEMPRESAALBARAN}, EJERCICIO=${f.EJERCICIOALBARAN} -> ${parseFloat(f.TOTAL_FACTURA).toFixed(2)}€`);
          });
        }
      });
    } else {
      console.log('✅ Los conteos coinciden');
    }
    
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}
test();
