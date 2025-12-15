// Script para buscar una factura que exista en la BD
require('dotenv').config();

async function buscarFacturaReal() {
  console.log('\n=== BUSCANDO FACTURA REAL ===\n');
  
  try {
    const pool = require('./app/config/odbcConfig');
    await pool.initialize();
    console.log('Pool inicializado\n');
    
    // Buscar un albarán facturado de cualquier cliente
    const sql = `
      SELECT
        SUBEMPRESAALBARAN,
        EJERCICIOALBARAN,
        SERIEALBARAN,
        TERMINALALBARAN,
        NUMEROALBARAN,
        CODIGOCLIENTEFACTURA,
        CODIGOTIPOALBARAN,
        SUBEMPRESAFACTURA,
        EJERCICIOFACTURA,
        SERIEFACTURA,
        NUMEROFACTURA,
        IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE NUMEROALBARAN > 0
        AND NUMEROFACTURA > 0
        AND CODIGOTIPOALBARAN = 'P'
      FETCH FIRST 1 ROWS ONLY
    `;
    
    const result = await pool.query(sql, []);
    
    if (result && result.length > 0) {
      const factura = result[0];
      console.log('✅ Albarán/Factura encontrada:');
      console.log('\n   📦 ALBARÁN (lo que necesitamos para generar PDF):');
      console.log('      Subempresa:', factura.SUBEMPRESAALBARAN);
      console.log('      Ejercicio:', factura.EJERCICIOALBARAN);
      console.log('      Serie:', factura.SERIEALBARAN);
      console.log('      Terminal:', factura.TERMINALALBARAN);
      console.log('      Número:', factura.NUMEROALBARAN);
      console.log('      Tipo:', factura.CODIGOTIPOALBARAN);
      console.log('\n   📄 FACTURA (solo referencia):');
      console.log('      Serie:', factura.SERIEFACTURA);
      console.log('      Número:', factura.NUMEROFACTURA);
      console.log('      Total:', factura.IMPORTETOTAL);
      console.log('\n📋 Usar estos parámetros en test-generar-pdf.js:');
      console.log(`   subempresa: '${factura.SUBEMPRESAALBARAN.trim()}'`);
      console.log(`   ejercicio: ${factura.EJERCICIOALBARAN}`);
      console.log(`   serie: '${factura.SERIEALBARAN.trim()}'`);
      console.log(`   terminal: ${factura.TERMINALALBARAN}`);
      console.log(`   numero_albaran: ${factura.NUMEROALBARAN}`);
    } else {
      console.log('❌ No se encontraron facturas');
    }
    
    await pool.close();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
  
  process.exit(0);
}

buscarFacturaReal();
