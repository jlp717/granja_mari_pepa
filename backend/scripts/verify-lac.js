/**
 * VERIFICACIÓN PURA EN DSEDAC.LAC
 * ==================================
 * ¿Está el albarán S-303 asociado al cliente 32679 en LAC?
 * 
 * node scripts/verify-lac.js
 */

const odbc = require('odbc');

async function main() {
  console.log('=== VERIFICACIÓN: DSEDAC.LAC - Albarán S-303 vs Cliente 32679 ===\n');

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
    // 1. Ver TODAS las columnas de cliente disponibles en LAC
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Columnas de CLIENTE en DSEDAC.LAC');
    console.log('═══════════════════════════════════════════════════════════');
    
    const sql_cols = `
      SELECT COLUMN_NAME 
      FROM QSYS2.SYSCOLUMNS 
      WHERE TABLE_SCHEMA = 'DSEDAC' 
        AND TABLE_NAME = 'LAC'
        AND (COLUMN_NAME LIKE '%CLIENTE%' OR COLUMN_NAME LIKE '%CODIGOCLI%')
      ORDER BY ORDINAL_POSITION
    `;
    
    const cols = await conn.query(sql_cols);
    console.log(`  Columnas encontradas: ${cols.map(c => c.COLUMN_NAME).join(', ')}\n`);

    // 2. CONSULTA PRINCIPAL: Líneas del albarán S-303 con TODOS los campos de cliente
    console.log('═══════════════════════════════════════════════════════════');
    console.log('2. Líneas del albarán S-303/2026 - TODOS los campos de cliente');
    console.log('═══════════════════════════════════════════════════════════');
    
    const sql_lac = `
      SELECT 
        TRIM(SUBEMPRESAALBARAN) AS SUBEMPRESA,
        EJERCICIOALBARAN AS EJERCICIO,
        TRIM(SERIEALBARAN) AS SERIE,
        TERMINALALBARAN AS TERMINAL,
        NUMEROALBARAN AS NUMERO,
        SECUENCIA,
        TRIM(CODIGOARTICULO) AS ARTICULO,
        TRIM(DESCRIPCION) AS DESCRIPCION
        ${cols.map(c => `,\n        TRIM(${c.COLUMN_NAME}) AS ${c.COLUMN_NAME}`).join('')}
      FROM DSEDAC.LAC 
      WHERE TRIM(SERIEALBARAN) = 'S' 
        AND NUMEROALBARAN = 303
        AND EJERCICIOALBARAN = 2026
      ORDER BY SECUENCIA
    `;
    
    console.log('\n  SQL ejecutado:');
    console.log('  ' + sql_lac.replace(/\n/g, '\n  ') + '\n');
    
    const lac_rows = await conn.query(sql_lac);
    
    if (lac_rows.length === 0) {
      console.log('  ❌ NO hay líneas en DSEDAC.LAC para albarán S-303/2026');
    } else {
      console.log(`  ✅ ${lac_rows.length} línea(s):\n`);
      
      lac_rows.forEach((r, i) => {
        console.log(`  ─── Línea ${i + 1} (Secuencia: ${r.SECUENCIA}) ───`);
        console.log(`  Artículo: ${r.ARTICULO} - ${r.DESCRIPCION.substring(0, 50)}`);
        console.log(`  Cajas: ${r.CAJAS || '(no disponible)'}, Unidades: ${r.UNIDADES || '(no disponible)'}`);
        
        cols.forEach(c => {
          const colName = c.COLUMN_NAME;
          const val = r[colName];
          const es32679 = val === '4300032679';
          console.log(`  ${colName}: ${val || '(vacío)'} ${es32679 ? '← 32679 ❌' : ''}`);
        });
        console.log('');
      });
    }

    // 3. Buscar cliente 32679 directamente en LAC
    console.log('═══════════════════════════════════════════════════════════');
    console.log('3. ¿Existe el cliente 32679 en CUALQUIER línea de LAC con albarán S-303?');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    for (const col of cols) {
      const colName = col.COLUMN_NAME;
      const sql_search = `
        SELECT COUNT(*) AS TOTAL
        FROM DSEDAC.LAC 
        WHERE TRIM(SERIEALBARAN) = 'S' 
          AND NUMEROALBARAN = 303
          AND EJERCICIOALBARAN = 2026
          AND TRIM(${colName}) = '4300032679'
      `;
      
      const result = await conn.query(sql_search);
      const count = result[0].TOTAL;
      
      if (count > 0) {
        console.log(`  ❌ ${colName}: ${count} línea(s) con cliente 32679`);
      } else {
        console.log(`  ✅ ${colName}: 0 líneas con cliente 32679`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    if (conn) {
      try { await conn.close(); } catch (_) {}
    }
  }

  console.log('\n=== FIN ===');
  process.exit(0);
}

main();
