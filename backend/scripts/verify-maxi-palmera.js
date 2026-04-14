/**
 * VERIFICACIÓN ESPECÍFICA: MAXI PALMERA (7997) en albarán S-303
 * ===============================================================
 * ¿Qué cliente tiene el artículo 7997 del albarán S-303 en LAC?
 * 
 * node scripts/verify-maxi-palmera.js
 */

const odbc = require('odbc');

async function main() {
  console.log('=== MAXI PALMERA (7997) en Albarán S-303 ===\n');

  const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
  
  let conn;
  try {
    conn = await odbc.connect(connectionString);
    console.log('✅ Conexión OK\n');
  } catch (err) {
    console.error('❌ Error conectando:', err.message);
    process.exit(1);
  }

  try {
    // 1. Ver TODAS las líneas de MAXI PALMERA (7997) del albarán S-303
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Líneas de MAXI PALMERA (7997) en albarán S-303/2026');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const sql = `
      SELECT 
        TRIM(SUBEMPRESAALBARAN) AS SUBEMPRESA,
        EJERCICIOALBARAN AS EJERCICIO,
        TRIM(SERIEALBARAN) AS SERIE,
        TERMINALALBARAN AS TERMINAL,
        NUMEROALBARAN AS NUMERO,
        SECUENCIA,
        TRIM(CODIGOARTICULO) AS ARTICULO,
        TRIM(DESCRIPCION) AS DESCRIPCION,
        CANTIDADENVASES AS CAJAS,
        CANTIDADUNIDADES AS UNIDADES,
        PRECIOVENTA,
        PORCENTAJEDESCUENTO AS DTO,
        IMPORTEVENTA AS IMPORTE,
        TRIM(TIPOVENTA) AS TIPO_VENTA,
        TRIM(CODIGOLOTE) AS LOTE,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA
      FROM DSEDAC.LAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
        AND TRIM(CODIGOARTICULO) = '7997'
      ORDER BY SECUENCIA
    `;
    
    const rows = await conn.query(sql);
    
    if (rows.length === 0) {
      console.log('  ❌ NO hay líneas de MAXI PALMERA (7997) en albarán S-303/2026\n');
    } else {
      console.log(`  ✅ ${rows.length} línea(s) de MAXI PALMERA:\n`);
      
      rows.forEach((r, i) => {
        console.log(`  ─── Línea ${i + 1} ───`);
        console.log(`  Artículo: ${r.ARTICULO} - ${r.DESCRIPCION}`);
        console.log(`  Lote: ${r.LOTE || '(sin lote)'}`);
        console.log(`  Cajas: ${r.CAJAS}, Unidades: ${r.UNIDADES}`);
        console.log(`  P. Unit: ${r.PRECIOVENTA} €`);
        console.log(`  Descuento: ${r.DTO}%`);
        console.log(`  Importe: ${r.IMPORTE} €`);
        console.log(`  Tipo Venta: ${r.TIPO_VENTA || '(vacío)'}`);
        console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
        console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
        console.log(`  ¿Cliente Albarán es 32679? ${r.CLI_ALBARAN === '4300032679' ? 'SÍ ❌' : 'NO ✅'}`);
        console.log('');
      });
    }

    // 2. Ver TODAS las líneas del albarán S-303 (sin filtrar por artículo)
    console.log('═══════════════════════════════════════════════════════════');
    console.log('2. TODAS las líneas del albarán S-303/2026 en LAC');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const sql_all = `
      SELECT 
        SECUENCIA,
        TRIM(CODIGOARTICULO) AS ARTICULO,
        TRIM(DESCRIPCION) AS DESCRIPCION,
        CANTIDADENVASES AS CAJAS,
        CANTIDADUNIDADES AS UNIDADES,
        PRECIOVENTA,
        PORCENTAJEDESCUENTO AS DTO,
        IMPORTEVENTA AS IMPORTE,
        TRIM(TIPOVENTA) AS TIPO_VENTA,
        TRIM(CODIGOLOTE) AS LOTE,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA
      FROM DSEDAC.LAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
      ORDER BY SECUENCIA, CODIGOARTICULO
    `;
    
    const all_rows = await conn.query(sql_all);
    
    console.log(`  Total: ${all_rows.length} línea(s):\n`);
    
    all_rows.forEach((r, i) => {
      const es32679 = r.CLI_ALBARAN === '4300032679';
      console.log(`  ${i + 1}. ${r.ARTICULO || '(vacío)'} - ${r.DESCRIPCION.substring(0, 40)}`);
      console.log(`     Cajas: ${r.CAJAS}, Udes: ${r.UNIDADES}, Importe: ${r.IMPORTE} €`);
      console.log(`     Cliente Albarán: ${r.CLI_ALBARAN} ${es32679 ? '← 32679 ❌' : ''}`);
      console.log(`     Cliente Factura: ${r.CLI_FACTURA}`);
      console.log(`     Tipo Venta: ${r.TIPO_VENTA || '(vacío)'}`);
      console.log('');
    });

    // 3. Verificar en CAC la factura S-1166
    console.log('═══════════════════════════════════════════════════════════');
    console.log('3. Factura S-1166 en DSEDAC.CAC');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const sql_cac = `
      SELECT 
        TRIM(SERIEALBARAN) AS SERIE_ALB,
        NUMEROALBARAN AS NUMERO_ALB,
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA AS NUMERO_FACT,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        DIAFACTURA AS DIA,
        MESFACTURA AS MES,
        ANOFACTURA AS ANO
      FROM DSEDAC.CAC 
      WHERE TRIM(SERIEFACTURA) = 'S' 
        AND NUMEROFACTURA = 1166
        AND EJERCICIOFACTURA = 2026
    `;
    
    const cac_rows = await conn.query(sql_cac);
    
    if (cac_rows.length === 0) {
      console.log('  ❌ NO existe factura S-1166/2026 en CAC\n');
    } else {
      console.log(`  ✅ ${cac_rows.length} registro(s):\n`);
      cac_rows.forEach(r => {
        console.log(`  Albarán: ${r.SERIE_ALB}-${r.NUMERO_ALB}`);
        console.log(`  Factura: ${r.SERIE_FACT}-${r.NUMERO_FACT}`);
        console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
        console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
        console.log(`  Fecha: ${r.DIA}/${r.MES}/${r.ANO}`);
        console.log(`  ¿Cliente Albarán es 32679? ${r.CLI_ALBARAN === '4300032679' ? 'SÍ ❌' : 'NO ✅'}`);
        console.log('');
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) {}
    }
  }

  console.log('=== FIN ===');
  process.exit(0);
}

main();
