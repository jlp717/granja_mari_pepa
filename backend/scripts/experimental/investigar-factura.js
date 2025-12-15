const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== INVESTIGACIÓN PROFUNDA DE LA FACTURA A 000 008288 ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function investigar() {
  let connection;

  try {
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado\n');

    // 1. Buscar en LAC por cliente y fecha aproximada
    console.log('1. Buscando líneas de albarán para cliente 4300000281...\n');

    const lac = await connection.query(`
      SELECT * FROM DSEDAC.LAC
      WHERE LCCDCL = '4300000281'
        AND LCSRAB = 'A'
        AND LCNRAB = 8288
      FETCH FIRST 10 ROWS ONLY
    `);

    console.log(`Encontradas ${lac.length} líneas en LAC`);
    if (lac.length > 0) {
      console.log('\nPrimera línea completa:');
      console.log(JSON.stringify(lac[0], null, 2));

      console.log('\n--- ANÁLISIS DE CAMPOS CLAVE ---');
      console.log('Subempresa (LCSBAB):', lac[0].LCSBAB);
      console.log('Ejercicio (LCYEAB):', lac[0].LCYEAB);
      console.log('Serie (LCSRAB):', lac[0].LCSRAB);
      console.log('Terminal (LCTRAB):', lac[0].LCTRAB);
      console.log('Número (LCNRAB):', lac[0].LCNRAB);
      console.log('Cliente (LCCDCL):', lac[0].LCCDCL);

      // Guardar parámetros para usar después
      const params = {
        subempresa: lac[0].LCSBAB,
        ejercicio: lac[0].LCYEAB,
        serie: lac[0].LCSRAB,
        terminal: lac[0].LCTRAB,
        numero: lac[0].LCNRAB
      };

      console.log('\n2. Obteniendo TODAS las columnas de LAC...\n');
      const columnas = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, LENGTH, NUMERIC_SCALE, COLUMN_TEXT
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND TABLE_NAME = 'LAC'
        ORDER BY ORDINAL_POSITION
      `);

      console.log(`Total columnas en LAC: ${columnas.length}\n`);
      console.log('Columnas relevantes para factura:');
      columnas.forEach(c => {
        const name = c.COLUMN_NAME.padEnd(25);
        const type = c.DATA_TYPE.padEnd(10);
        const desc = c.COLUMN_TEXT || '';
        console.log(`  ${name} ${type} - ${desc}`);
      });

      // 3. Buscar en CAC (Cabecera)
      console.log('\n\n3. Buscando cabecera en CAC...\n');
      const cac = await connection.query(`
        SELECT * FROM DSEDAC.CAC
        WHERE CCSBAB = ?
          AND CCYEAB = ?
          AND CCSRAB = ?
          AND CCTRAB = ?
          AND CCNRAB = ?
      `, [params.subempresa, params.ejercicio, params.serie, params.terminal, params.numero]);

      if (cac.length > 0) {
        console.log('✅ Cabecera encontrada en CAC:');
        console.log(JSON.stringify(cac[0], null, 2));
      } else {
        console.log('❌ No se encontró cabecera en CAC');
      }

      // 4. Buscar cliente
      console.log('\n\n4. Buscando datos del cliente...\n');
      const cliente = await connection.query(`
        SELECT * FROM DSEDAC.CLI
        WHERE CLCDCL = '4300000281'
      `);

      if (cliente.length > 0) {
        console.log('✅ Cliente encontrado:');
        console.log(JSON.stringify(cliente[0], null, 2));
      }

      // 5. Ver todas las líneas
      console.log('\n\n5. Todas las líneas de la factura...\n');
      const todasLineas = await connection.query(`
        SELECT
          LCSECU, LCCDLT, LCCDRF, LCDESC,
          LCCTEP, LCCTUP, LCPRVT, LCPJDT, LCIMVT, LCCDIV
        FROM DSEDAC.LAC
        WHERE LCSBAB = ?
          AND LCYEAB = ?
          AND LCSRAB = ?
          AND LCTRAB = ?
          AND LCNRAB = ?
        ORDER BY LCSECU
      `, [params.subempresa, params.ejercicio, params.serie, params.terminal, params.numero]);

      console.log(`Total líneas: ${todasLineas.length}`);
      todasLineas.forEach((linea, i) => {
        console.log(`\nLínea ${i + 1}:`);
        console.log(`  Seq: ${linea.LCSECU}, Lote: ${linea.LCCDLT}, Ref: ${linea.LCCDRF}`);
        console.log(`  Desc: ${linea.LCDESC}`);
        console.log(`  Cajas: ${linea.LCCTEP}, Uds: ${linea.LCCTUP}`);
        console.log(`  Precio: ${linea.LCPRVT}, Dto%: ${linea.LCPJDT}, Importe: ${linea.LCIMVT}, IVA: ${linea.LCCDIV}`);
      });

    } else {
      console.log('❌ No se encontraron líneas para esta factura');
      console.log('\nIntentando búsquedas alternativas...');

      // Búsqueda por fecha
      console.log('\nBuscando por fecha 04/11/2025...');
      const porFecha = await connection.query(`
        SELECT LCSBAB, LCYEAB, LCSRAB, LCTRAB, LCNRAB, LCCDCL, LCDDDC, LCMMDC, LCAADC
        FROM DSEDAC.LAC
        WHERE LCDDDC = 4
          AND LCMMDC = 11
          AND LCAADC = 2025
          AND LCCDCL = '4300000281'
        FETCH FIRST 5 ROWS ONLY
      `);

      console.log(`Encontrados ${porFecha.length} registros para esa fecha y cliente`);
      if (porFecha.length > 0) {
        porFecha.forEach(r => {
          console.log(`  ${r.LCSBAB}-${r.LCYEAB}-${r.LCSRAB}-${r.LCTRAB}-${r.LCNRAB}`);
        });
      }
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
