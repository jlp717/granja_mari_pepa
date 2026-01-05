/**
 * INVESTIGAR IVA 7% Y EMAIL CLIENTE
 * ==================================
 */

require('dotenv').config();

async function investigarProblemas() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  INVESTIGAR IVA 7% Y EMAIL CLIENTE 9463                         ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER TABLA DE TIPOS DE IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. TABLA DE TIPOS DE IVA (TAB01 o IVA)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryIVA = `
        SELECT CODIGOIVA, PORCENTAJEIVA, FECHAVIGENCIA
        FROM DSEDAC.TAB01
        WHERE PORCENTAJEIVA IS NOT NULL
        ORDER BY CODIGOIVA, FECHAVIGENCIA DESC
      `;
            const tiposIVA = await pool.query(queryIVA);
            console.log('Tipos de IVA en TAB01:');
            tiposIVA.forEach(i => {
                console.log('  Código ' + i.CODIGOIVA + ': ' + (parseFloat(i.PORCENTAJEIVA) || 0).toFixed(2) + '% (vigencia: ' + i.FECHAVIGENCIA + ')');
            });
        } catch (e) {
            console.log('Error con TAB01: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. VER PRODUCTO ESPECÍFICO DE LA FACTURA (código 2908 - PIZZA)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. PRODUCTO PIZZA 2908 (de la factura F-14022)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryProducto = `
        SELECT 
          ART.CODIGOARTICULO,
          ART.DESCRIPCION,
          ART.CODIGOIVA,
          TAB.PORCENTAJEIVA
        FROM DSEDAC.ART
        LEFT JOIN DSEDAC.TAB01 TAB ON ART.CODIGOIVA = TAB.CODIGOIVA
        WHERE TRIM(ART.CODIGOARTICULO) = '2908'
          OR TRIM(ART.CODIGOARTICULO) LIKE '%2908%'
        FETCH FIRST 5 ROWS ONLY
      `;
            const producto = await pool.query(queryProducto);
            console.log('Producto 2908:');
            producto.forEach(p => {
                console.log('  ' + p.CODIGOARTICULO + ': ' + (p.DESCRIPCION || '').trim());
                console.log('    Código IVA: ' + p.CODIGOIVA);
                console.log('    Porcentaje: ' + (parseFloat(p.PORCENTAJEIVA) || 0).toFixed(2) + '%');
            });
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. VER ESTRUCTURA DE TABLA TAB01
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. ESTRUCTURA DE TAB01 (tabla de IVA)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCols = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'TAB01'
        ORDER BY ORDINAL_POSITION
      `;
            const cols = await pool.query(queryCols);
            console.log('Columnas de TAB01:');
            cols.forEach(c => console.log('  ' + c.COLUMN_NAME + ' (' + c.DATA_TYPE + ')'));
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. EMAIL DEL CLIENTE 4300009463
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. EMAIL DEL CLIENTE 4300009463');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCliente = `
        SELECT 
          TRIM(CLI.CODIGOCLIENTE) as CODIGO,
          TRIM(CLI.NOMBRECLIENTE) as NOMBRE,
          TRIM(CLI.EMAIL) as EMAIL,
          TRIM(CLI.TELEFONO1) as TELEFONO
        FROM DSEDAC.CLI
        WHERE TRIM(CLI.CODIGOCLIENTE) LIKE '%9463%'
      `;
            const cliente = await pool.query(queryCliente);
            console.log('Cliente 9463:');
            cliente.forEach(c => {
                console.log('  Código: ' + c.CODIGO);
                console.log('  Nombre: ' + c.NOMBRE);
                console.log('  Email: [' + (c.EMAIL || 'NULL') + ']');
                console.log('  Teléfono: ' + c.TELEFONO);
            });
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. VER SI HAY OTRAS COLUMNAS DE EMAIL
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. COLUMNAS DE EMAIL EN TABLA CLI');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCols = `
        SELECT COLUMN_NAME
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI'
          AND (UPPER(COLUMN_NAME) LIKE '%EMAIL%' OR UPPER(COLUMN_NAME) LIKE '%CORREO%' OR UPPER(COLUMN_NAME) LIKE '%MAIL%')
        ORDER BY ORDINAL_POSITION
      `;
            const cols = await pool.query(queryCols);
            console.log('Columnas de email en CLI:');
            cols.forEach(c => console.log('  ' + c.COLUMN_NAME));
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. VER TODOS LOS VALORES DE EMAIL PARA CLIENTE 9463
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. TODOS LOS DATOS DEL CLIENTE 4300009463');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryTodo = `
        SELECT *
        FROM DSEDAC.CLI
        WHERE TRIM(CODIGOCLIENTE) = '4300009463'
      `;
            const todo = await pool.query(queryTodo);
            if (todo.length > 0) {
                console.log('Campos del cliente:');
                Object.entries(todo[0]).forEach(([key, value]) => {
                    const val = value !== null && value !== undefined ? String(value).trim() : 'NULL';
                    if (val && val !== '' && val !== 'NULL' && val !== '0' && val !== '0.00') {
                        console.log('  ' + key + ': ' + val);
                    }
                });
            }
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        console.log('\n✓ Investigación completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

investigarProblemas().catch(console.error);
