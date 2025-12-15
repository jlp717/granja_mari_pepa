require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function analizarRecargos2098() {
  try {
    await poolInstance.initialize();
    
    console.log('=== ANÁLISIS DE RECARGOS FACTURA 2098 ===\n');

    const albaranes = await poolInstance.query(`
      SELECT 
        NUMEROALBARAN,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEIVA1,
        PORCENTAJEIVA1,
        IMPORTERECARGO1,
        PORCENTAJERECARGO1,
        IMPORTETOTAL,
        IMPORTEBRUTO,
        IMPORTEBONIFICACION
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      ORDER BY NUMEROALBARAN
    `);
    
    console.log('Albaranes de la factura 2098:\n');
    
    let totalBase = 0, totalIVA = 0, totalREC = 0, totalImporte = 0;
    
    albaranes.forEach(alb => {
      const base = parseFloat(alb.IMPORTEBASEIMPONIBLE1 || 0);
      const iva = parseFloat(alb.IMPORTEIVA1 || 0);
      const rec = parseFloat(alb.IMPORTERECARGO1 || 0);
      const total = parseFloat(alb.IMPORTETOTAL || 0);
      const calculado = base + iva + rec;
      
      console.log(`Albarán ${alb.NUMEROALBARAN}:`);
      console.log(`  Base:         ${base.toFixed(2)}€`);
      console.log(`  IVA (${alb.PORCENTAJEIVA1}%):     ${iva.toFixed(2)}€`);
      console.log(`  Recargo (${alb.PORCENTAJERECARGO1}%): ${rec.toFixed(2)}€`);
      console.log(`  Calculado:    ${calculado.toFixed(2)}€ (Base+IVA+REC)`);
      console.log(`  Total CAC:    ${total.toFixed(2)}€`);
      console.log(`  Diferencia:   ${(total - calculado).toFixed(2)}€`);
      console.log('');
      
      totalBase += base;
      totalIVA += iva;
      totalREC += rec;
      totalImporte += total;
    });
    
    const totalCalculado = totalBase + totalIVA + totalREC;
    
    console.log('TOTALES:');
    console.log(`  Base:         ${totalBase.toFixed(2)}€`);
    console.log(`  IVA:          ${totalIVA.toFixed(2)}€`);
    console.log(`  Recargo:      ${totalREC.toFixed(2)}€`);
    console.log(`  Calculado:    ${totalCalculado.toFixed(2)}€`);
    console.log(`  Total CAC:    ${totalImporte.toFixed(2)}€`);
    console.log(`  Diferencia:   ${(totalImporte - totalCalculado).toFixed(2)}€`);
    
    console.log('\n¿QUÉ MOSTRAR EN EL PDF?');
    if (Math.abs(totalImporte - totalCalculado) < 0.01) {
      console.log('  ✅ Mostrar: Base + IVA + Recargo = Total');
    } else {
      console.log(`  ⚠️  Hay ${Math.abs(totalImporte - totalCalculado).toFixed(2)}€ de diferencia`);
      console.log('  📄 OPCIÓN 1: Mostrar solo el total final (456,74€)');
      console.log('  📄 OPCIÓN 2: Ajustar el IVA o Recargo para que cuadre');
      console.log('  📄 OPCIÓN 3: Añadir línea "Ajuste redondeo"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

analizarRecargos2098();
