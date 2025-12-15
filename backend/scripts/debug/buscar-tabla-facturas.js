require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const poolInstance = require('../app/config/odbcConfig');

async function buscarTablaFacturas() {
  try {
    await poolInstance.initialize();
    
    console.log('=== BUSCANDO TABLA DE FACTURAS ===\n');

    // Buscar en CVC (Cabeceras de Vencimientos de Cobro)
    console.log('1. Consultando CVC para factura 2098...\n');
    
    const cvc = await poolInstance.query(`
      SELECT *
      FROM DSEDAC.CVC
      WHERE NUMERODOCUMENTO = 2098
        AND SERIEDOCUMENTO = 'F'
        AND SUBEMPRESADOCUMENTO = 'GMP'
    `);

    if (cvc.length > 0) {
      console.log(`Encontrada en CVC: ${cvc.length} registro(s)\n`);
      cvc.forEach(c => {
        console.log('Datos de CVC:');
        console.log(`  Número: ${c.SERIEDOCUMENTO}-${c.NUMERODOCUMENTO}`);
        console.log(`  Fecha: ${c.DIADOCUMENTO}/${c.MESDOCUMENTO}/${c.ANODOCUMENTO}`);
        console.log(`  Importe total: ${c.IMPORTETOTAL}`);
        console.log(`  Importe pendiente: ${c.IMPORTEPENDIENTE}`);
        console.log(`  Cliente: ${c.CODIGOCLIENTE?.trim()}`);
        console.log();
      });
    } else {
      console.log('No encontrada en CVC\n');
    }

    // Buscar si existe una tabla FVC (Facturas de Ventas a Clientes) o similar
    console.log('2. Intentando encontrar tabla de facturas...\n');
    
    try {
      const tablas = await poolInstance.query(`
        SELECT TABLE_NAME
        FROM QSYS2.SYSTABLES
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND TABLE_NAME LIKE '%FAC%'
          OR TABLE_NAME LIKE '%FVC%'
          OR TABLE_NAME = 'CVC'
        ORDER BY TABLE_NAME
      `);
      
      console.log('Tablas encontradas relacionadas con facturas:');
      tablas.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
    } catch (e) {
      console.log('No se pudo consultar el catálogo de tablas');
    }

    // Verificar los totales en CAC para la factura 2098
    console.log('\n3. Totales en CAC agrupados por factura...\n');
    
    const totalesCac = await poolInstance.query(`
      SELECT
        SERIEFACTURA,
        NUMEROFACTURA,
        MIN(NUMEROALBARAN) as PRIMER_ALBARAN,
        MAX(NUMEROALBARAN) as ULTIMO_ALBARAN,
        COUNT(DISTINCT NUMEROALBARAN) as NUM_ALBARANES,
        MAX(DIADOCUMENTO) || '/' || MAX(MESDOCUMENTO) || '/' || MAX(ANODOCUMENTO) as FECHA,
        -- Cada registro en CAC es un albarán
        SUM(IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + 
            IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) as BASE_TOTAL,
        SUM(IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) as IVA_TOTAL,
        SUM(IMPORTETOTAL) as TOTAL_SUMADO
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      GROUP BY SERIEFACTURA, NUMEROFACTURA
    `);

    totalesCac.forEach(t => {
      console.log('Datos en CAC agrupados:');
      console.log(`  Factura: ${t.SERIEFACTURA}-${t.NUMEROFACTURA}`);
      console.log(`  Fecha: ${t.FECHA}`);
      console.log(`  Albaranes: ${t.PRIMER_ALBARAN} a ${t.ULTIMO_ALBARAN} (${t.NUM_ALBARANES} total)`);
      console.log(`  Base: ${t.BASE_TOTAL}€`);
      console.log(`  IVA: ${t.IVA_TOTAL}€`);
      console.log(`  Total: ${t.TOTAL_SUMADO}€`);
    });

    // Ver cada registro individual de CAC
    console.log('\n4. Registros individuales en CAC...\n');
    
    const registrosCac = await poolInstance.query(`
      SELECT
        NUMEROALBARAN,
        DIADOCUMENTO || '/' || MESDOCUMENTO || '/' || ANODOCUMENTO as FECHA,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEIVA1,
        IMPORTETOTAL,
        SITUACIONALBARAN
      FROM DSEDAC.CAC
      WHERE NUMEROFACTURA = 2098
        AND SERIEFACTURA = 'F'
        AND TRIM(CODIGOCLIENTEFACTURA) = '4300008091'
      ORDER BY NUMEROALBARAN
    `);

    registrosCac.forEach(r => {
      console.log(`Albarán ${r.NUMEROALBARAN} (${r.FECHA}):`);
      console.log(`  Situación: ${r.SITUACIONALBARAN}`);
      console.log(`  Base: ${r.IMPORTEBASEIMPONIBLE1}€, IVA: ${r.IMPORTEIVA1}€`);
      console.log(`  Total: ${r.IMPORTETOTAL}€`);
    });

    console.log('\n=== CONCLUSIÓN ===');
    console.log('Si CVC tiene el importe correcto, úsalo.');
    console.log('Si no, la factura debería mostrar el total del PRIMER albarán (MIN),');
    console.log('no la SUMA de todos los albaranes.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await poolInstance.close();
  }
}

buscarTablaFacturas();
