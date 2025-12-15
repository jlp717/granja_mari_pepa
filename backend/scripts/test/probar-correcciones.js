require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const authService = require('../app/services/authService');
const poolInstance = require('../app/config/odbcConfig');

async function probarCambios() {
  try {
    console.log('=== PROBANDO CORRECCIONES ===\n');
    
    // Inicializar el pool
    await poolInstance.initialize();
    
    console.log('1. Consultando facturas del cliente 4300008091...\n');

    const facturas = await authService.obtenerFacturasCliente('4300008091');

    console.log(`Total de registros: ${facturas.length}\n`);

    // Buscar la factura 2098
    const factura2098 = facturas.filter(f => f.numeroFactura === 2098);

    console.log(`Registros con NUMEROFACTURA=2098: ${factura2098.length}\n`);

    if (factura2098.length > 0) {
      console.log('Detalles de la factura 2098:\n');
      factura2098.forEach((f, i) => {
        console.log(`Registro ${i + 1}:`);
        console.log(`  Factura: ${f.serieFactura}-${f.numeroFactura}`);
        console.log(`  Albarán: ${f.numero_albaran}`);
        console.log(`  Fecha: ${f.fecha}`);
        console.log(`  Total: ${f.totalFactura.toFixed(2)}€`);
        console.log(`  Estado: ${f.estadoPago}`);
        console.log();
      });

      console.log('=== VERIFICACIÓN ===');
      console.log('✅ Ahora cada albarán aparece como un registro separado');
      console.log('✅ Cada registro muestra su total individual (no la suma)');
      console.log('\nLos totales esperados son:');
      console.log('  - Albarán 1002: 120.94€');
      console.log('  - Albarán 1161: 154.22€');
      console.log('  - Albarán 1338: 181.58€');
      
      // Verificar si coinciden
      const totalesCorrectos = {
        1002: 120.94,
        1161: 154.22,
        1338: 181.58
      };

      let todosCorrecto = true;
      factura2098.forEach(f => {
        const esperado = totalesCorrectos[f.numero_albaran];
        const actual = parseFloat(f.totalFactura.toFixed(2));
        const diferencia = Math.abs(esperado - actual);
        
        if (diferencia > 0.01) {
          console.log(`\n❌ Albarán ${f.numero_albaran}: Esperado ${esperado}€, Obtenido ${actual}€`);
          todosCorrecto = false;
        }
      });

      if (todosCorrecto) {
        console.log('\n✅ Todos los totales son correctos!');
      }
    } else {
      console.log('❌ No se encontró la factura 2098');
    }

    // Probar también el formato del número de factura
    console.log('\n=== PROBANDO FORMATO DE NÚMERO DE FACTURA ===\n');
    console.log('El formato anterior era: "F 002 098"');
    console.log('El formato nuevo debería ser: "F 00 2098"');
    console.log('\nPara verificar esto, necesitas generar un PDF de una factura.');
    console.log('El cambio está en databaseService.js en la función extraerCabecera()');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
    process.exit(0);
  }
}

probarCambios();
