// Script para investigar tipos de facturas y estructura
require('dotenv').config();
const odbc = require('odbc');

async function investigarTiposFacturas() {
  console.log('\n=== INVESTIGACIÓN DE TIPOS DE FACTURAS ===\n');
  
  const connectionString = process.env.ODBC_CONNECTION_STRING;
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✓ Conexión establecida\n');
    
    // 1. Ver los diferentes tipos de albarán/factura
    console.log('1. TIPOS DE DOCUMENTO (CODIGOTIPOALBARAN):\n');
    const tipos = await connection.query(`
      SELECT DISTINCT CODIGOTIPOALBARAN, COUNT(*) as CANTIDAD
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
      GROUP BY CODIGOTIPOALBARAN
      ORDER BY CANTIDAD DESC
    `);
    
    tipos.forEach(tipo => {
      console.log(`  ${tipo.CODIGOTIPOALBARAN.padEnd(10)} - ${tipo.CANTIDAD} facturas`);
    });
    
    // 2. Ver las series de factura
    console.log('\n2. SERIES DE FACTURA:\n');
    const series = await connection.query(`
      SELECT DISTINCT SERIEFACTURA, COUNT(*) as CANTIDAD
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
      GROUP BY SERIEFACTURA
      ORDER BY CANTIDAD DESC
    `);
    
    series.forEach(serie => {
      console.log(`  Serie ${serie.SERIEFACTURA.padEnd(5)} - ${serie.CANTIDAD} facturas`);
    });
    
    // 3. Obtener ejemplos de cada tipo
    console.log('\n3. EJEMPLOS DE CADA TIPO:\n');
    
    for (const tipo of tipos.slice(0, 3)) {
      console.log(`\n--- TIPO: ${tipo.CODIGOTIPOALBARAN} ---`);
      const ejemplo = await connection.query(`
        SELECT 
          SUBEMPRESAFACTURA,
          EJERCICIOFACTURA,
          SERIEFACTURA,
          TERMINALFACTURA,
          NUMEROFACTURA,
          NUMEROALBARAN,
          CODIGOTIPOALBARAN,
          CODIGOCLIENTEFACTURA,
          IMPORTETOTAL,
          OBSERVACIONES
        FROM DSEDAC.CAC
        WHERE CODIGOTIPOALBARAN = '${tipo.CODIGOTIPOALBARAN.trim()}'
          AND NUMEROFACTURA > 0
        FETCH FIRST 1 ROWS ONLY
      `);
      
      if (ejemplo.length > 0) {
        const e = ejemplo[0];
        console.log(`  Factura: ${e.SERIEFACTURA}-${e.NUMEROFACTURA}`);
        console.log(`  Albarán: ${e.NUMEROALBARAN}`);
        console.log(`  Cliente: ${e.CODIGOCLIENTEFACTURA}`);
        console.log(`  Total: €${e.IMPORTETOTAL}`);
        console.log(`  Observaciones: ${e.OBSERVACIONES ? e.OBSERVACIONES.trim() : 'N/A'}`);
      }
    }
    
    // 4. Ver información de la empresa
    console.log('\n4. INFORMACIÓN DE LA EMPRESA (desde .env):\n');
    console.log(`  Nombre: ${process.env.EMPRESA_NOMBRE}`);
    console.log(`  CIF: ${process.env.EMPRESA_CIF}`);
    console.log(`  Registro: ${process.env.EMPRESA_REGISTRO}`);
    console.log(`  Dirección: ${process.env.EMPRESA_DIRECCION}`);
    console.log(`  CP/Población: ${process.env.EMPRESA_CP} ${process.env.EMPRESA_POBLACION}`);
    console.log(`  Provincia: ${process.env.EMPRESA_PROVINCIA}`);
    console.log(`  Teléfono: ${process.env.EMPRESA_TELEFONO}`);
    console.log(`  Email: ${process.env.EMPRESA_EMAIL}`);
    console.log(`  Web: ${process.env.EMPRESA_WEB}`);
    
    // 5. Obtener una factura completa con todas sus líneas para análisis
    console.log('\n5. ESTRUCTURA COMPLETA DE UNA FACTURA:\n');
    const facturaCompleta = await connection.query(`
      SELECT *
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA > 0
      FETCH FIRST 1 ROWS ONLY
    `);
    
    if (facturaCompleta.length > 0) {
      const factura = facturaCompleta[0];
      console.log('Campos clave de la factura:');
      console.log(`  - Subempresa: ${factura.SUBEMPRESAFACTURA}`);
      console.log(`  - Ejercicio: ${factura.EJERCICIOFACTURA}`);
      console.log(`  - Serie: ${factura.SERIEFACTURA}`);
      console.log(`  - Terminal: ${factura.TERMINALFACTURA}`);
      console.log(`  - Número Factura: ${factura.NUMEROFACTURA}`);
      console.log(`  - Número Albarán: ${factura.NUMEROALBARAN}`);
      console.log(`  - Fecha Factura: ${factura.DIAFACTURA}/${factura.MESFACTURA}/${factura.ANOFACTURA}`);
      console.log(`  - Cliente Factura: ${factura.CODIGOCLIENTEFACTURA}`);
      console.log(`  - Tipo: ${factura.CODIGOTIPOALBARAN}`);
      console.log(`  - Base Imponible 1: €${factura.IMPORTEBASEIMPONIBLE1}`);
      console.log(`  - IVA 1 (${factura.PORCENTAJEIVA1}%): €${factura.IMPORTEIVA1}`);
      console.log(`  - Base Imponible 2: €${factura.IMPORTEBASEIMPONIBLE2}`);
      console.log(`  - IVA 2 (${factura.PORCENTAJEIVA2}%): €${factura.IMPORTEIVA2}`);
      console.log(`  - Base Imponible 3: €${factura.IMPORTEBASEIMPONIBLE3}`);
      console.log(`  - IVA 3 (${factura.PORCENTAJEIVA3}%): €${factura.IMPORTEIVA3}`);
      console.log(`  - Total: €${factura.IMPORTETOTAL}`);
    }
    
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n\nConexión cerrada.');
    }
  }
}

investigarTiposFacturas();
