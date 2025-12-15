/**
 * Script de Diagnóstico: Cliente P_33 (Código: 4300000281, NIF: X2731828H)
 *
 * Analiza en detalle el estado de las facturas de este cliente específico
 * para entender por qué aparecen como pendientes
 */

const dbService = require('../../app/services/databaseService');
const logger = require('../../config/logger');

async function analizarClienteP33() {
  const connection = await dbService.getConnection();

  try {
    console.log('\n========================================');
    console.log('🔍 ANÁLISIS DETALLADO - CLIENTE P_33');
    console.log('========================================\n');

    const codigoCliente = 'P_33';
    const nif = 'X2731828H';

    // 1. Verificar existencia del cliente
    console.log('1️⃣  VERIFICACIÓN DE CLIENTE\n');

    const cliente = await connection.query(`
      SELECT
        TRIM(CODIGOCLIENTE) as CODIGO,
        TRIM(NOMBRECLIENTE) as NOMBRE,
        TRIM(NIFCLIENTE) as NIF,
        TRIM(TELEFONO1) as TELEFONO,
        TRIM(TELEFONO2) as EMAIL
      FROM DSEDAC.CLI
      WHERE TRIM(CODIGOCLIENTE) = ?
      FETCH FIRST 1 ROWS ONLY
    `, [codigoCliente]);

    if (cliente.length === 0) {
      console.log(`❌ Cliente ${codigoCliente} NO encontrado en la tabla CLI`);
      return;
    }

    console.log('✅ Cliente encontrado:');
    console.log(`   Código: ${cliente[0].CODIGO}`);
    console.log(`   Nombre: ${cliente[0].NOMBRE}`);
    console.log(`   NIF: ${cliente[0].NIF}`);
    console.log(`   Teléfono: ${cliente[0].TELEFONO || 'N/A'}`);
    console.log(`   Email: ${cliente[0].EMAIL || 'N/A'}`);

    // 2. Analizar facturas de 2024
    console.log('\n\n2️⃣  FACTURAS DE 2024\n');

    const facturas2024 = await connection.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        ANODOCUMENTO,
        MESDOCUMENTO,
        DIADOCUMENTO,
        IMPORTETOTAL,
        IMPORTECOBRADOPENDIENTE,
        IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5 as TOTAL_BASE,
        IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5 as TOTAL_IVA,
        CODIGOFORMAPAGO,
        CODIGOTIPOALBARAN
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND ANODOCUMENTO = 2024
      ORDER BY MESDOCUMENTO DESC, DIADOCUMENTO DESC
    `, [codigoCliente]);

    console.log(`Total de facturas en 2024: ${facturas2024.length}\n`);

    if (facturas2024.length > 0) {
      console.log('Detalle de facturas:');
      console.log('-'.repeat(120));
      console.log('Factura       | Fecha      | Total Factura | Importe Pendiente | Estado Actual | Forma Pago');
      console.log('-'.repeat(120));

      facturas2024.forEach(f => {
        const serie = (f.SERIEFACTURA || '').trim();
        const numero = f.NUMEROFACTURA || 0;
        const fecha = `${String(f.DIADOCUMENTO).padStart(2, '0')}/${String(f.MESDOCUMENTO).padStart(2, '0')}/${f.ANODOCUMENTO}`;
        const total = parseFloat(f.IMPORTETOTAL) || 0;
        const pendiente = parseFloat(f.IMPORTECOBRADOPENDIENTE) || 0;
        const estado = pendiente === 0 ? 'PAGADA' : 'PENDIENTE';
        const formaPago = (f.CODIGOFORMAPAGO || '').trim();

        console.log(
          `${serie} ${String(numero).padStart(5, '0')}    | ${fecha} | €${total.toFixed(2).padStart(12)} | €${pendiente.toFixed(2).padStart(16)} | ${estado.padEnd(13)} | ${formaPago}`
        );
      });
    }

    // 3. Estadísticas de estado de pago
    console.log('\n\n3️⃣  ESTADÍSTICAS DE ESTADO DE PAGO\n');

    const estadisticas = await connection.query(`
      SELECT
        CASE
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'PAGADA'
          WHEN IMPORTECOBRADOPENDIENTE = IMPORTETOTAL THEN 'PENDIENTE TOTAL'
          WHEN IMPORTECOBRADOPENDIENTE < IMPORTETOTAL THEN 'PAGO PARCIAL'
          ELSE 'OTRO'
        END AS ESTADO,
        COUNT(*) AS CANTIDAD,
        SUM(IMPORTETOTAL) AS SUMA_TOTAL,
        SUM(IMPORTECOBRADOPENDIENTE) AS SUMA_PENDIENTE
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND ANODOCUMENTO = 2024
      GROUP BY CASE
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'PAGADA'
          WHEN IMPORTECOBRADOPENDIENTE = IMPORTETOTAL THEN 'PENDIENTE TOTAL'
          WHEN IMPORTECOBRADOPENDIENTE < IMPORTETOTAL THEN 'PAGO PARCIAL'
          ELSE 'OTRO'
        END
    `, [codigoCliente]);

    console.log('Estado           | Cantidad | Total Facturado | Total Pendiente');
    console.log('-'.repeat(70));
    estadisticas.forEach(row => {
      console.log(
        `${row.ESTADO.padEnd(16)} | ${String(row.CANTIDAD).padStart(8)} | €${parseFloat(row.SUMA_TOTAL || 0).toFixed(2).padStart(14)} | €${parseFloat(row.SUMA_PENDIENTE || 0).toFixed(2).padStart(14)}`
      );
    });

    // 4. Análisis de formas de pago
    console.log('\n\n4️⃣  FORMAS DE PAGO UTILIZADAS\n');

    const formasPago = await connection.query(`
      SELECT
        CODIGOFORMAPAGO,
        COUNT(*) AS CANTIDAD,
        SUM(IMPORTETOTAL) AS TOTAL,
        AVG(IMPORTECOBRADOPENDIENTE) AS PROMEDIO_PENDIENTE
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = ?
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND ANODOCUMENTO = 2024
      GROUP BY CODIGOFORMAPAGO
    `, [codigoCliente]);

    console.log('Forma de Pago | Cantidad | Total      | Promedio Pendiente');
    console.log('-'.repeat(60));
    formasPago.forEach(row => {
      const formaPago = (row.CODIGOFORMAPAGO || 'N/A').trim();
      console.log(
        `${formaPago.padEnd(13)} | ${String(row.CANTIDAD).padStart(8)} | €${parseFloat(row.TOTAL || 0).toFixed(2).padStart(9)} | €${parseFloat(row.PROMEDIO_PENDIENTE || 0).toFixed(2).padStart(17)}`
      );
    });

    // 5. Verificar si hay pagos registrados en otra tabla
    console.log('\n\n5️⃣  BÚSQUEDA DE TABLA DE PAGOS/COBROS\n');

    try {
      // Intentar encontrar tablas relacionadas con cobros
      const tablasCobros = await connection.query(`
        SELECT TABLE_NAME, TABLE_TEXT
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND (TABLE_NAME LIKE '%COB%' OR TABLE_NAME LIKE '%PAG%' OR TABLE_NAME LIKE '%REC%')
        ORDER BY TABLE_NAME
      `);

      if (tablasCobros.length > 0) {
        console.log('Tablas encontradas relacionadas con cobros/pagos:');
        tablasCobros.forEach(t => {
          console.log(`   - ${t.TABLE_NAME}: ${t.TABLE_TEXT || 'Sin descripción'}`);
        });
      } else {
        console.log('❌ No se encontraron tablas específicas de cobros/pagos');
        console.log('   El campo IMPORTECOBRADOPENDIENTE en CAC es la única referencia');
      }
    } catch (error) {
      console.log('⚠️  No se pudo consultar el catálogo de tablas');
    }

    // 6. Recomendaciones
    console.log('\n\n6️⃣  ANÁLISIS Y RECOMENDACIONES\n');
    console.log('📋 CONCLUSIONES:');
    console.log('-'.repeat(80));

    const totalFacturas = facturas2024.length;
    const pagadas = facturas2024.filter(f => parseFloat(f.IMPORTECOBRADOPENDIENTE || 0) === 0).length;
    const pendientes = totalFacturas - pagadas;

    console.log(`   ✓ Total de facturas 2024: ${totalFacturas}`);
    console.log(`   ✓ Facturas pagadas: ${pagadas} (${((pagadas/totalFacturas)*100).toFixed(1)}%)`);
    console.log(`   ✓ Facturas pendientes: ${pendientes} (${((pendientes/totalFacturas)*100).toFixed(1)}%)`);

    if (pendientes === totalFacturas - 1) {
      console.log('\n   🔍 OBSERVACIÓN: Solo una factura muestra como pagada (la de €0.00)');
      console.log('   Esto sugiere que:');
      console.log('   1. El campo IMPORTECOBRADOPENDIENTE NO se actualiza automáticamente');
      console.log('   2. Las facturas nacen con IMPORTETOTAL = IMPORTECOBRADOPENDIENTE');
      console.log('   3. El sistema ERP debe actualizar manualmente este campo al registrar pagos');
      console.log('   4. Es posible que los pagos estén en otra tabla (MPV, COB, etc.)');
    }

    console.log('\n   💡 RECOMENDACIONES:');
    console.log('   1. Verificar con el administrador del ERP si existe tabla de cobros/pagos');
    console.log('   2. Consultar documentación del ERP sobre actualización de IMPORTECOBRADOPENDIENTE');
    console.log('   3. Si el campo no se actualiza, considerar lógica alternativa:');
    console.log('      - Buscar en tabla de cobros/vencimientos');
    console.log('      - Usar fecha de vencimiento + días transcurridos');
    console.log('      - Permitir actualización manual del estado desde el dashboard');

    console.log('\n========================================');
    console.log('✅ ANÁLISIS COMPLETADO');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    logger.error('Error analizando cliente P_33:', error);
  } finally {
    await dbService.closeConnection(connection);
    process.exit(0);
  }
}

// Ejecutar análisis
analizarClienteP33();
