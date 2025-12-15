require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function verificarTotales() {
  try {
    await poolInstance.initialize();
    
    console.log('=== VERIFICACIÓN DE TOTALES ===\n');

    // 1. Ver los totales directos de CAC para la factura 2098
    console.log('1. Totales en CAC (tabla de albaranes) para factura 2098:\n');
    
    const totalesCAC = await poolInstance.query(`
      SELECT
        NUMEROALBARAN,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEIVA1,
        PORCENTAJEIVA1,
        IMPORTETOTAL,
        DIADOCUMENTO || '/' || MESDOCUMENTO || '/' || ANODOCUMENTO as FECHA
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      ORDER BY NUMEROALBARAN
    `);

    let totalBaseCAC = 0;
    let totalIvaCAC = 0;
    let totalConIvaCAC = 0;

    console.log('Albaranes en CAC:');
    totalesCAC.forEach(t => {
      const base = parseFloat(t.IMPORTEBASEIMPONIBLE1 || 0);
      const iva = parseFloat(t.IMPORTEIVA1 || 0);
      const total = parseFloat(t.IMPORTETOTAL || 0);
      
      totalBaseCAC += base;
      totalIvaCAC += iva;
      totalConIvaCAC += total;
      
      console.log(`  Albarán ${t.NUMEROALBARAN} (${t.FECHA}):`);
      console.log(`    Base: ${base.toFixed(2)}€`);
      console.log(`    IVA ${t.PORCENTAJEIVA1}%: ${iva.toFixed(2)}€`);
      console.log(`    Total: ${total.toFixed(2)}€`);
    });

    console.log(`\nTOTAL CONSOLIDADO desde CAC:`);
    console.log(`  Base imponible: ${totalBaseCAC.toFixed(2)}€`);
    console.log(`  IVA: ${totalIvaCAC.toFixed(2)}€`);
    console.log(`  Total con IVA: ${totalConIvaCAC.toFixed(2)}€`);

    // 2. Ver totales desde líneas LAC
    console.log('\n2. Totales desde líneas LAC (tabla de líneas):\n');
    
    const lineasLAC = await poolInstance.query(`
      SELECT 
        LAC.NUMEROALBARAN,
        LAC.SECUENCIA,
        LAC.DESCRIPCION,
        LAC.CANTIDADENVASES,
        LAC.CANTIDADUNIDADES,
        LAC.PRECIOVENTA,
        LAC.PORCENTAJEDESCUENTO,
        LAC.IMPORTEVENTA
      FROM DSEDAC.LAC
      INNER JOIN DSEDAC.CAC 
        ON CAC.SUBEMPRESAALBARAN = LAC.SUBEMPRESAALBARAN
        AND CAC.EJERCICIOALBARAN = LAC.EJERCICIOALBARAN
        AND CAC.SERIEALBARAN = LAC.SERIEALBARAN
        AND CAC.TERMINALALBARAN = LAC.TERMINALALBARAN
        AND CAC.NUMEROALBARAN = LAC.NUMEROALBARAN
      WHERE LAC.NUMEROALBARAN IN (1002, 1161, 1338)
        AND LAC.SUBEMPRESAALBARAN = 'GMP'
        AND CAC.NUMEROFACTURA = 2098
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `);

    let totalBaseLAC = 0;
    let albaranActual = null;
    let subtotalAlbaran = 0;

    console.log('Líneas desde LAC:');
    lineasLAC.forEach(l => {
      if (albaranActual !== l.NUMEROALBARAN) {
        if (albaranActual !== null) {
          console.log(`    Subtotal base: ${subtotalAlbaran.toFixed(2)}€\n`);
        }
        albaranActual = l.NUMEROALBARAN;
        subtotalAlbaran = 0;
        console.log(`  Albarán ${l.NUMEROALBARAN}:`);
      }
      
      const importe = parseFloat(l.IMPORTEVENTA || 0);
      subtotalAlbaran += importe;
      totalBaseLAC += importe;
      
      console.log(`    ${l.SECUENCIA}. ${l.DESCRIPCION?.trim()}`);
      console.log(`       ${l.CANTIDADENVASES} x ${l.CANTIDADUNIDADES} uds = ${importe.toFixed(2)}€`);
    });
    
    if (albaranActual !== null) {
      console.log(`    Subtotal base: ${subtotalAlbaran.toFixed(2)}€\n`);
    }

    const totalIvaLAC = totalBaseLAC * 0.10; // Asumiendo 10% IVA
    const totalConIvaLAC = totalBaseLAC + totalIvaLAC;

    console.log(`TOTAL CONSOLIDADO desde LAC:`);
    console.log(`  Base imponible: ${totalBaseLAC.toFixed(2)}€`);
    console.log(`  IVA 10%: ${totalIvaLAC.toFixed(2)}€`);
    console.log(`  Total con IVA: ${totalConIvaLAC.toFixed(2)}€`);

    // 3. Comparación
    console.log('\n=== COMPARACIÓN ===');
    console.log(`CAC (usado en tabla web): ${totalConIvaCAC.toFixed(2)}€`);
    console.log(`LAC (usado en PDF actual): ${totalConIvaLAC.toFixed(2)}€`);
    console.log(`Diferencia: ${Math.abs(totalConIvaCAC - totalConIvaLAC).toFixed(2)}€`);

    if (Math.abs(totalConIvaCAC - totalConIvaLAC) > 0.1) {
      console.log('\n❌ HAY DIFERENCIA! Los totales no coinciden.');
      console.log('\nLa fuente correcta es CAC.IMPORTETOTAL, que ya incluye:');
      console.log('- Base imponible calculada con descuentos');
      console.log('- IVA aplicado');
      console.log('- Redondeos correctos');
    } else {
      console.log('\n✅ Los totales coinciden correctamente');
    }

    // 4. Verificar el formato del número de factura
    console.log('\n=== VERIFICACIÓN FORMATO NÚMERO FACTURA ===\n');
    
    const infoFactura = await poolInstance.query(`
      SELECT DISTINCT
        SERIEFACTURA,
        NUMEROFACTURA,
        SUBEMPRESAALBARAN,
        EJERCICIOALBARAN,
        TERMINALALBARAN,
        MIN(NUMEROALBARAN) as PRIMER_ALBARAN
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      GROUP BY SERIEFACTURA, NUMEROFACTURA, SUBEMPRESAALBARAN, EJERCICIOALBARAN, TERMINALALBARAN
    `);

    if (infoFactura.length > 0) {
      const f = infoFactura[0];
      console.log('Datos de la factura:');
      console.log(`  Serie: ${f.SERIEFACTURA}`);
      console.log(`  Número: ${f.NUMEROFACTURA}`);
      console.log(`  Subempresa: ${f.SUBEMPRESAALBARAN}`);
      console.log(`  Ejercicio: ${f.EJERCICIOALBARAN}`);
      console.log(`  Terminal: ${f.TERMINALALBARAN}`);
      
      const ejercicio = String(f.EJERCICIOALBARAN).slice(-2);
      const terminal = String(f.TERMINALALBARAN).padStart(2, '0');
      const numero = String(f.NUMEROFACTURA).padStart(4, '0');
      
      console.log('\nFormatos posibles:');
      console.log(`  Serie + Ejercicio + Número: ${f.SERIEFACTURA} ${ejercicio} ${numero}`);
      console.log(`  Serie + Terminal + Número: ${f.SERIEFACTURA} ${terminal} ${numero}`);
      
      console.log('\n¿Cuál es correcto? Verificar con tu jefe qué significa el "00"');
      console.log('Si el "00" es el terminal, entonces el formato correcto es: Serie + Terminal + Número');
    }

    // 5. Verificar cliente 4300009900 como comprobación
    console.log('\n=== VERIFICACIÓN CLIENTE 4300009900 (2025) ===\n');
    
    const totalCliente = await poolInstance.query(`
      SELECT
        SUM(CAC.IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '4300009900'
        AND CAC.ANODOCUMENTO = 2025
        AND CAC.NUMEROFACTURA > 0
    `);

    if (totalCliente.length > 0) {
      const total = parseFloat(totalCliente[0].TOTAL || 0);
      console.log(`Total para cliente 4300009900 en 2025: ${total.toFixed(2)}€`);
      console.log(`Esperado: 1715.13€`);
      
      if (Math.abs(total - 1715.13) < 0.1) {
        console.log('✅ Coincide correctamente');
      } else {
        console.log(`❌ No coincide, diferencia: ${Math.abs(total - 1715.13).toFixed(2)}€`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
  }
}

verificarTotales();
