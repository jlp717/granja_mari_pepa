const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== INVESTIGACIÓN ALBARÁN P-33-3292 ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function investigar() {
  let connection;

  try {
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // Parámetros del albarán
    const params = {
      subempresa: 'GMP',
      ejercicio: 2025,
      serie: 'P',
      terminal: 33,
      numero: 3292
    };

    console.log('Buscando albarán:', params);

    // 1. Ver TODAS las columnas de LAC
    console.log('\n1. Estructura completa de LAC:\n');
    const columnas = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE, COLUMN_TEXT
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME = 'LAC'
      ORDER BY ORDINAL_POSITION
    `);

    console.log(`Total: ${columnas.length} columnas\n`);
    columnas.forEach((c, i) => {
      const num = String(i + 1).padStart(3, ' ');
      const name = c.COLUMN_NAME.padEnd(30);
      const type = (c.DATA_TYPE + '(' + c.LENGTH + ')').padEnd(15);
      const desc = c.COLUMN_TEXT || '';
      console.log(`${num}. ${name} ${type} ${desc}`);
    });

    // 2. Obtener todas las líneas del albarán
    console.log('\n\n2. Líneas del albarán P-33-3292:\n');
    const lineas = await connection.query(`
      SELECT *
      FROM DSEDAC.LAC
      WHERE LCSBAB = ?
        AND LCYEAB = ?
        AND LCSRAB = ?
        AND LCTRAB = ?
        AND LCNRAB = ?
      ORDER BY LCSECU
    `, [params.subempresa, params.ejercicio, params.serie, params.terminal, params.numero]);

    console.log(`Total líneas: ${lineas.length}\n`);

    if (lineas.length > 0) {
      // Mostrar la primera línea completa
      console.log('PRIMERA LÍNEA COMPLETA:');
      console.log('='.repeat(80));
      Object.keys(lineas[0]).forEach(key => {
        console.log(`${key.padEnd(30)} = ${lineas[0][key]}`);
      });

      // Mostrar resumen de todas las líneas
      console.log('\n\nRESUMEN DE TODAS LAS LÍNEAS:');
      console.log('='.repeat(120));
      console.log('Seq  Lote         Ref      Descripción                              Cajas    Uds      Precio    Dto%    Importe   IVA');
      console.log('-'.repeat(120));

      lineas.forEach(l => {
        console.log(
          String(l.LCSECU).padStart(3) + '  ' +
          String(l.LCCDLT || '').padEnd(12) + ' ' +
          String(l.LCCDRF || '').padEnd(8) + ' ' +
          String(l.LCDESC || '').substring(0, 40).padEnd(40) + ' ' +
          String(l.LCCTEP || 0).padStart(8) + ' ' +
          String(l.LCCTUP || 0).padStart(8) + ' ' +
          String(l.LCPRVT || 0).padStart(9) + ' ' +
          String(l.LCPJDT || 0).padStart(7) + ' ' +
          String(l.LCIMVT || 0).padStart(9) + ' ' +
          String(l.LCCDIV || '')
        );
      });

      // 3. Buscar cabecera CAC
      console.log('\n\n3. Cabecera en CAC:\n');
      const cac = await connection.query(`
        SELECT * FROM DSEDAC.CAC
        WHERE CCSBAB = ?
          AND CCYEAB = ?
          AND CCSRAB = ?
          AND CCTRAB = ?
          AND CCNRAB = ?
      `, [params.subempresa, params.ejercicio, params.serie, params.terminal, params.numero]);

      if (cac.length > 0) {
        console.log('✅ Cabecera encontrada:');
        Object.keys(cac[0]).forEach(key => {
          console.log(`  ${key.padEnd(30)} = ${cac[0][key]}`);
        });
      } else {
        console.log('❌ No hay cabecera en CAC');
      }

      // 4. Cliente
      console.log('\n\n4. Datos del cliente 4300000281:\n');
      const cliente = await connection.query(`
        SELECT * FROM DSEDAC.CLI
        WHERE CLCDCL = '4300000281'
      `);

      if (cliente.length > 0) {
        console.log('✅ Cliente encontrado:');
        Object.keys(cliente[0]).forEach(key => {
          console.log(`  ${key.padEnd(30)} = ${cliente[0][key]}`);
        });
      }

      // 5. Buscar tabla de descuentos
      console.log('\n\n5. Buscando descuentos en LINDTO:\n');
      const lindto = await connection.query(`
        SELECT * FROM DSEDAC.LINDTO
        WHERE PDSBAB = ?
          AND PDYEAB = ?
          AND PDSRAB = ?
          AND PDTRAB = ?
          AND PDNRAB = ?
      `, [params.subempresa, params.ejercicio, params.serie, params.terminal, params.numero]);

      console.log(`Descuentos encontrados: ${lindto.length}`);
      if (lindto.length > 0) {
        console.log('\nPrimer descuento:');
        Object.keys(lindto[0]).forEach(key => {
          console.log(`  ${key.padEnd(30)} = ${lindto[0][key]}`);
        });
      }

    } else {
      console.log('❌ No se encontraron líneas');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error('  ', e.message));
    }
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n✅ Conexión cerrada');
    }
  }
}

investigar();
