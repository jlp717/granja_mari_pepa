/**
 * ANÁLISIS DIRECTO - SIN DEPENDENCIAS DEL SERVIDOR
 */

const odbc = require('odbc');
require('dotenv').config();

async function analizar() {
    let connection;
    try {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🔍 ANÁLISIS FACTURAS CLIENTE 4300000281');
        console.log('═══════════════════════════════════════════════════════════\n');

        connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);

        // 1. FACTURAS DEL CLIENTE
        const result = await connection.query(`
            SELECT 
                SUBEMPRESAALBARAN, SERIEALBARAN, NUMEROALBARAN,
                SERIEFACTURA, NUMEROFACTURA,
                DIADOCUMENTO, MESDOCUMENTO, ANODOCUMENTO,
                TOTALBASEFACTURA, TOTALIVAFACTURA, TOTALFACTURA,
                IMPORTECOBRADOPENDIENTE,
                CODIGOFORMAPAGO, CODIGOTIPOALBARAN
            FROM DSEDAC.CAC
            WHERE CODIGOCLIENTE = '4300000281'
            ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
        `);
        
        console.log(`📊 Total facturas: ${result.length}\n`);

        result.forEach((f, i) => {
            const total = parseFloat(f.TOTALFACTURA || 0);
            const pendiente = parseFloat(f.IMPORTECOBRADOPENDIENTE || 0);
            const cobrado = total - pendiente;
            
            console.log(`\n${i + 1}. Factura ${f.SERIEFACTURA} ${f.NUMEROFACTURA}`);
            console.log(`   Albarán: ${f.SUBEMPRESAALBARAN}-${f.SERIEALBARAN} Nº${f.NUMEROALBARAN}`);
            console.log(`   Fecha: ${f.DIADOCUMENTO}/${f.MESDOCUMENTO}/${f.ANODOCUMENTO}`);
            console.log(`   💰 Total: €${total.toFixed(2)} | Cobrado: €${cobrado.toFixed(2)} | Pendiente: €${pendiente.toFixed(2)}`);
            console.log(`   💳 Forma pago: ${f.CODIGOFORMAPAGO}`);
            
            if (total === 0) {
                console.log(`   ⚠️  FACTURA €0.00 - Motivo desconocido (rectificación/abono?)`);
            } else if (pendiente === 0) {
                console.log(`   ✅ PAGADA`);
            } else if (pendiente === total) {
                console.log(`   ⏳ PENDIENTE (nada cobrado)`);
            } else {
                console.log(`   🔶 PARCIAL (cobrado ${((cobrado/total)*100).toFixed(1)}%)`);
            }
        });

        // 2. FORMAS DE PAGO
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('💳 FORMAS DE PAGO EN BASE DE DATOS');
        console.log('═══════════════════════════════════════════════════════════\n');

        const fpg = await connection.query(`SELECT CODIGOFORMAPAGO, DESCRIPCIONFORMAPAGO FROM DSEDAC.FPG ORDER BY CODIGOFORMAPAGO`);
        
        const usadas = new Set(result.map(f => f.CODIGOFORMAPAGO?.trim()));
        fpg.forEach(f => {
            const codigo = f.CODIGOFORMAPAGO?.trim();
            const desc = f.DESCRIPCIONFORMAPAGO?.trim();
            const marca = usadas.has(codigo) ? '✅' : '  ';
            console.log(`${marca} [${codigo}] ${desc}`);
        });

        // 3. EJEMPLOS DE OTRAS FORMAS DE PAGO
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('🔍 CLIENTES CON FORMA DE PAGO ≠ REPOSICION');
        console.log('═══════════════════════════════════════════════════════════\n');

        const otros = await connection.query(`
            SELECT C.CODIGOCLIENTE, CL.RAZONSOCIAL, C.SERIEFACTURA, C.NUMEROFACTURA,
                   C.CODIGOFORMAPAGO, F.DESCRIPCIONFORMAPAGO
            FROM DSEDAC.CAC C
            LEFT JOIN DSEDAC.CLI CL ON C.CODIGOCLIENTE = CL.CODIGOCLIENTE
            LEFT JOIN DSEDAC.FPG F ON C.CODIGOFORMAPAGO = F.CODIGOFORMAPAGO
            WHERE C.CODIGOFORMAPAGO <> '02'
            AND C.ANODOCUMENTO >= 2024
            FETCH FIRST 10 ROWS ONLY
        `);

        if (otros.length === 0) {
            console.log('⚠️  Todas las facturas 2024-2025 usan REPOSICION (código 02)');
        } else {
            otros.forEach((o, i) => {
                console.log(`${i + 1}. Cliente ${o.CODIGOCLIENTE}: ${(o.RAZONSOCIAL || '').trim()}`);
                console.log(`   Factura: ${o.SERIEFACTURA} ${o.NUMEROFACTURA}`);
                console.log(`   Forma pago: [${o.CODIGOFORMAPAGO}] ${o.DESCRIPCIONFORMAPAGO}`);
                console.log('');
            });
        }

        await connection.close();
        console.log('\n✅ Análisis completado\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (connection) await connection.close();
        process.exit(1);
    }
}

analizar();
