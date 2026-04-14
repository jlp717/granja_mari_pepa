/**
 * DIAGNÓSTICO FINAL - DSED.LACLAE y DSEDAC.LAC
 * ================================================
 * Consulta directa las tablas/vistas que el usuario necesita verificar
 * 
 * node scripts/diagnostic-final.js
 */

const odbc = require('odbc');

async function main() {
  console.log('=== DIAGNÓSTICO FINAL: DSED.LACLAE + DSEDAC.LAC ===\n');

  const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
  
  let conn;
  try {
    console.log('Conectando...');
    conn = await odbc.connect(connectionString);
    console.log('✅ Conexión OK\n');
  } catch (err) {
    console.error('❌ Error conectando:', err.message);
    process.exit(1);
  }

  try {
    // ════════════════════════════════════════════════════════════
    // 1. DSED.LACLAE - Ver si el cliente 32679 existe y sus datos
    // ════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. DSED.LACLAE - Datos del cliente 4300032679');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
      const sql_laclae = `
        SELECT 
          TRIM(LCCL) AS CODIGO_CLIENTE,
          LCNCL AS NOMBRE,
          LCDOPO AS DIRECCION,
          LCPOBL AS POBLACION,
          LCPROV AS PROVINCIA,
          LCYEAB AS ANO
        FROM DSED.LACLAE 
        WHERE TRIM(LCCL) = '4300032679'
      `;
      
      const rows = await conn.query(sql_laclae);
      if (rows.length === 0) {
        console.log('  ❌ NO existe cliente 4300032679 en DSED.LACLAE\n');
      } else {
        console.log(`  ✅ Cliente encontrado (${rows.length} registro(s)):\n`);
        rows.forEach(r => {
          console.log(`  Código: ${r.CODIGO_CLIENTE}`);
          console.log(`  Nombre: ${r.NOMBRE}`);
          console.log(`  Dirección: ${r.DIRECCION || '(vacío)'}`);
          console.log(`  Población: ${r.POBLACION || '(vacío)'}`);
          console.log(`  Provincia: ${r.PROVINCIA || '(vacío)'}`);
          console.log(`  Año: ${r.ANO}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log(`  ⚠️ ERROR: ${err.message}\n`);
    }

    // ════════════════════════════════════════════════════════════
    // 2. DSEDAC.LAC - Todas las líneas con albarán S-303
    // ════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('2. DSEDAC.LAC - Líneas con albarán S-303/2026');
    console.log('═══════════════════════════════════════════════════════════');
    
    const sql_lac = `
      SELECT 
        TRIM(SUBEMPRESAALBARAN) AS SUBEMPRESA,
        EJERCICIOALBARAN AS EJERCICIO,
        TRIM(SERIEALBARAN) AS SERIE,
        TERMINALALBARAN AS TERMINAL,
        NUMEROALBARAN AS NUMERO,
        TRIM(CODIGOARTICULO) AS ARTICULO,
        TRIM(DESCRIPCION) AS DESCRIPCION,
        CANTIDADENVASES AS CAJAS,
        CANTIDADUNIDADES AS UNIDADES,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA
      FROM DSEDAC.LAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
      ORDER BY CODIGOARTICULO
    `;
    
    try {
      const lac_rows = await conn.query(sql_lac);
      if (lac_rows.length === 0) {
        console.log('  ❌ NO hay líneas en DSEDAC.LAC para albarán S-303/2026\n');
      } else {
        console.log(`  ✅ ${lac_rows.length} línea(s) encontrada(s):\n`);
        lac_rows.forEach((r, i) => {
          console.log(`  Línea ${i + 1}:`);
          console.log(`  Albarán: ${r.SUBEMPRESA}-${r.EJERCICIO}-${r.SERIE}-${r.TERMINAL}-${r.NUMERO}`);
          console.log(`  Artículo: ${r.ARTICULO} - ${r.DESCRIPCION.substring(0, 40)}`);
          console.log(`  Cajas: ${r.CAJAS}, Unidades: ${r.UNIDADES}`);
          console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
          console.log(`  ¿Es 32679? ${r.CLI_FACTURA === '4300032679' ? 'SÍ ❌' : 'NO ✅'}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log(`  ⚠️ ERROR: ${err.message}\n`);
    }

    // ════════════════════════════════════════════════════════════
    // 3. DSED.LACLAE - ¿Tiene el albarán S-303 el cliente 32679?
    // ════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('3. DSED.LACLAE - ¿Existe referencia al albarán S-303?');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
      // Primero ver columnas disponibles en LACLAE
      const sql_cols = `
        SELECT COLUMN_NAME 
        FROM QSYS2.SYSCOLUMNS 
        WHERE TABLE_SCHEMA = 'DSED' 
          AND TABLE_NAME = 'LACLAE'
        ORDER BY ORDINAL_POSITION
      `;
      
      console.log('  Columnas en DSED.LACLAE:');
      const cols = await conn.query(sql_cols);
      const col_names = cols.map(c => c.COLUMN_NAME);
      console.log(`  ${col_names.join(', ')}\n`);
      
      // Buscar si hay columnas de albarán/serie/número
      const alb_cols = col_names.filter(c => 
        c.includes('SERIE') || 
        c.includes('ALBARAN') || 
        c.includes('FACTURA') ||
        c.includes('NUMERO') ||
        c.includes('TERMINAL') ||
        c.includes('SUBEMPRESA')
      );
      
      if (alb_cols.length > 0) {
        console.log(`  Columnas de albarán/factura encontradas: ${alb_cols.join(', ')}`);
        
        // Construir consulta con esas columnas
        const select_cols = alb_cols.map(c => `TRIM(${c}) AS ${c}`).join(', ');
        const sql_alb = `
          SELECT ${select_cols}
          FROM DSED.LACLAE 
          WHERE TRIM(LCCL) = '4300032679'
        `;
        
        const alb_rows = await conn.query(sql_alb);
        if (alb_rows.length === 0) {
          console.log('  ❌ No hay registros de albarán para cliente 32679\n');
        } else {
          console.log(`  ✅ ${alb_rows.length} registro(s):\n`);
          alb_rows.forEach((r, i) => {
            console.log(`  Registro ${i + 1}:`);
            alb_cols.forEach(col => {
              console.log(`    ${col}: ${r[col] || '(vacío)'}`);
            });
            console.log('');
          });
        }
      } else {
        console.log('  ℹ️  DSED.LACLAE NO tiene columnas de albarán/factura');
        console.log('  (Es solo una vista de clientes, no de documentos)\n');
      }
    } catch (err) {
      console.log(`  ⚠️ ERROR: ${err.message}\n`);
    }

    // ════════════════════════════════════════════════════════════
    // 4. DSEDAC.CAC - Confirmar factura S-1166 y albarán S-303
    // ════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('4. DSEDAC.CAC - Factura S-1166 completa');
    console.log('═══════════════════════════════════════════════════════════');
    
    const sql_cac = `
      SELECT 
        TRIM(SUBEMPRESAALBARAN) AS SUBEMPRESA,
        EJERCICIOALBARAN AS EJERCICIO_ALB,
        TRIM(SERIEALBARAN) AS SERIE_ALB,
        TERMINALALBARAN AS TERMINAL_ALB,
        NUMEROALBARAN AS NUMERO_ALB,
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA AS NUMERO_FACT,
        EJERCICIOFACTURA AS EJERCICIO_FACT,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN,
        DIAFACTURA AS DIA,
        MESFACTURA AS MES,
        ANOFACTURA AS ANO,
        IMPORTECOBRADOPENDIENTE AS IMPORTE
      FROM DSEDAC.CAC 
      WHERE TRIM(SERIEFACTURA) = 'S' 
        AND NUMEROFACTURA = 1166
        AND EJERCICIOFACTURA = 2026
    `;
    
    try {
      const cac_rows = await conn.query(sql_cac);
      if (cac_rows.length === 0) {
        console.log('  ❌ NO existe factura S-1166/2026 en CAC\n');
      } else {
        console.log(`  ✅ ${cac_rows.length} registro(s):\n`);
        cac_rows.forEach(r => {
          console.log(`  Albarán: ${r.SUBEMPRESA}-${r.EJERCICIO_ALB}-${r.SERIE_ALB}-${r.TERMINAL_ALB}-${r.NUMERO_ALB}`);
          console.log(`  Factura: ${r.SERIE_FACT}-${r.NUMERO_FACT} (${r.EJERCICIO_FACT})`);
          console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
          console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
          console.log(`  Fecha: ${r.DIA}/${r.MES}/${r.ANO}`);
          console.log(`  Importe Pendiente: ${r.IMPORTE}`);
          console.log(`  ¿CLI_FACTURA es CONTADO? ${r.CLI_FACTURA === '4300005000' ? 'SÍ → usa CLI_ALBARAN' : 'NO'}`);
          console.log(`  ¿CLI_ALBARAN es 32679? ${r.CLI_ALBARAN === '4300032679' ? 'SÍ ❌ → APARECE EN PANAMAR' : 'NO ✅'}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log(`  ⚠️ ERROR: ${err.message}\n`);
    }

    // ════════════════════════════════════════════════════════════
    // 5. DSEDAC.CAC - ¿A qué facturas está el albarán S-303?
    // ════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('5. DSEDAC.CAC - ¿A qué facturas pertenece el albarán S-303?');
    console.log('═══════════════════════════════════════════════════════════');
    
    const sql_s303 = `
      SELECT 
        TRIM(SERIEFACTURA) AS SERIE_FACT,
        NUMEROFACTURA AS NUMERO_FACT,
        EJERCICIOFACTURA AS EJERCICIO_FACT,
        TRIM(CODIGOCLIENTEFACTURA) AS CLI_FACTURA,
        TRIM(CODIGOCLIENTEALBARAN) AS CLI_ALBARAN
      FROM DSEDAC.CAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
      ORDER BY NUMEROFACTURA
    `;
    
    try {
      const s303_rows = await conn.query(sql_s303);
      if (s303_rows.length === 0) {
        console.log('  ❌ El albarán S-303 NO está en ninguna factura\n');
      } else {
        console.log(`  ✅ El albarán S-303 está en ${s303_rows.length} factura(s):\n`);
        s303_rows.forEach(r => {
          console.log(`  Factura: ${r.SERIE_FACT}-${r.NUMERO_FACT} (${r.EJERCICIO_FACT})`);
          console.log(`  Cliente Factura: ${r.CLI_FACTURA}`);
          console.log(`  Cliente Albarán: ${r.CLI_ALBARAN}`);
          console.log(`  ¿Afecta a 32679? ${r.CLI_ALBARAN === '4300032679' ? 'SÍ ❌' : 'NO ✅'}`);
          console.log('');
        });
      }
    } catch (err) {
      console.log(`  ⚠️ ERROR: ${err.message}\n`);
    }

  } catch (err) {
    console.error('❌ Error general:', err.message);
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log('✅ Conexión cerrada');
      } catch (_) {}
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('FIN DIAGNÓSTICO');
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(0);
}

main();
