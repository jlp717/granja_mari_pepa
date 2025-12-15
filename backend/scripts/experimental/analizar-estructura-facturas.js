/**
 * Script de análisis: Estructura completa de datos de facturas
 * Para entender exactamente qué campos tenemos disponibles
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function analizarEstructuraFacturas() {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ANÁLISIS COMPLETO DE ESTRUCTURA DE FACTURAS               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('✓ Pool inicializado\n');

    // Obtener UNA factura con TODOS los campos
    console.log('📊 CONSULTANDO TODOS LOS CAMPOS DE LA TABLA CAC:\n');

    const queryFactura = `
      SELECT *
      FROM DSEDAC.CAC
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND NUMEROFACTURA > 0
        AND NUMEROALBARAN > 0
      ORDER BY EJERCICIOALBARAN DESC
      FETCH FIRST 1 ROWS ONLY
    `;

    const facturas = await pool.query(queryFactura);

    if (facturas.length === 0) {
      console.log('❌ No se encontraron facturas\n');
      return;
    }

    const factura = facturas[0];

    console.log('✅ TODOS LOS CAMPOS DISPONIBLES EN CAC:\n');
    
    // Agrupar campos por categoría
    const categorias = {
      'IDENTIFICACIÓN ALBARÁN': [],
      'IDENTIFICACIÓN FACTURA': [],
      'FECHAS Y TIEMPO': [],
      'CLIENTE': [],
      'IMPORTES BASE': [],
      'IMPORTES IVA': [],
      'IMPORTES RECARGO': [],
      'TOTALES': [],
      'FORMAS DE PAGO': [],
      'ESTADO Y CONTROL': [],
      'OTROS': []
    };

    Object.keys(factura).forEach(campo => {
      const valor = factura[campo];
      const valorStr = valor !== null && valor !== undefined ? String(valor).trim() : 'NULL';
      
      // Clasificar campos
      if (campo.includes('ALBARAN')) {
        categorias['IDENTIFICACIÓN ALBARÁN'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('FACTURA')) {
        categorias['IDENTIFICACIÓN FACTURA'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('DIA') || campo.includes('MES') || campo.includes('ANO') || campo.includes('FECHA') || campo.includes('HORA')) {
        categorias['FECHAS Y TIEMPO'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('CLIENTE')) {
        categorias['CLIENTE'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('BASEIMPONIBLE')) {
        categorias['IMPORTES BASE'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('IVA') && !campo.includes('CODIGO')) {
        categorias['IMPORTES IVA'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('RECARGO')) {
        categorias['IMPORTES RECARGO'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('TOTAL') || campo.includes('IMPORTE')) {
        categorias['TOTALES'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('PAGO') || campo.includes('VCTO') || campo.includes('VENCIMIENTO')) {
        categorias['FORMAS DE PAGO'].push(`   ${campo}: ${valorStr}`);
      } else if (campo.includes('ESTADO') || campo.includes('MARCA') || campo.includes('FLAG') || campo.includes('ANULADO') || campo.includes('PENDIENTE')) {
        categorias['ESTADO Y CONTROL'].push(`   ${campo}: ${valorStr}`);
      } else {
        categorias['OTROS'].push(`   ${campo}: ${valorStr}`);
      }
    });

    // Imprimir por categorías
    Object.entries(categorias).forEach(([categoria, campos]) => {
      if (campos.length > 0) {
        console.log(`\n📌 ${categoria}:`);
        campos.forEach(campo => console.log(campo));
      }
    });

    // Consultar tabla de formas de pago
    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  TABLA DE FORMAS DE PAGO (FPG)                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const codigoFormaPago = factura.CODIGOFORMAPAGO;
    console.log(`Código de forma de pago en factura: ${codigoFormaPago}\n`);

    const queryFormaPago = `
      SELECT *
      FROM DSEDAC.FPG
      WHERE CODIGOFORMAPAGO = '${codigoFormaPago}'
    `;

    const formasPago = await pool.query(queryFormaPago);

    if (formasPago.length > 0) {
      const fp = formasPago[0];
      console.log('✅ CAMPOS EN TABLA FPG:');
      Object.entries(fp).forEach(([campo, valor]) => {
        const valorStr = valor !== null && valor !== undefined ? String(valor).trim() : 'NULL';
        console.log(`   ${campo}: ${valorStr}`);
      });
    }

    // Listar todas las formas de pago disponibles
    console.log('\n\n📋 TODAS LAS FORMAS DE PAGO DISPONIBLES:\n');

    const queryTodasFormasPago = `
      SELECT CODIGOFORMAPAGO, DESCRIPCION
      FROM DSEDAC.FPG
      ORDER BY CODIGOFORMAPAGO
      FETCH FIRST 20 ROWS ONLY
    `;

    const todasFormas = await pool.query(queryTodasFormasPago);
    todasFormas.forEach(f => {
      console.log(`   ${f.CODIGOFORMAPAGO.trim()}: ${f.DESCRIPCION.trim()}`);
    });

    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN PARA DESARROLLO                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('📊 CAMPOS CLAVE PARA LA WEB:\n');
    console.log('1. IDENTIFICACIÓN:');
    console.log(`   • Serie Factura: ${factura.SERIEFACTURA?.trim() || 'N/A'}`);
    console.log(`   • Número Factura: ${factura.NUMEROFACTURA || 'N/A'}`);
    console.log(`   • Serie Albarán: ${factura.SERIEALBARAN?.trim() || 'N/A'}`);
    console.log(`   • Número Albarán: ${factura.NUMEROALBARAN || 'N/A'}\n`);

    console.log('2. FECHAS:');
    console.log(`   • Día: ${factura.DIADOCUMENTO || 'N/A'}`);
    console.log(`   • Mes: ${factura.MESDOCUMENTO || 'N/A'}`);
    console.log(`   • Año: ${factura.ANODOCUMENTO || 'N/A'}`);
    console.log(`   • Fecha Vencimiento: ${factura.FECHAVENCIMIENTO || 'N/A'}\n`);

    console.log('3. ESTADO Y PAGO:');
    console.log(`   • Código Forma Pago: ${factura.CODIGOFORMAPAGO?.trim() || 'N/A'}`);
    console.log(`   • Descripción: ${formasPago[0]?.DESCRIPCION?.trim() || 'N/A'}`);
    console.log(`   • Estado Factura: ${factura.ESTADOFACTURA || 'N/A'}`);
    console.log(`   • Pendiente Cobro: ${factura.IMPORTEPENDIENTECOBRO || 'N/A'}\n`);

    console.log('4. IMPORTES:');
    console.log(`   • Total Factura: €${factura.IMPORTETOTAL?.toFixed(2) || '0.00'}`);
    console.log(`   • Base Imponible: €${(factura.IMPORTEBASEIMPONIBLE1 || 0).toFixed(2)}`);
    console.log(`   • IVA: €${(factura.IMPORTEIVA1 || 0).toFixed(2)}\n`);

    await pool.close();
    console.log('✓ Pool cerrado\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

analizarEstructuraFacturas().catch(console.error);
