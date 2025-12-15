// Script para analizar 3 clientes reales con sus facturas
require('dotenv').config();

async function analizarClientes() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS EXHAUSTIVO DE CLIENTES Y SUS FACTURAS          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // ==============================================================
    // 1. OBTENER 3 CLIENTES DIFERENTES CON FACTURAS
    // ==============================================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. BUSCANDO 3 CLIENTES CON FACTURAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const sqlClientes = `
      SELECT DISTINCT
        CLI.CODIGOCLIENTE,
        CLI.NOMBRECLIENTE,
        CLI.NIF,
        CLI.DIRECCION,
        CLI.CODIGOPOSTAL,
        CLI.POBLACION,
        CLI.PROVINCIA,
        CLI.TELEFONO1,
        COUNT(DISTINCT CAC.NUMEROFACTURA) as TOTAL_FACTURAS
      FROM DSEDAC.CLI AS CLI
      INNER JOIN DSEDAC.CAC AS CAC 
        ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE CAC.NUMEROFACTURA > 0
        AND CAC.CODIGOCLIENTEFACTURA IS NOT NULL
      GROUP BY 
        CLI.CODIGOCLIENTE,
        CLI.NOMBRECLIENTE,
        CLI.NIF,
        CLI.DIRECCION,
        CLI.CODIGOPOSTAL,
        CLI.POBLACION,
        CLI.PROVINCIA,
        CLI.TELEFONO1
      HAVING COUNT(DISTINCT CAC.NUMEROFACTURA) > 0
      ORDER BY TOTAL_FACTURAS DESC
      FETCH FIRST 3 ROWS ONLY
    `;

    console.log('📊 Fuente de datos: Tablas CLI (clientes) JOIN CAC (facturas)');
    console.log('📍 Esquema: DSEDAC');
    console.log('🔍 Criterio: Clientes con mayor número de facturas\n');

    const clientes = await pool.query(sqlClientes, []);

    if (!clientes || clientes.length === 0) {
      console.log('❌ No se encontraron clientes con facturas');
      await pool.close();
      process.exit(1);
    }

    console.log(`✓ Se encontraron ${clientes.length} clientes\n`);

    // ==============================================================
    // 2. ANALIZAR CADA CLIENTE EN DETALLE
    // ==============================================================
    for (let i = 0; i < clientes.length; i++) {
      const cliente = clientes[i];
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log(`CLIENTE ${i + 1} DE 3`);
      console.log('═══════════════════════════════════════════════════════════\n');

      console.log('📋 DATOS DEL CLIENTE:');
      console.log(`   Código: ${cliente.CODIGOCLIENTE}`);
      console.log(`   Nombre: ${cliente.NOMBRECLIENTE}`);
      console.log(`   NIF: ${cliente.NIF || 'N/A'}`);
      console.log(`   Dirección: ${cliente.DIRECCION || 'N/A'}`);
      console.log(`   CP: ${cliente.CODIGOPOSTAL || 'N/A'}`);
      console.log(`   Población: ${cliente.POBLACION || 'N/A'}`);
      console.log(`   Provincia: ${cliente.PROVINCIA || 'N/A'}`);
      console.log(`   Teléfono: ${cliente.TELEFONO1 || 'N/A'}`);
      console.log(`   Total facturas: ${cliente.TOTAL_FACTURAS}\n`);

      // Obtener facturas del cliente
      const sqlFacturas = `
        SELECT 
          CAC.SUBEMPRESAFACTURA,
          CAC.EJERCICIOFACTURA,
          CAC.SERIEFACTURA,
          CAC.TERMINALFACTURA,
          CAC.NUMEROFACTURA,
          CAC.SUBEMPRESAALBARAN,
          CAC.EJERCICIOALBARAN,
          CAC.SERIEALBARAN,
          CAC.TERMINALALBARAN,
          CAC.NUMEROALBARAN,
          CAC.CODIGOTIPOALBARAN,
          CAC.DIADOCUMENTO,
          CAC.MESDOCUMENTO,
          CAC.ANODOCUMENTO,
          CAC.IMPORTEBASEIMPONIBLE1,
          CAC.PORCENTAJEIVA1,
          CAC.IMPORTEIVA1,
          CAC.IMPORTEBASEIMPONIBLE2,
          CAC.PORCENTAJEIVA2,
          CAC.IMPORTEIVA2,
          CAC.IMPORTEBASEIMPONIBLE3,
          CAC.PORCENTAJEIVA3,
          CAC.IMPORTEIVA3,
          CAC.IMPORTETOTAL,
          CAC.CODIGOFORMAPAGO
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${cliente.CODIGOCLIENTE.trim()}'
          AND NUMEROFACTURA > 0
          AND NUMEROALBARAN > 0
        ORDER BY EJERCICIOFACTURA DESC, NUMEROFACTURA DESC
        FETCH FIRST 5 ROWS ONLY
      `;

      console.log('📄 FACTURAS DEL CLIENTE (últimas 5):');
      console.log('   Fuente: Tabla DSEDAC.CAC (Cabecera de albaranes/facturas)\n');

      const facturas = await pool.query(sqlFacturas, []);

      if (facturas && facturas.length > 0) {
        facturas.forEach((fac, idx) => {
          const fecha = `${String(fac.DIADOCUMENTO).padStart(2, '0')}/${String(fac.MESDOCUMENTO).padStart(2, '0')}/${fac.ANODOCUMENTO}`;
          const serieNum = `${fac.SERIEFACTURA || ''} ${fac.NUMEROFACTURA || ''}`;
          
          console.log(`   ${idx + 1}. Factura: ${serieNum.trim()}`);
          console.log(`      📅 Fecha: ${fecha}`);
          console.log(`      🏷️  Tipo: ${fac.CODIGOTIPOALBARAN || 'N/A'}`);
          console.log(`      📦 Albarán: ${fac.SERIEALBARAN}-${fac.EJERCICIOALBARAN}-${fac.TERMINALALBARAN}-${fac.NUMEROALBARAN}`);
          console.log(`      💰 Base Imponible:`);
          
          let totalBase = 0;
          let totalIVA = 0;
          
          if (fac.IMPORTEBASEIMPONIBLE1 > 0) {
            totalBase += fac.IMPORTEBASEIMPONIBLE1;
            totalIVA += fac.IMPORTEIVA1 || 0;
            console.log(`         - Base 1: €${fac.IMPORTEBASEIMPONIBLE1.toFixed(2)} (IVA ${fac.PORCENTAJEIVA1}% = €${(fac.IMPORTEIVA1 || 0).toFixed(2)})`);
          }
          if (fac.IMPORTEBASEIMPONIBLE2 > 0) {
            totalBase += fac.IMPORTEBASEIMPONIBLE2;
            totalIVA += fac.IMPORTEIVA2 || 0;
            console.log(`         - Base 2: €${fac.IMPORTEBASEIMPONIBLE2.toFixed(2)} (IVA ${fac.PORCENTAJEIVA2}% = €${(fac.IMPORTEIVA2 || 0).toFixed(2)})`);
          }
          if (fac.IMPORTEBASEIMPONIBLE3 > 0) {
            totalBase += fac.IMPORTEBASEIMPONIBLE3;
            totalIVA += fac.IMPORTEIVA3 || 0;
            console.log(`         - Base 3: €${fac.IMPORTEBASEIMPONIBLE3.toFixed(2)} (IVA ${fac.PORCENTAJEIVA3}% = €${(fac.IMPORTEIVA3 || 0).toFixed(2)})`);
          }
          
          console.log(`      📊 Total Base: €${totalBase.toFixed(2)}`);
          console.log(`      💵 Total IVA: €${totalIVA.toFixed(2)}`);
          console.log(`      🎯 TOTAL FACTURA: €${(fac.IMPORTETOTAL || 0).toFixed(2)}`);
          console.log(`      💳 Forma Pago: ${fac.CODIGOFORMAPAGO || 'N/A'}\n`);
        });

        // Seleccionar una factura para análisis detallado
        const facturaDetalle = facturas[0];
        
        console.log('   ╔═══════════════════════════════════════════════════════╗');
        console.log('   ║  ANÁLISIS DETALLADO DE LA PRIMERA FACTURA            ║');
        console.log('   ╚═══════════════════════════════════════════════════════╝\n');

        // Obtener líneas de la factura
        const sqlLineas = `
          SELECT 
            LAC.SECUENCIA,
            LAC.TIPOLINEA,
            LAC.CODIGOLOTE,
            LAC.CODIGOARTICULO,
            LAC.DESCRIPCION,
            LAC.CANTIDADENVASES,
            LAC.CANTIDADUNIDADES,
            LAC.PRECIOVENTA,
            LAC.PORCENTAJEDESCUENTO,
            LAC.IMPORTEVENTA,
            LAC.CODIGOIVA
          FROM DSEDAC.LAC
          WHERE SUBEMPRESAALBARAN = '${facturaDetalle.SUBEMPRESAALBARAN}'
            AND EJERCICIOALBARAN = ${facturaDetalle.EJERCICIOALBARAN}
            AND SERIEALBARAN = '${facturaDetalle.SERIEALBARAN}'
            AND TERMINALALBARAN = ${facturaDetalle.TERMINALALBARAN}
            AND NUMEROALBARAN = ${facturaDetalle.NUMEROALBARAN}
          ORDER BY SECUENCIA
        `;

        console.log('   📦 Fuente de líneas: Tabla DSEDAC.LAC (Líneas de albaranes)\n');

        const lineas = await pool.query(sqlLineas, []);

        console.log(`   ✓ Líneas encontradas: ${lineas.length}\n`);

        if (lineas && lineas.length > 0) {
          console.log('   PRIMERAS 10 LÍNEAS:\n');
          
          lineas.slice(0, 10).forEach((linea, idx) => {
            console.log(`   ${idx + 1}. ${linea.TIPOLINEA === 'T' ? '[TEXTO]' : '[PRODUCTO]'}`);
            console.log(`      Descripción: ${linea.DESCRIPCION || 'N/A'}`);
            
            if (linea.TIPOLINEA !== 'T') {
              console.log(`      Lote: ${linea.CODIGOLOTE || 'N/A'}`);
              console.log(`      Ref: ${linea.CODIGOARTICULO || 'N/A'}`);
              console.log(`      Cajas: ${linea.CANTIDADENVASES || 0}`);
              console.log(`      Unidades: ${linea.CANTIDADUNIDADES || 0}`);
              console.log(`      Precio: €${(linea.PRECIOVENTA || 0).toFixed(5)}`);
              console.log(`      Descuento: ${linea.PORCENTAJEDESCUENTO || 0}%`);
              console.log(`      Importe: €${(linea.IMPORTEVENTA || 0).toFixed(2)}`);
              console.log(`      IVA: ${linea.CODIGOIVA || 'N/A'}`);
            }
            console.log('');
          });

          // Calcular totales de las líneas
          let totalLineas = 0;
          lineas.forEach(linea => {
            if (linea.TIPOLINEA !== 'T') {
              totalLineas += linea.IMPORTEVENTA || 0;
            }
          });

          console.log(`   💰 Total calculado de líneas: €${totalLineas.toFixed(2)}`);
          console.log(`   📊 Total en cabecera CAC: €${(facturaDetalle.IMPORTETOTAL || 0).toFixed(2)}`);
          
          const diferencia = Math.abs(totalLineas - (facturaDetalle.IMPORTETOTAL || 0));
          if (diferencia < 0.01) {
            console.log('   ✅ Los totales coinciden correctamente\n');
          } else {
            console.log(`   ⚠️  Diferencia: €${diferencia.toFixed(2)} (puede ser por redondeo o descuentos globales)\n`);
          }
        }

        // Datos para testing en la web
        console.log('   ╔═══════════════════════════════════════════════════════╗');
        console.log('   ║  DATOS PARA VERIFICAR EN LA WEB                      ║');
        console.log('   ╚═══════════════════════════════════════════════════════╝\n');
        
        console.log('   🔐 LOGIN:');
        console.log(`      Código Cliente: ${cliente.CODIGOCLIENTE}`);
        console.log(`      NIF: ${cliente.NIF || 'Consultar en CLI_AUTH'}\n`);
        
        console.log('   📄 ESTA FACTURA DEBE APARECER EN EL LISTADO:');
        console.log(`      Serie: ${facturaDetalle.SERIEFACTURA}`);
        console.log(`      Número: ${facturaDetalle.NUMEROFACTURA}`);
        console.log(`      Fecha: ${String(facturaDetalle.DIADOCUMENTO).padStart(2, '0')}/${String(facturaDetalle.MESDOCUMENTO).padStart(2, '0')}/${facturaDetalle.ANODOCUMENTO}`);
        console.log(`      Total: €${(facturaDetalle.IMPORTETOTAL || 0).toFixed(2)}\n`);
        
        console.log('   🔍 AL DESCARGAR PDF, VERIFICAR:');
        console.log(`      - Número de líneas: ${lineas.length}`);
        console.log(`      - Total factura: €${(facturaDetalle.IMPORTETOTAL || 0).toFixed(2)}`);
        console.log(`      - Bases imponibles correctas`);
        console.log(`      - IVA desglosado correctamente`);
        console.log(`      - Productos con precios y descuentos\n`);

      } else {
        console.log('   ⚠️ No se encontraron facturas para este cliente\n');
      }
    }

    // ==============================================================
    // 3. RESUMEN FINAL
    // ==============================================================
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('RESUMEN Y PRÓXIMOS PASOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Análisis completado\n');
    console.log('📝 PARA VERIFICAR EN LA WEB:\n');
    console.log('1. Iniciar sesión con cada uno de los 3 clientes');
    console.log('2. Verificar que aparezcan todas las facturas listadas');
    console.log('3. Descargar el PDF de la primera factura de cada uno');
    console.log('4. Comparar los datos del PDF con los mostrados arriba\n');
    console.log('🔍 CAMPOS A VERIFICAR:\n');
    console.log('   - Nombre y dirección del cliente');
    console.log('   - Número y fecha de factura');
    console.log('   - Líneas de productos (descripción, cantidades, precios)');
    console.log('   - Descuentos aplicados');
    console.log('   - Bases imponibles y IVA');
    console.log('   - Total factura');
    console.log('   - Forma de pago\n');

    await pool.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

analizarClientes();
