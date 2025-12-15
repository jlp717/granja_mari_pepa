// Script para probar generación de PDF con una factura real
require('dotenv').config();
const databaseService = require('./app/services/databaseService');
const pdfService = require('./app/services/pdfService');
const fs = require('fs');
const path = require('path');

async function testGenerarPDF() {
  console.log('\n=== TEST DE GENERACIÓN DE PDF ===\n');
  
  try {
    // Inicializar pool
    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('Pool inicializado\n');
    
    // Parámetros de un albarán real que está facturado
    const params = {
      subempresa: 'GMP',
      ejercicio: 2019,
      serie: 'P',
      terminal: 3,
      numero_albaran: 31
    };
    
    console.log('Obteniendo datos de la factura...');
    console.log(`  Subempresa: ${params.subempresa}`);
    console.log(`  Ejercicio: ${params.ejercicio}`);
    console.log(`  Serie: ${params.serie}`);
    console.log(`  Terminal: ${params.terminal}`);
    console.log(`  Número: ${params.numero_albaran}\n`);
    
    const datosFactura = await databaseService.obtenerDatosFactura(params);
    
    if (!datosFactura) {
      console.log('❌ No se encontró la factura');
      process.exit(1);
    }
    
    console.log('✓ Datos obtenidos:');
    console.log(`  Cliente: ${datosFactura.cliente.nombre}`);
    console.log(`  Líneas: ${datosFactura.lineas.length}`);
    console.log(`  Total: €${datosFactura.totales.totalFactura}\n`);
    
    console.log('Generando PDF...');
    const pdfBuffer = await pdfService.generarFacturaPDF(datosFactura);
    
    console.log(`✓ PDF generado: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);
    
    // Guardar PDF con timestamp para evitar conflictos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, `factura_test_${timestamp}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log(`✅ PDF guardado en: ${outputPath}`);
    
    // Cerrar pool
    await pool.close();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

testGenerarPDF();
