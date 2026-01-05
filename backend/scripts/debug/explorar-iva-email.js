/**
 * EXPLORAR TABLA IVA Y BUSCAR EMAIL
 * ==================================
 */

require('dotenv').config();

async function explorarIVAyEmail() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  EXPLORAR TABLA IVA Y BUSCAR CAMPO EMAIL                        ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER ESTRUCTURA DE TABLA IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. ESTRUCTURA DE TABLA DSEDAC.IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCols = `
        SELECT COLUMN_NAME, DATA_TYPE
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'IVA'
        ORDER BY ORDINAL_POSITION
      `;
            const cols = await pool.query(queryCols);
            console.log('Columnas de IVA:');
            cols.forEach(c => console.log('  ' + c.COLUMN_NAME + ' (' + c.DATA_TYPE + ')'));
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. VER CONTENIDO DE TABLA IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. CONTENIDO DE TABLA DSEDAC.IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryIVA = `SELECT * FROM DSEDAC.IVA FETCH FIRST 10 ROWS ONLY`;
            const datos = await pool.query(queryIVA);
            console.log('Registros de IVA (' + datos.length + '):');
            datos.forEach((d, i) => {
                console.log('\nRegistro ' + (i + 1) + ':');
                Object.entries(d).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        console.log('  ' + key + ': ' + value);
                    }
                });
            });
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. BUSCAR TABLAS CON CAMPO EMAIL O CORREO
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. BUSCAR TABLAS CON CAMPOS DE EMAIL EN DSEDAC');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryEmail = `
        SELECT TABLE_NAME, COLUMN_NAME
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'DSEDAC'
          AND (UPPER(COLUMN_NAME) LIKE '%EMAIL%' 
               OR UPPER(COLUMN_NAME) LIKE '%MAIL%'
               OR UPPER(COLUMN_NAME) LIKE '%CORREO%')
        ORDER BY TABLE_NAME, COLUMN_NAME
      `;
            const tablas = await pool.query(queryEmail);
            console.log('Tablas con campos de email:');
            tablas.forEach(t => console.log('  ' + t.TABLE_NAME + '.' + t.COLUMN_NAME));
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. VER LÍNEA DE FACTURA F-14022 CON IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. LÍNEAS FACTURA F-14022 CON DATOS DE IVA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryLineas = `
        SELECT 
          LAC.CODIGOARTICULO,
          LAC.DESCRIPCION,
          LAC.CODIGOIVA,
          IVA.IVA as IVA_CODIGO,
          IVA.PORCENTAJEIVA
        FROM DSEDAC.LAC
        INNER JOIN DSEDAC.CAC
          ON CAC.SUBEMPRESAALBARAN = LAC.SUBEMPRESAALBARAN
          AND CAC.EJERCICIOALBARAN = LAC.EJERCICIOALBARAN
          AND CAC.SERIEALBARAN = LAC.SERIEALBARAN
          AND CAC.TERMINALALBARAN = LAC.TERMINALALBARAN
          AND CAC.NUMEROALBARAN = LAC.NUMEROALBARAN
        LEFT JOIN DSEDAC.IVA
          ON IVA.IVA = LAC.CODIGOIVA
        WHERE CAC.SERIEFACTURA = 'F'
          AND CAC.NUMEROFACTURA = 14022
        FETCH FIRST 5 ROWS ONLY
      `;
            const lineas = await pool.query(queryLineas);
            console.log('Líneas con IVA:');
            lineas.forEach((l, i) => {
                console.log((i + 1) + '. ' + (l.DESCRIPCION || '').trim().substring(0, 30));
                console.log('   Código IVA artículo: ' + l.CODIGOIVA);
                console.log('   IVA código tabla: ' + l.IVA_CODIGO);
                console.log('   Porcentaje: ' + (parseFloat(l.PORCENTAJEIVA) || 0) + '%');
            });
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. VER CÓDIGO IVA EN CAC PARA LA FACTURA F-14022
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. IVA EN CABECERA CAC PARA F-14022');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryCAC = `
        SELECT 
          PORCENTAJEIVA1,
          IMPORTEBASEIMPONIBLE1,
          IMPORTEIVA1,
          PORCENTAJEIVA2,
          IMPORTEBASEIMPONIBLE2,
          IMPORTEIVA2
        FROM DSEDAC.CAC
        WHERE SERIEFACTURA = 'F'
          AND NUMEROFACTURA = 14022
        FETCH FIRST 1 ROWS ONLY
      `;
            const cac = await pool.query(queryCAC);
            if (cac.length > 0) {
                console.log('IVA en CAC:');
                console.log('  Porcentaje IVA 1: ' + cac[0].PORCENTAJEIVA1 + '%');
                console.log('  Base 1: ' + cac[0].IMPORTEBASEIMPONIBLE1);
                console.log('  IVA 1: ' + cac[0].IMPORTEIVA1);
                console.log('  Porcentaje IVA 2: ' + cac[0].PORCENTAJEIVA2 + '%');
                console.log('  Base 2: ' + cac[0].IMPORTEBASEIMPONIBLE2);
                console.log('  IVA 2: ' + cac[0].IMPORTEIVA2);
            }
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. BUSCAR EMAIL EN OTRAS TABLAS PARA CLIENTE 9463
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('6. BUSCAR EMAIL CLIENTE 9463 EN TODAS LAS TABLAS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // El ERP muestra el email en "Factura Electrónica", puede ser CLIFAX o similar
        const tablasPosibles = ['CLIFAX', 'CLIFAE', 'CLIFAC', 'CLIE', 'CLIEXT', 'DACCLI'];

        for (const tabla of tablasPosibles) {
            try {
                const query = `SELECT * FROM DSEDAC.${tabla} WHERE CODIGOCLIENTE LIKE '%9463%' FETCH FIRST 1 ROWS ONLY`;
                const result = await pool.query(query);
                if (result.length > 0) {
                    console.log('\n✓ Encontrado en ' + tabla + ':');
                    Object.entries(result[0]).forEach(([key, value]) => {
                        if (value !== null && value !== undefined && String(value).trim() !== '') {
                            console.log('  ' + key + ': ' + String(value).trim());
                        }
                    });
                }
            } catch (e) {
                // tabla no existe, continuar
            }
        }

        console.log('\n✓ Exploración completada\n');

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

explorarIVAyEmail().catch(console.error);
