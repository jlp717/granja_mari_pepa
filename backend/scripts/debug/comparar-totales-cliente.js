require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../app/config/odbcConfig');

const CLIENTE = process.argv[2] || '4300000087'; // Pizzeria La Antorcha por defecto
const EJERCICIO = parseInt(process.argv[3]) || 2025;

async function comparar() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`COMPARACIÓN DE TOTALES - Cliente: ${CLIENTE} - Año: ${EJERCICIO}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // 1. Query del libro de IVA (agrupa por SERIEFACTURA, NUMEROFACTURA)
    console.log('📊 MÉTODO LIBRO IVA (agrupado por serie+numero factura):');
    const libroIva = await conn.query(`
      SELECT 
        TRIM(SERIEFACTURA) as serie,
        NUMEROFACTURA as numero,
        MAX(DIADOCUMENTO) as dia,
        MAX(MESDOCUMENTO) as mes,
        MAX(ANODOCUMENTO) as ano,
        SUM(COALESCE(IMPORTEBASEIMPONIBLE1, 0) + COALESCE(IMPORTEBASEIMPONIBLE2, 0) + 
            COALESCE(IMPORTEBASEIMPONIBLE3, 0) + COALESCE(IMPORTEBASEIMPONIBLE4, 0) + 
            COALESCE(IMPORTEBASEIMPONIBLE5, 0)) as baseImponible,
        SUM(COALESCE(IMPORTEIVA1, 0) + COALESCE(IMPORTEIVA2, 0) + 
            COALESCE(IMPORTEIVA3, 0) + COALESCE(IMPORTEIVA4, 0) + 
            COALESCE(IMPORTEIVA5, 0)) as iva,
        SUM(COALESCE(IMPORTETOTAL, 0)) as total
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '${CLIENTE}'
        AND ANODOCUMENTO = ${EJERCICIO}
        AND NUMEROFACTURA > 0
      GROUP BY SERIEFACTURA, NUMEROFACTURA
      ORDER BY SERIEFACTURA, NUMEROFACTURA
    `);
    
    let totalLibroIva = 0;
    let countLibroIva = 0;
    console.log('\nFacturas encontradas:');
    libroIva.forEach(f => {
      const total = parseFloat(f.TOTAL) || 0;
      totalLibroIva += total;
      countLibroIva++;
      console.log(`  ${f.SERIE}-${String(f.NUMERO).padStart(6, '0')}: ${f.DIA}/${f.MES}/${f.ANO} -> ${total.toFixed(2)}€`);
    });
    console.log(`\n  TOTAL LIBRO IVA: ${totalLibroIva.toFixed(2)}€ (${countLibroIva} facturas)`);
    
    // 2. Query de facturas para el frontend (la que usa authService)
    console.log('\n\n📱 MÉTODO FRONTEND (authService.obtenerFacturasCliente):');
    const facturasFrontend = await conn.query(`
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
          SUM(CAC.IMPORTETOTAL) as TOTAL_FACTURA
        FROM DSEDAC.CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '${CLIENTE}'
          AND CAC.NUMEROFACTURA > 0
          AND CAC.NUMEROALBARAN > 0
        GROUP BY 
          CAC.SERIEFACTURA,
          CAC.NUMEROFACTURA,
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN
      )
      SELECT * FROM FacturasAgrupadas
      ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
    `);
    
    let totalFrontend = 0;
    let countFrontend = 0;
    let totalFrontend2025 = 0;
    let countFrontend2025 = 0;
    
    console.log('\nTodas las facturas (histórico):');
    facturasFrontend.forEach(f => {
      const total = parseFloat(f.TOTAL_FACTURA) || 0;
      totalFrontend += total;
      countFrontend++;
      
      if (f.ANODOCUMENTO === EJERCICIO) {
        totalFrontend2025 += total;
        countFrontend2025++;
      }
      
      console.log(`  ${f.SERIEFACTURA}-${String(f.NUMEROFACTURA).padStart(6, '0')}: ${f.DIADOCUMENTO}/${f.MESDOCUMENTO}/${f.ANODOCUMENTO} -> ${total.toFixed(2)}€`);
    });
    
    console.log(`\n  TOTAL FRONTEND (TODO): ${totalFrontend.toFixed(2)}€ (${countFrontend} facturas)`);
    console.log(`  TOTAL FRONTEND (${EJERCICIO}): ${totalFrontend2025.toFixed(2)}€ (${countFrontend2025} facturas)`);
    
    // 3. Comparación
    console.log('\n\n📊 COMPARACIÓN:');
    console.log(`  Libro IVA ${EJERCICIO}:           ${totalLibroIva.toFixed(2)}€ (${countLibroIva} facturas)`);
    console.log(`  Frontend filtrado ${EJERCICIO}:  ${totalFrontend2025.toFixed(2)}€ (${countFrontend2025} facturas)`);
    console.log(`  Frontend TODO histórico:   ${totalFrontend.toFixed(2)}€ (${countFrontend} facturas)`);
    
    const diferencia = totalFrontend2025 - totalLibroIva;
    if (Math.abs(diferencia) > 0.01) {
      console.log(`\n  ⚠️  DIFERENCIA: ${diferencia.toFixed(2)}€`);
      
      // Buscar facturas que estén en uno pero no en otro
      console.log('\n  Analizando diferencias...');
      
      // Facturas en frontend pero no en libro IVA
      const facturasLibro = new Set(libroIva.map(f => `${f.SERIE}-${f.NUMERO}`));
      const facturasFront = facturasFrontend
        .filter(f => f.ANODOCUMENTO === EJERCICIO)
        .map(f => ({ key: `${f.SERIEFACTURA}-${f.NUMEROFACTURA}`, total: parseFloat(f.TOTAL_FACTURA) }));
      
      const enFrontNoLibro = facturasFront.filter(f => !facturasLibro.has(f.key));
      if (enFrontNoLibro.length > 0) {
        console.log('\n  Facturas en Frontend pero NO en Libro IVA:');
        enFrontNoLibro.forEach(f => console.log(`    ${f.key}: ${f.total.toFixed(2)}€`));
      }
      
      const facturasLibroSet = libroIva.map(f => ({ key: `${f.SERIE}-${f.NUMERO}`, total: parseFloat(f.TOTAL) }));
      const enLibroNoFront = facturasLibroSet.filter(f => !facturasFront.some(ff => ff.key === f.key));
      if (enLibroNoFront.length > 0) {
        console.log('\n  Facturas en Libro IVA pero NO en Frontend:');
        enLibroNoFront.forEach(f => console.log(`    ${f.key}: ${f.total.toFixed(2)}€`));
      }
      
    } else {
      console.log(`\n  ✅ Los totales coinciden para ${EJERCICIO}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.release(conn);
    await pool.shutdown();
  }
}

comparar();
