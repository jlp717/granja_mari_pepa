require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function debugFactura() {
  try {
    await poolInstance.initialize();
    
    console.log('=== CONSULTANDO FACTURA F-002098 ===\n');

    // Primero, veamos qué albaranes están en esta factura
    const albaranesFactura = await poolInstance.query(`
      SELECT 
        NUMEROALBARAN,
        IMPORTETOTAL,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEIVA1,
        PORCENTAJEIVA1,
        DIADOCUMENTO,
        MESDOCUMENTO,
        ANODOCUMENTO
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
        AND NUMEROFACTURA = 2098
      ORDER BY NUMEROALBARAN
    `);

    console.log(`Albaranes en CAC con NUMEROFACTURA=2098: ${albaranesFactura.length}\n`);
    
    // Ahora consultar las líneas detalladas de cada albarán desde LAC
    const lineasDetalle = await poolInstance.query(`
      SELECT 
        LAC.NUMEROALBARAN,
        LAC.SECUENCIA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCION,
        LAC.CANTIDADENVASES,
        LAC.CANTIDADUNIDADES,
        LAC.PRECIOVENTA,
        LAC.PORCENTAJEDESCUENTO,
        LAC.IMPORTEDESCUENTOUNIDAD,
        LAC.IMPORTEVENTA,
        LAC.NUMEROFACTURA
      FROM DSEDAC.LAC
      WHERE NUMEROFACTURA = 2098
        AND LAC.SUBEMPRESAFACTURA = 'GMP'
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `);

    if (albaranesFactura.length === 0) {
      console.log('No se encontró la factura');
      return;
    }

    console.log('=== ALBARANES EN LA FACTURA (desde CAC) ===\n');
    let totalDesdeCac = 0;
    albaranesFactura.forEach(alb => {
      const total = parseFloat(alb.IMPORTETOTAL || 0);
      totalDesdeCac += total;
      console.log(`Albarán ${alb.NUMEROALBARAN}:`);
      console.log(`  Fecha: ${alb.DIADOCUMENTO}/${alb.MESDOCUMENTO}/${alb.ANODOCUMENTO}`);
      console.log(`  Total: ${total.toFixed(2)}€`);
      console.log(`  Base Imponible: ${alb.IMPORTEBASEIMPONIBLE1}€`);
      console.log(`  IVA (${alb.PORCENTAJEIVA1}%): ${alb.IMPORTEIVA1}€\n`);
    });

    console.log(`Total sumando todos los albaranes (CAC): ${totalDesdeCac.toFixed(2)}€\n`);

    console.log('=== LÍNEAS DETALLADAS (desde LAC) ===\n');
    console.log(`Total de líneas en LAC: ${lineasDetalle.length}\n`);

    // Agrupar por albarán
    const albaranesPorNumero = {};
    let totalDesdeLineas = 0;

    lineasDetalle.forEach(linea => {
      const numeroAlbaran = linea.NUMEROALBARAN;
      
      if (!albaranesPorNumero[numeroAlbaran]) {
        albaranesPorNumero[numeroAlbaran] = {
          numero: numeroAlbaran,
          lineas: [],
          total: 0
        };
      }

      const importeVenta = parseFloat(linea.IMPORTEVENTA || 0);
      totalDesdeLineas += importeVenta;

      albaranesPorNumero[numeroAlbaran].lineas.push({
        secuencia: linea.SECUENCIA,
        codigo: linea.CODIGOARTICULO?.trim(),
        descripcion: linea.DESCRIPCION?.trim(),
        cantidadEnvases: linea.CANTIDADENVASES,
        cantidadUnidades: linea.CANTIDADUNIDADES,
        precioVenta: linea.PRECIOVENTA,
        descuento: linea.PORCENTAJEDESCUENTO,
        importeDescuento: linea.IMPORTEDESCUENTOUNIDAD,
        importeVenta: importeVenta
      });

      albaranesPorNumero[numeroAlbaran].total += importeVenta;
    });

    Object.values(albaranesPorNumero).forEach(albaran => {
      console.log(`Albarán ${albaran.numero}:`);
      console.log(`  Líneas: ${albaran.lineas.length}`);
      
      albaran.lineas.forEach(linea => {
        console.log(`    ${linea.secuencia}. ${linea.descripcion}`);
        console.log(`       Envases: ${linea.cantidadEnvases}, Unidades: ${linea.cantidadUnidades}`);
        console.log(`       Precio: ${linea.precioVenta}€`);
        console.log(`       Descuento: ${linea.descuento}% (${linea.importeDescuento}€)`);
        console.log(`       Total línea: ${linea.importeVenta}€`);
      });
      
      console.log(`  Total albarán (sin IVA): ${albaran.total.toFixed(2)}€\n`);
    });

    // Calcular el total con IVA desde las líneas
    const totalBaseImponible = totalDesdeLineas;
    const porcentajeIva = albaranesFactura[0]?.PORCENTAJEIVA1 || 10;
    const totalIva = totalBaseImponible * (porcentajeIva / 100);
    const totalConIva = totalBaseImponible + totalIva;

    console.log('=== COMPARATIVA DE TOTALES ===');
    console.log(`Total desde CAC (IMPORTETOTAL): ${totalDesdeCac.toFixed(2)}€`);
    console.log(`Total desde líneas LAC (base): ${totalBaseImponible.toFixed(2)}€`);
    console.log(`IVA ${porcentajeIva}%: ${totalIva.toFixed(2)}€`);
    console.log(`Total con IVA desde líneas: ${totalConIva.toFixed(2)}€`);
    
    console.log('\n=== ANÁLISIS DEL PROBLEMA ===');
    const numerosAlbaranes = Object.keys(albaranesPorNumero).map(Number).sort((a, b) => a - b);
    console.log(`La factura F-002098 tiene ${numerosAlbaranes.length} albaranes: ${numerosAlbaranes.join(', ')}`);
    
    if (numerosAlbaranes.length > 1) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('La factura tiene múltiples albaranes y el total que muestra en la web (456,74€)');
      console.log('puede estar sumando TODOS los albaranes de forma incorrecta.');
      console.log('\nSegún la imagen, la factura real solo tiene UNA línea (PAVO ALAS)');
      console.log(`con un total de 120,94€, NO 456,74€`);
      console.log('\nEl problema está en cómo se agregan los datos en el frontend o en la query.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
  }
}

debugFactura();
