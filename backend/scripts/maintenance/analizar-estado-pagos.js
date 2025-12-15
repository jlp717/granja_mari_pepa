/**
 * Script de Diagnóstico: Estado de Pagos en Facturas
 *
 * Analiza el campo IMPORTECOBRADOPENDIENTE en la tabla CAC
 * para verificar la lógica del estado de pago (pagada/pendiente)
 */

const dbService = require('../../app/services/databaseService');
const logger = require('../../config/logger');

async function analizarEstadoPagos() {
  const connection = await dbService.getConnection();

  try {
    console.log('\n========================================');
    console.log('📊 ANÁLISIS DE ESTADO DE PAGOS');
    console.log('========================================\n');

    // Análisis 1: Distribución de estados de pago
    console.log('1️⃣  DISTRIBUCIÓN DE ESTADOS DE PAGO\n');

    const distribucion = await connection.query(`
      SELECT
        CASE
          WHEN IMPORTECOBRADOPENDIENTE IS NULL THEN 'NULL'
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'PAGADA (0)'
          WHEN IMPORTECOBRADOPENDIENTE > 0 THEN 'PENDIENTE (>0)'
          ELSE 'OTRO'
        END AS ESTADO,
        COUNT(*) AS CANTIDAD,
        AVG(IMPORTETOTAL) AS PROMEDIO_TOTAL
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0 AND NUMEROALBARAN > 0
      GROUP BY CASE
          WHEN IMPORTECOBRADOPENDIENTE IS NULL THEN 'NULL'
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'PAGADA (0)'
          WHEN IMPORTECOBRADOPENDIENTE > 0 THEN 'PENDIENTE (>0)'
          ELSE 'OTRO'
        END
      ORDER BY CANTIDAD DESC
    `);

    console.log('Estado                | Cantidad   | Promedio Total');
    console.log('-'.repeat(60));
    distribucion.forEach(row => {
      console.log(
        `${row.ESTADO.padEnd(20)} | ${String(row.CANTIDAD).padEnd(10)} | €${parseFloat(row.PROMEDIO_TOTAL || 0).toFixed(2)}`
      );
    });

    // Análisis 2: Ejemplos de facturas con cada estado
    console.log('\n\n2️⃣  EJEMPLOS DE FACTURAS POR ESTADO\n');

    // Facturas pagadas (IMPORTECOBRADOPENDIENTE = 0)
    const pagadas = await connection.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        IMPORTETOTAL,
        IMPORTECOBRADOPENDIENTE,
        CODIGOFORMAPAGO,
        ANODOCUMENTO,
        MESDOCUMENTO
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND IMPORTECOBRADOPENDIENTE = 0
      ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC
      FETCH FIRST 5 ROWS ONLY
    `);

    console.log('✅ FACTURAS PAGADAS (Importe Pendiente = 0):');
    console.log('-'.repeat(80));
    if (pagadas.length > 0) {
      pagadas.forEach(f => {
        console.log(
          `Factura ${f.SERIEFACTURA?.trim() || ''} ${f.NUMEROFACTURA} | ` +
          `Total: €${parseFloat(f.IMPORTETOTAL || 0).toFixed(2)} | ` +
          `Pendiente: €${parseFloat(f.IMPORTECOBRADOPENDIENTE || 0).toFixed(2)} | ` +
          `FormaPago: ${f.CODIGOFORMAPAGO?.trim() || 'N/A'} | ` +
          `Fecha: ${f.MESDOCUMENTO}/${f.ANODOCUMENTO}`
        );
      });
    } else {
      console.log('❌ No se encontraron facturas con importe pendiente = 0');
    }

    // Facturas pendientes (IMPORTECOBRADOPENDIENTE > 0)
    const pendientes = await connection.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        IMPORTETOTAL,
        IMPORTECOBRADOPENDIENTE,
        CODIGOFORMAPAGO,
        ANODOCUMENTO,
        MESDOCUMENTO
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND IMPORTECOBRADOPENDIENTE > 0
      ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC
      FETCH FIRST 5 ROWS ONLY
    `);

    console.log('\n⏳ FACTURAS PENDIENTES (Importe Pendiente > 0):');
    console.log('-'.repeat(80));
    if (pendientes.length > 0) {
      pendientes.forEach(f => {
        console.log(
          `Factura ${f.SERIEFACTURA?.trim() || ''} ${f.NUMEROFACTURA} | ` +
          `Total: €${parseFloat(f.IMPORTETOTAL || 0).toFixed(2)} | ` +
          `Pendiente: €${parseFloat(f.IMPORTECOBRADOPENDIENTE || 0).toFixed(2)} | ` +
          `FormaPago: ${f.CODIGOFORMAPAGO?.trim() || 'N/A'} | ` +
          `Fecha: ${f.MESDOCUMENTO}/${f.ANODOCUMENTO}`
        );
      });
    } else {
      console.log('✅ No se encontraron facturas con importe pendiente > 0');
    }

    // Análisis 3: Relación entre Total e Importe Pendiente
    console.log('\n\n3️⃣  RELACIÓN TOTAL vs PENDIENTE\n');

    const relacion = await connection.query(`
      SELECT
        CASE
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'Pendiente = 0'
          WHEN IMPORTECOBRADOPENDIENTE = IMPORTETOTAL THEN 'Pendiente = Total'
          WHEN IMPORTECOBRADOPENDIENTE < IMPORTETOTAL THEN 'Pendiente < Total (Pago parcial)'
          WHEN IMPORTECOBRADOPENDIENTE > IMPORTETOTAL THEN 'Pendiente > Total (ERROR)'
          ELSE 'Otro caso'
        END AS RELACION,
        COUNT(*) AS CANTIDAD
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND IMPORTETOTAL > 0
      GROUP BY CASE
          WHEN IMPORTECOBRADOPENDIENTE = 0 THEN 'Pendiente = 0'
          WHEN IMPORTECOBRADOPENDIENTE = IMPORTETOTAL THEN 'Pendiente = Total'
          WHEN IMPORTECOBRADOPENDIENTE < IMPORTETOTAL THEN 'Pendiente < Total (Pago parcial)'
          WHEN IMPORTECOBRADOPENDIENTE > IMPORTETOTAL THEN 'Pendiente > Total (ERROR)'
          ELSE 'Otro caso'
        END
      ORDER BY CANTIDAD DESC
    `);

    console.log('Relación                              | Cantidad');
    console.log('-'.repeat(60));
    relacion.forEach(row => {
      console.log(`${row.RELACION.padEnd(40)} | ${row.CANTIDAD}`);
    });

    // Análisis 4: Facturas con total €0.00
    console.log('\n\n4️⃣  FACTURAS CON TOTAL €0.00\n');

    const totalCero = await connection.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        IMPORTETOTAL,
        IMPORTECOBRADOPENDIENTE,
        ANODOCUMENTO,
        MESDOCUMENTO
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
        AND IMPORTETOTAL = 0
      ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC
      FETCH FIRST 10 ROWS ONLY
    `);

    if (totalCero.length > 0) {
      console.log(`Se encontraron ${totalCero.length} facturas con total €0.00:\n`);
      totalCero.forEach(f => {
        console.log(
          `Factura ${f.SERIEFACTURA?.trim() || ''} ${f.NUMEROFACTURA} | ` +
          `Total: €${parseFloat(f.IMPORTETOTAL || 0).toFixed(2)} | ` +
          `Pendiente: €${parseFloat(f.IMPORTECOBRADOPENDIENTE || 0).toFixed(2)}`
        );
      });
    } else {
      console.log('✅ No se encontraron facturas con total €0.00');
    }

    console.log('\n\n========================================');
    console.log('✅ ANÁLISIS COMPLETADO');
    console.log('========================================\n');

    console.log('📝 CONCLUSIONES:\n');
    console.log('1. La lógica actual es: IMPORTECOBRADOPENDIENTE = 0 → PAGADA');
    console.log('2. Si la mayoría de facturas tienen pendiente > 0, esto es el comportamiento esperado');
    console.log('3. Si deberían estar pagadas pero tienen pendiente > 0, hay que actualizar los datos en DB2');
    console.log('4. El sistema ERP debe actualizar IMPORTECOBRADOPENDIENTE cuando se registra un pago\n');

  } catch (error) {
    console.error('❌ Error en análisis:', error);
    logger.error('Error en análisis de estado de pagos:', error);
  } finally {
    await dbService.closeConnection(connection);
    process.exit(0);
  }
}

// Ejecutar análisis
analizarEstadoPagos();
