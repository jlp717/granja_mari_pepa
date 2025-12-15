require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function debugDetalle2098() {
  try {
    await poolInstance.initialize();
    
    console.log('=== ANÁLISIS DETALLADO FACTURA 2098 ===\n');

    // 1. Ver totales de cada albarán desde CAC
    console.log('1. TOTALES DE CADA ALBARÁN (tabla CAC):\n');
    
    const albaranes = await poolInstance.query(`
      SELECT 
        NUMEROALBARAN,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEIVA1,
        PORCENTAJEIVA1,
        IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      ORDER BY NUMEROALBARAN
    `);
    
    let sumaBase = 0, sumaIVA = 0, sumaTotal = 0;
    
    albaranes.forEach(alb => {
      const base = parseFloat(alb.IMPORTEBASEIMPONIBLE1 || 0);
      const iva = parseFloat(alb.IMPORTEIVA1 || 0);
      const total = parseFloat(alb.IMPORTETOTAL || 0);
      
      console.log(`Albarán ${alb.NUMEROALBARAN}:`);
      console.log(`  Base imponible:  ${base.toFixed(2)}€`);
      console.log(`  IVA ${alb.PORCENTAJEIVA1}%:        ${iva.toFixed(2)}€`);
      console.log(`  Total:           ${total.toFixed(2)}€`);
      console.log(`  Suma B+I:        ${(base + iva).toFixed(2)}€`);
      console.log('');
      
      sumaBase += base;
      sumaIVA += iva;
      sumaTotal += total;
    });
    
    console.log('SUMA DE LOS 3 ALBARANES:');
    console.log(`  Base:            ${sumaBase.toFixed(2)}€`);
    console.log(`  IVA:             ${sumaIVA.toFixed(2)}€`);
    console.log(`  Total CAC:       ${sumaTotal.toFixed(2)}€`);
    console.log(`  Calculado B+I:   ${(sumaBase + sumaIVA).toFixed(2)}€`);

    // 2. Ver líneas con producto duplicado (PAVO ALAS)
    console.log('\n2. LÍNEAS DEL PRODUCTO 0263634 (PAVO ALAS):\n');
    
    const lineasPavo = await poolInstance.query(`
      SELECT 
        LAC.NUMEROALBARAN,
        LAC.SECUENCIA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCION,
        LAC.CODIGOLOTE,
        LAC.CANTIDADENVASES,
        LAC.CANTIDADUNIDADES,
        LAC.PRECIOVENTA,
        LAC.IMPORTEVENTA
      FROM DSEDAC.LAC
      INNER JOIN DSEDAC.CAC 
        ON CAC.SUBEMPRESAALBARAN = LAC.SUBEMPRESAALBARAN
        AND CAC.EJERCICIOALBARAN = LAC.EJERCICIOALBARAN
        AND CAC.SERIEALBARAN = LAC.SERIEALBARAN
        AND CAC.TERMINALALBARAN = LAC.TERMINALALBARAN
        AND CAC.NUMEROALBARAN = LAC.NUMEROALBARAN
      WHERE CAC.NUMEROFACTURA = 2098
        AND LAC.CODIGOARTICULO = '0263634'
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `);
    
    if (lineasPavo.length > 0) {
      lineasPavo.forEach(linea => {
        console.log(`Albarán ${linea.NUMEROALBARAN} - Línea ${linea.SECUENCIA}:`);
        console.log(`  Código:      ${linea.CODIGOARTICULO}`);
        console.log(`  Descripción: ${linea.DESCRIPCION?.trim()}`);
        console.log(`  Lote:        ${linea.CODIGOLOTE}`);
        console.log(`  Cantidad:    ${linea.CANTIDADENVASES} x ${linea.CANTIDADUNIDADES} uds`);
        console.log(`  Precio:      ${linea.PRECIOVENTA}€`);
        console.log(`  Importe:     ${linea.IMPORTEVENTA}€`);
        console.log('');
      });
      
      console.log('ANÁLISIS DE DUPLICADOS:');
      console.log(`  Total líneas encontradas: ${lineasPavo.length}`);
      
      // Agrupar por lote y artículo
      const grupos = {};
      lineasPavo.forEach(l => {
        const key = `${l.CODIGOLOTE}-${l.CODIGOARTICULO}`;
        if (!grupos[key]) {
          grupos[key] = [];
        }
        grupos[key].push(l);
      });
      
      Object.keys(grupos).forEach(key => {
        const lineas = grupos[key];
        if (lineas.length > 1) {
          console.log(`\n  ❌ DUPLICADO detectado (Lote-Artículo: ${key}):`);
          lineas.forEach(l => {
            console.log(`     Albarán ${l.NUMEROALBARAN}, Línea ${l.SECUENCIA}: ${l.CANTIDADENVASES} x ${l.CANTIDADUNIDADES} uds = ${l.IMPORTEVENTA}€`);
          });
          
          const totalCantEnvases = lineas.reduce((sum, l) => sum + parseFloat(l.CANTIDADENVASES || 0), 0);
          const totalCantUds = lineas.reduce((sum, l) => sum + parseFloat(l.CANTIDADUNIDADES || 0), 0);
          const totalImporte = lineas.reduce((sum, l) => sum + parseFloat(l.IMPORTEVENTA || 0), 0);
          
          console.log(`     Si se agrupara: ${totalCantEnvases} envases, ${totalCantUds} uds = ${totalImporte.toFixed(2)}€`);
        }
      });
    } else {
      console.log('  No se encontraron líneas con código 0263634');
    }

    // 3. Ver TODAS las líneas de la factura
    console.log('\n3. TODAS LAS LÍNEAS DE LA FACTURA 2098:\n');
    
    const todasLineas = await poolInstance.query(`
      SELECT 
        LAC.NUMEROALBARAN,
        LAC.SECUENCIA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCION,
        LAC.CODIGOLOTE,
        LAC.CANTIDADENVASES,
        LAC.CANTIDADUNIDADES,
        LAC.PRECIOVENTA,
        LAC.IMPORTEVENTA
      FROM DSEDAC.LAC
      INNER JOIN DSEDAC.CAC 
        ON CAC.SUBEMPRESAALBARAN = LAC.SUBEMPRESAALBARAN
        AND CAC.EJERCICIOALBARAN = LAC.EJERCICIOALBARAN
        AND CAC.SERIEALBARAN = LAC.SERIEALBARAN
        AND CAC.TERMINALALBARAN = LAC.TERMINALALBARAN
        AND CAC.NUMEROALBARAN = LAC.NUMEROALBARAN
      WHERE CAC.NUMEROFACTURA = 2098
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `);
    
    let sumaLineas = 0;
    let albaranActual = null;
    
    todasLineas.forEach(linea => {
      if (albaranActual !== linea.NUMEROALBARAN) {
        if (albaranActual !== null) console.log('');
        albaranActual = linea.NUMEROALBARAN;
        console.log(`Albarán ${linea.NUMEROALBARAN}:`);
      }
      
      const importe = parseFloat(linea.IMPORTEVENTA || 0);
      sumaLineas += importe;
      
      console.log(`  ${linea.SECUENCIA}. ${linea.CODIGOARTICULO} ${linea.DESCRIPCION?.trim()}`);
      console.log(`     Lote: ${linea.CODIGOLOTE}`);
      console.log(`     ${linea.CANTIDADENVASES} x ${linea.CANTIDADUNIDADES} uds @ ${linea.PRECIOVENTA}€ = ${importe.toFixed(2)}€`);
    });
    
    const sumaLineasConIVA = sumaLineas * 1.10; // Asumiendo 10% IVA
    
    console.log(`\nSUMA DE TODAS LAS LÍNEAS (LAC):`);
    console.log(`  Base:  ${sumaLineas.toFixed(2)}€`);
    console.log(`  IVA:   ${(sumaLineas * 0.10).toFixed(2)}€`);
    console.log(`  Total: ${sumaLineasConIVA.toFixed(2)}€`);
    
    console.log('\n=== COMPARACIÓN FINAL ===');
    console.log(`Total desde CAC (correcto): ${sumaTotal.toFixed(2)}€`);
    console.log(`Total desde LAC (calculado): ${sumaLineasConIVA.toFixed(2)}€`);
    console.log(`Diferencia: ${Math.abs(sumaTotal - sumaLineasConIVA).toFixed(2)}€`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

debugDetalle2098();
