/**
 * Script de verificación: Obtiene TODAS las facturas de un cliente desde BD
 * Para comparar con el listado que se muestra en la web
 * 
 * Este script permite:
 * 1. Ver el total de facturas de un cliente
 * 2. Detectar duplicados si existen
 * 3. Ver la distribución por años
 * 4. Listar las últimas N facturas para verificación manual
 */

require('dotenv').config();

// ============================================
// CONFIGURACIÓN - CAMBIAR SEGÚN NECESIDAD
// ============================================
const CODIGO_CLIENTE = '4300013449'; // GARCIA DE ALCARAZ MULERO PEDRO
const MOSTRAR_ULTIMAS = 20; // Número de facturas recientes a mostrar

// ============================================

async function verificarFacturasCliente() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICACIÓN DE FACTURAS - CLIENTE VS BASE DE DATOS       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // ===== 1. INFORMACIÓN DEL CLIENTE =====
    console.log('📋 INFORMACIÓN DEL CLIENTE:\n');

    const queryCliente = `
      SELECT 
        CODIGOCLIENTE,
        NOMBRECLIENTE,
        NIF,
        TELEFONO1,
        DIRECCION,
        CODIGOPOSTAL,
        POBLACION,
        PROVINCIA
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE = ?
    `;

    const resultCliente = await pool.query(queryCliente, [CODIGO_CLIENTE]);

    if (resultCliente.length === 0) {
      console.log(`❌ No se encontró el cliente ${CODIGO_CLIENTE}\n`);
      return;
    }

    const cliente = resultCliente[0];
    console.log(`   Código: ${cliente.CODIGOCLIENTE}`);
    console.log(`   Nombre: ${cliente.NOMBRECLIENTE}`);
    console.log(`   NIF: ${cliente.NIF || 'N/A'}`);
    console.log(`   Dirección: ${cliente.DIRECCION || 'N/A'}`);
    console.log(`   CP: ${cliente.CODIGOPOSTAL || 'N/A'} - ${cliente.POBLACION || 'N/A'}`);
    console.log(`   Provincia: ${cliente.PROVINCIA || 'N/A'}\n`);

    // ===== 2. ESTADÍSTICAS GENERALES =====
    console.log('📊 ESTADÍSTICAS DE FACTURAS:\n');

    const queryEstadisticas = `
      SELECT 
        COUNT(*) AS TOTAL_FACTURAS,
        MIN(EJERCICIO) AS PRIMER_EJERCICIO,
        MAX(EJERCICIO) AS ULTIMO_EJERCICIO,
        COUNT(DISTINCT EJERCICIO) AS AÑOS_ACTIVO
      FROM DSEDAC.CAC
      WHERE CODIGOCLIENTE = ?
    `;

    const estadisticas = (await pool.query(queryEstadisticas, [CODIGO_CLIENTE]))[0];

    console.log(`   Total de registros en BD: ${estadisticas.TOTAL_FACTURAS}`);
    console.log(`   Período: ${estadisticas.PRIMER_EJERCICIO} - ${estadisticas.ULTIMO_EJERCICIO} (${estadisticas.AÑOS_ACTIVO} años activos)\n`);

    // ===== 3. DISTRIBUCIÓN POR AÑO =====
    console.log('📅 DISTRIBUCIÓN POR AÑO:\n');

    const queryPorAño = `
      SELECT 
        EJERCICIO,
        COUNT(*) AS TOTAL,
        COUNT(DISTINCT SERIE) AS SERIES_USADAS,
        MIN(NUMEROALBARAN) AS MIN_ALBARAN,
        MAX(NUMEROALBARAN) AS MAX_ALBARAN
      FROM DSEDAC.CAC
      WHERE CODIGOCLIENTE = ?
      GROUP BY EJERCICIO
      ORDER BY EJERCICIO DESC
    `;

    const porAño = await pool.query(queryPorAño, [CODIGO_CLIENTE]);

    porAño.forEach(año => {
      console.log(`   ${año.EJERCICIO}: ${año.TOTAL} facturas (Series: ${año.SERIES_USADAS}, Albaranes: ${año.MIN_ALBARAN}-${año.MAX_ALBARAN})`);
    });
    console.log('');

    // ===== 4. DISTRIBUCIÓN POR SERIE =====
    console.log('📋 DISTRIBUCIÓN POR SERIE:\n');

    const querySeries = `
      SELECT 
        SERIE,
        COUNT(*) AS TOTAL,
        MIN(NUMEROFACTURA) AS PRIMERA_FACTURA,
        MAX(NUMEROFACTURA) AS ULTIMA_FACTURA,
        MIN(EJERCICIO) AS PRIMER_AÑO,
        MAX(EJERCICIO) AS ULTIMO_AÑO
      FROM DSEDAC.CAC
      WHERE CODIGOCLIENTE = ?
      GROUP BY SERIE
      ORDER BY TOTAL DESC
    `;

    const series = await pool.query(querySeries, [CODIGO_CLIENTE]);

    series.forEach(serie => {
      console.log(`   Serie ${serie.SERIE}: ${serie.TOTAL} facturas`);
      console.log(`      Rango: F ${serie.PRIMERA_FACTURA} - F ${serie.ULTIMA_FACTURA}`);
      console.log(`      Período: ${serie.PRIMER_AÑO} - ${serie.ULTIMO_AÑO}\n`);
    });

    // ===== 5. ÚLTIMAS FACTURAS =====
    console.log(`🔍 ÚLTIMAS ${MOSTRAR_ULTIMAS} FACTURAS (ordenadas por fecha descendente):\n`);

    const queryUltimas = `
      SELECT 
        CAC.SUBEMPRESA,
        CAC.EJERCICIO,
        CAC.SERIE,
        CAC.NUMEROALBARAN,
        CAC.NUMEROFACTURA,
        CAC.FECHADDMMYYYY,
        CAC.IMPORTETOTAL,
        CAC.ESTADOFACTURA,
        FPG.DESCRIPCION AS FORMA_PAGO
      FROM DSEDAC.CAC AS CAC
      LEFT JOIN DSEDAC.FPG AS FPG 
        ON CAC.CODIGOFORMAPAGO = FPG.CODIGOFORMAPAGO
      WHERE CAC.CODIGOCLIENTE = ?
      ORDER BY 
        CAC.EJERCICIO DESC,
        CAC.NUMEROALBARAN DESC
      FETCH FIRST ${MOSTRAR_ULTIMAS} ROWS ONLY
    `;

    const ultimas = await pool.query(queryUltimas, [CODIGO_CLIENTE]);

    ultimas.forEach((factura, index) => {
      const albaran = `${factura.SUBEMPRESA}-${factura.EJERCICIO}-${factura.SERIE}-${factura.NUMEROALBARAN}`;
      const total = factura.IMPORTETOTAL ? `€${factura.IMPORTETOTAL.toFixed(2)}` : '€0.00';
      const estado = factura.ESTADOFACTURA || 'N/A';
      const formaPago = factura.FORMA_PAGO ? factura.FORMA_PAGO.trim() : 'N/A';

      console.log(`   ${index + 1}. Factura ${factura.SERIE} ${factura.NUMEROFACTURA}`);
      console.log(`      Albarán: ${albaran}`);
      console.log(`      Fecha: ${factura.FECHADDMMYYYY || 'N/A'}`);
      console.log(`      Total: ${total}`);
      console.log(`      Estado: ${estado} | Forma Pago: ${formaPago}\n`);
    });



    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  PRÓXIMOS PASOS:                                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('1. Iniciar sesión en la web con este cliente');
    console.log('2. Verificar que el número total de facturas coincida');
    console.log('3. Comprobar que las últimas facturas listadas aparezcan en la web');
    console.log('4. Descargar algunos PDFs y verificar los datos\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    const pool = require('./app/config/odbcConfig');
    await pool.close();
    console.log('✓ Pool cerrado\n');
  }
}

// Ejecutar
verificarFacturasCliente().catch(console.error);
