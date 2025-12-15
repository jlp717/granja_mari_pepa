/**
 * SCRIPT DE INVESTIGACIÓN: Tabla LACLAE
 * ======================================
 * Esquema: DSED
 * Objetivo: Investigar si LACLAE tiene información relevante para facturas o libro de IVA
 */

const odbcPool = require('./app/config/odbcConfig');

async function investigarLACLAE() {
  try {
    console.log('🔍 INVESTIGACIÓN: Tabla LACLAE (esquema DSED)\n');
    console.log('═'.repeat(80));

    const codigoCliente = '4300009900'; // Diego

    // PASO 1: Intentar ver estructura básica de la tabla
    console.log('\n📊 PASO 1: Explorar estructura de LACLAE\n');

    try {
      const queryEstructura = `
        SELECT * FROM DSED.LACLAE
        WHERE ROWNUM <= 5
      `;

      const ejemplos = await odbcPool.query(queryEstructura, []);

      if (ejemplos && ejemplos.length > 0) {
        console.log(`✅ Tabla LACLAE encontrada. Registros de ejemplo: ${ejemplos.length}\n`);
        console.log('Columnas disponibles:');
        console.log('─'.repeat(80));

        const columnas = Object.keys(ejemplos[0]);
        columnas.forEach((col, idx) => {
          console.log(`  ${idx + 1}. ${col}`);
        });

        console.log('\n📋 PRIMER REGISTRO (ejemplo):');
        console.log('─'.repeat(80));
        console.log(JSON.stringify(ejemplos[0], null, 2));

      } else {
        console.log('⚠️  Tabla LACLAE vacía o sin registros');
      }

    } catch (errorEstructura) {
      console.log(`❌ Error accediendo a DSED.LACLAE: ${errorEstructura.message}`);
      console.log('    La tabla podría no existir o no tener permisos de acceso.');

      // Intentar con DSEDAC en lugar de DSED
      console.log('\n🔍 Intentando con DSEDAC.LACLAE...\n');

      try {
        const queryDSEDAC = `
          SELECT * FROM DSEDAC.LACLAE
          WHERE ROWNUM <= 5
        `;

        const ejemplosDSEDAC = await odbcPool.query(queryDSEDAC, []);

        if (ejemplosDSEDAC && ejemplosDSEDAC.length > 0) {
          console.log(`✅ Tabla DSEDAC.LACLAE encontrada. Registros: ${ejemplosDSEDAC.length}\n`);
          console.log('Columnas:');
          Object.keys(ejemplosDSEDAC[0]).forEach((col, idx) => {
            console.log(`  ${idx + 1}. ${col}`);
          });
          console.log('\nPrimer registro:');
          console.log(JSON.stringify(ejemplosDSEDAC[0], null, 2));
        }

      } catch (errorDSEDAC) {
        console.log(`❌ Error con DSEDAC.LACLAE: ${errorDSEDAC.message}`);
      }
    }

    // PASO 2: Buscar registros del cliente Diego
    console.log('\n\n📊 PASO 2: Buscar registros del cliente Diego\n');

    const tablasPosibles = ['DSED.LACLAE', 'DSEDAC.LACLAE'];

    for (const tabla of tablasPosibles) {
      try {
        console.log(`\nIntentando buscar en ${tabla}...`);

        const queryCliente = `
          SELECT * FROM ${tabla}
          WHERE CODIGOCLIENTEFACTURA = ?
             OR TRIM(CODIGOCLIENTEFACTURA) = ?
        `;

        const registros = await odbcPool.query(queryCliente, [codigoCliente, codigoCliente.trim()]);

        if (registros && registros.length > 0) {
          console.log(`✅ Encontrados ${registros.length} registros para cliente ${codigoCliente}\n`);

          console.log('Columnas:');
          Object.keys(registros[0]).forEach((col, idx) => {
            console.log(`  ${idx + 1}. ${col}`);
          });

          console.log('\nPrimer registro:');
          console.log(JSON.stringify(registros[0], null, 2));

          if (registros.length > 1) {
            console.log(`\n... y ${registros.length - 1} registros más`);
          }

          break; // Encontrado, no seguir buscando
        } else {
          console.log(`   No se encontraron registros para cliente ${codigoCliente}`);
        }

      } catch (errorBusqueda) {
        console.log(`   ❌ Error: ${errorBusqueda.message}`);
      }
    }

    // PASO 3: Verificar si existe un campo relacionado con facturas
    console.log('\n\n📊 PASO 3: Buscar referencias a facturas en LACLAE\n');

    for (const tabla of tablasPosibles) {
      try {
        const queryFacturas = `
          SELECT * FROM ${tabla}
          WHERE (SERIEFACTURA IS NOT NULL OR NUMEROFACTURA IS NOT NULL)
            AND ROWNUM <= 10
        `;

        const facturasRef = await odbcPool.query(queryFacturas, []);

        if (facturasRef && facturasRef.length > 0) {
          console.log(`✅ ${tabla} contiene referencias a facturas:`);
          console.log(`   Registros con facturas: ${facturasRef.length} (mostrando máx. 10)\n`);

          facturasRef.forEach((reg, idx) => {
            console.log(`   ${idx + 1}. Serie: ${reg.SERIEFACTURA || 'N/A'}, Número: ${reg.NUMEROFACTURA || 'N/A'}, Cliente: ${reg.CODIGOCLIENTEFACTURA || 'N/A'}`);
          });

          break;
        }

      } catch (errorFacturas) {
        console.log(`   No se pudo consultar facturas en ${tabla}: ${errorFacturas.message}`);
      }
    }

    console.log('\n═'.repeat(80));
    console.log('📌 CONCLUSIÓN:');
    console.log('   Si LACLAE no contiene datos relevantes, usar solo CAC y LAC para facturas');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
investigarLACLAE();
