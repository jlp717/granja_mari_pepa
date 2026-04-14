/**
 * DIAGNÓSTICO RÁPIDO - Albarán S-303 y Cliente 4300032679 (BAR EL TONEL)
 * ========================================================================
 * Verificar si el albarán S-303 está asociado al cliente 4300032679
 * en DSEDAC.CAC y DSED.LACLAE
 * 
 * node scripts/diagnostic-s303-quick.js
 */

const odbc = require('odbc');

async function main() {
  console.log('=== DIAGNÓSTICO RÁPIDO: Albarán S-303, Cliente 4300032679 ===\n');

  const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
  
  let conn;
  try {
    console.log('Conectando a la base de datos...');
    conn = await odbc.connect(connectionString);
    console.log('✅ Conexión establecida\n');
  } catch (err) {
    console.error('❌ Error conectando:', err.message);
    process.exit(1);
  }

  try {
    // 1. Ver albarán S-303 en CAC
    console.log('--- 1. Albarán S-303 en DSEDAC.CAC ---');
    const sql1 = `
      SELECT 
        TRIM(SERIEALBARAN) AS SERIE_ALB,
        NUMEROALBARAN,
        EJERCICIOALBARAN,
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN
      FROM DSEDAC.CAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
    `;
    
    const rows1 = await conn.query(sql1);
    if (rows1.length === 0) {
      console.log('  ❌ NO se encontró el albarán S-303/2026 en CAC');
    } else {
      console.log(`  ✅ Encontrados ${rows1.length} registro(s):`);
      rows1.forEach(r => {
        console.log(`  Factura: ${r.SERIE_FACT}-${r.NUMEROFACTURA} (${r.EJERCICIOFACTURA})`);
        console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
        console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
        console.log(`  ¿Es cliente 32679? ${r.CLI_FACTURA === '4300032679' || r.CLI_ALBARAN === '4300032679' ? 'SÍ ❌' : 'NO ✅'}`);
        console.log('');
      });
    }

    // 2. Ver factura S-1166 para cliente 32679
    console.log('\n--- 2. Factura S-1166 para cliente 4300032679 ---');
    const sql2 = `
      SELECT 
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        TRIM(SERIEALBARAN) AS SERIE_ALB,
        NUMEROALBARAN,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN
      FROM DSEDAC.CAC 
      WHERE TRIM(SERIEFACTURA) = 'S' 
        AND NUMEROFACTURA = 1166
        AND EJERCICIOFACTURA = 2026
        AND (TRIM(CODIGOCLIENTEFACTURA) = '4300032679' 
             OR TRIM(CODIGOCLIENTEALBARAN) = '4300032679')
    `;
    
    const rows2 = await conn.query(sql2);
    if (rows2.length === 0) {
      console.log('  ✅ NO existe factura S-1166 para cliente 32679');
    } else {
      console.log(`  ❌ Existen ${rows2.length} registro(s) de S-1166 para cliente 32679:`);
      rows2.forEach(r => {
        console.log(`  Albarán: ${r.SERIE_ALB}-${r.NUMEROALBARAN}`);
        console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
        console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
        console.log('');
      });
    }

    // 3. Ver cliente en DSED.LACLAE
    console.log('\n--- 3. Cliente 4300032679 en DSED.LACLAE ---');
    const sql3 = `
      SELECT 
        TRIM(LCCL) AS CLIENTE,
        LCNCL AS NOMBRE
      FROM DSED.LACLAE 
      WHERE TRIM(LCCL) = '4300032679'
    `;
    
    try {
      const rows3 = await conn.query(sql3);
      if (rows3.length === 0) {
        console.log('  ❌ NO existe cliente 32679 en DSED.LACLAE');
      } else {
        console.log(`  ✅ Cliente encontrado: ${rows3[0].NOMBRE}`);
      }
    } catch (err) {
      console.log(`  ⚠️ Error consultando DSED.LACLAE: ${err.message}`);
    }

    // 4. Todos los albaranes del cliente 32679 que generan facturas
    console.log('\n--- 4. Facturas del cliente 4300032679 (últimas 20) ---');
    const sql4 = `
      SELECT 
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        TRIM(SERIEALBARAN) AS SERIE_ALB,
        NUMEROALBARAN,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN
      FROM DSEDAC.CAC 
      WHERE TRIM(CODIGOCLIENTEFACTURA) = '4300032679' 
         OR TRIM(CODIGOCLIENTEALBARAN) = '4300032679'
      ORDER BY EJERCICIOFACTURA DESC, NUMEROFACTURA DESC
      FETCH FIRST 20 ROWS ONLY
    `;
    
    const rows4 = await conn.query(sql4);
    if (rows4.length === 0) {
      console.log('  ❌ NO hay facturas para cliente 32679');
    } else {
      console.log(`  Últimas 20 facturas:`);
      rows4.forEach(r => {
        const albaran = `${r.SERIE_ALB}-${r.NUMEROALBARAN}`;
        const factura = `${r.SERIE_FACT}-${r.NUMEROFACTURA}`;
        console.log(`  ${factura} (${r.EJERCICIOFACTURA}) <- Albarán ${albaran}`);
      });
    }

  } catch (err) {
    console.error('❌ Error en consulta:', err.message);
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log('\n✅ Conexión cerrada');
      } catch (_) {}
    }
  }

  console.log('\n=== FIN DIAGNÓSTICO ===');
  process.exit(0);
}

main();
