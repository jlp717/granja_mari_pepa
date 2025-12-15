require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function analizarEstructuraFacturas() {
  try {
    await poolInstance.initialize();
    
    console.log('=== ANÁLISIS DE ESTRUCTURA DE FACTURAS ===\n');

    // Ver cuántos albaranes tienen la misma factura
    const facturasConMultiplesAlbaranes = await poolInstance.query(`
      SELECT 
        SERIEFACTURA,
        NUMEROFACTURA,
        COUNT(DISTINCT NUMEROALBARAN) as NUM_ALBARANES,
        LISTAGG(CAST(NUMEROALBARAN AS VARCHAR(10)), ', ') 
          WITHIN GROUP (ORDER BY NUMEROALBARAN) as ALBARANES,
        SUM(IMPORTETOTAL) as TOTAL_SUMADO
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      GROUP BY SERIEFACTURA, NUMEROFACTURA
      HAVING COUNT(DISTINCT NUMEROALBARAN) > 1
      ORDER BY NUMEROFACTURA DESC
      FETCH FIRST 10 ROWS ONLY
    `);

    console.log('Facturas con múltiples albaranes:\n');
    facturasConMultiplesAlbaranes.forEach(f => {
      console.log(`Factura ${f.SERIEFACTURA}-${f.NUMEROFACTURA}:`);
      console.log(`  Albaranes: ${f.ALBARANES} (${f.NUM_ALBARANES} total)`);
      console.log(`  Total sumado: ${f.TOTAL_SUMADO}€\n`);
    });

    // Ahora analicemos si existe una tabla de relación factura-albarán
    // o si el campo NUMEROFACTURA en LAC indica qué líneas van en cada factura
    console.log('\n=== VERIFICANDO LÍNEAS DE FACTURA ===\n');
    
    const lineasFactura2098 = await poolInstance.query(`
      SELECT 
        NUMEROALBARAN,
        SECUENCIA,
        DESCRIPCION,
        CANTIDADENVASES,
        IMPORTEVENTA,
        NUMEROFACTURA
      FROM DSEDAC.LAC
      WHERE NUMEROFACTURA = 2098
        AND SUBEMPRESAFACTURA = 'GMP'
      ORDER BY NUMEROALBARAN, SECUENCIA
    `);

    console.log(`Líneas en LAC con NUMEROFACTURA=2098: ${lineasFactura2098.length}`);
    
    if (lineasFactura2098.length > 0) {
      lineasFactura2098.forEach(l => {
        console.log(`Albarán ${l.NUMEROALBARAN}, Línea ${l.SECUENCIA}: ${l.DESCRIPCION} - ${l.IMPORTEVENTA}€`);
      });
    } else {
      console.log('No hay líneas con NUMEROFACTURA=2098 en LAC');
      console.log('\nEsto significa que el campo NUMEROFACTURA en LAC no se usa,');
      console.log('y debemos confiar SOLO en CAC.NUMEROFACTURA para la relación.\n');
      
      // Ver todas las líneas de los albaranes vinculados
      console.log('=== LÍNEAS DE LOS ALBARANES 1002, 1161, 1338 ===\n');
      
      const lineasAlbaranes = await poolInstance.query(`
        SELECT 
          LAC.NUMEROALBARAN,
          LAC.SECUENCIA,
          LAC.DESCRIPCION,
          LAC.CANTIDADENVASES,
          LAC.CANTIDADUNIDADES,
          LAC.PRECIOVENTA,
          LAC.IMPORTEVENTA,
          CAC.NUMEROFACTURA
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

      console.log(`Total de líneas: ${lineasAlbaranes.length}\n`);
      
      let totalGeneral = 0;
      let albaranActual = null;
      let totalAlbaran = 0;
      
      lineasAlbaranes.forEach(l => {
        if (albaranActual !== l.NUMEROALBARAN) {
          if (albaranActual !== null) {
            console.log(`  Subtotal albarán: ${totalAlbaran.toFixed(2)}€\n`);
          }
          albaranActual = l.NUMEROALBARAN;
          totalAlbaran = 0;
          console.log(`Albarán ${l.NUMEROALBARAN}:`);
        }
        
        const importe = parseFloat(l.IMPORTEVENTA || 0);
        totalAlbaran += importe;
        totalGeneral += importe;
        
        console.log(`  ${l.SECUENCIA}. ${l.DESCRIPCION?.trim()}`);
        console.log(`     ${l.CANTIDADENVASES} env x ${l.CANTIDADUNIDADES} uds - ${importe.toFixed(2)}€`);
      });
      
      if (albaranActual !== null) {
        console.log(`  Subtotal albarán: ${totalAlbaran.toFixed(2)}€\n`);
      }
      
      console.log(`Total base imponible: ${totalGeneral.toFixed(2)}€`);
      console.log(`Con IVA 10%: ${(totalGeneral * 1.10).toFixed(2)}€`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
  }
}

analizarEstructuraFacturas();
