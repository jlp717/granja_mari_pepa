const odbc = require('odbc');
require('dotenv').config();

async function analizarFacturasCliente() {
    let connection;
    try {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🔍 ANÁLISIS COMPLETO DE FACTURAS - CLIENTE 4300000281');
        console.log('═══════════════════════════════════════════════════════════\n');

        connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);

        // 1. Obtener TODAS las facturas del cliente con TODOS los campos relevantes
        const query = `
            SELECT 
                SUBEMPRESAALBARAN, SERIEALBARAN, NUMEROALBARAN,
                SERIEFACTURA, NUMEROFACTURA,
                DIADOCUMENTO, MESDOCUMENTO, ANODOCUMENTO,
                CODIGOCLIENTE,
                TOTALBASEFACTURA,
                TOTALIVAFACTURA,
                TOTALFACTURA,
                IMPORTECOBRADOPENDIENTE,
                CODIGOFORMAPAGO,
                CODIGOTIPOALBARAN
            FROM DSEDAC.CAC
            WHERE CODIGOCLIENTE = '4300000281'
            ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
        `;

        const result = await connection.query(query);
        
        console.log(`📊 Total de facturas encontradas: ${result.length}\n`);

        // Analizar cada factura
        result.forEach((factura, index) => {
            console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
            console.log(`│ FACTURA #${index + 1}`);
            console.log(`├─────────────────────────────────────────────────────────────┤`);
            console.log(`│ Identificación:`);
            console.log(`│   • Serie Factura: ${factura.SERIEFACTURA || 'N/A'}`);
            console.log(`│   • Número Factura: ${factura.NUMEROFACTURA || 'N/A'}`);
            console.log(`│   • Albarán: ${factura.SUBEMPRESAALBARAN}-${factura.SERIEALBARAN} Nº ${factura.NUMEROALBARAN}`);
            console.log(`│   • Fecha: ${factura.DIADOCUMENTO}/${factura.MESDOCUMENTO}/${factura.ANODOCUMENTO}`);
            console.log(`│`);
            console.log(`│ 💰 IMPORTES (CLAVE PARA ENTENDER ESTADO):`);
            console.log(`│   • TOTALFACTURA: €${parseFloat(factura.TOTALFACTURA || 0).toFixed(2)}`);
            console.log(`│   • TOTALBASEFACTURA: €${parseFloat(factura.TOTALBASEFACTURA || 0).toFixed(2)}`);
            console.log(`│   • TOTALIVAFACTURA: €${parseFloat(factura.TOTALIVAFACTURA || 0).toFixed(2)}`);
            console.log(`│   • IMPORTECOBRADOPENDIENTE: €${parseFloat(factura.IMPORTECOBRADOPENDIENTE || 0).toFixed(2)} ⭐`);
            console.log(`│`);
            console.log(`│  PAGO:`);
            console.log(`│   • CODIGOFORMAPAGO: ${factura.CODIGOFORMAPAGO || 'N/A'}`);
            console.log(`│`);
            console.log(`│ 📦 TIPO DOCUMENTO:`);
            console.log(`│   • CODIGOTIPOALBARAN: ${factura.CODIGOTIPOALBARAN || 'N/A'}`);
            console.log(`└─────────────────────────────────────────────────────────────┘`);

            // ANÁLISIS DEL ESTADO
            const pendiente = parseFloat(factura.IMPORTECOBRADOPENDIENTE || 0);
            const total = parseFloat(factura.TOTALFACTURA || 0);
            
            console.log(`\n🎯 INTERPRETACIÓN DEL ESTADO:`);
            if (total === 0) {
                console.log(`   ⚠️  FACTURA DE €0.00 - ¿Factura de rectificación? ¿Abono? ¿Error?`);
                console.log(`   ❓ ESTADO AMBIGUO - No hay importe a cobrar`);
            } else if (pendiente === 0) {
                console.log(`   ✅ PAGADA - No hay pendiente de cobro`);
            } else if (pendiente === total) {
                console.log(`   ⏳ PENDIENTE - Nada cobrado aún`);
            } else if (pendiente < total && pendiente > 0) {
                console.log(`   🔶 PARCIALMENTE PAGADA - Cobrado: €${(total - pendiente).toFixed(2)}, Pendiente: €${pendiente.toFixed(2)}`);
            } else {
                console.log(`   ❌ INCONSISTENCIA - Pendiente (${pendiente}) > Total (${total})`);
            }
        });

        // 2. Consultar tabla FPG para ver TODAS las formas de pago
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('💳 TODAS LAS FORMAS DE PAGO DISPONIBLES EN FPG');
        console.log('═══════════════════════════════════════════════════════════\n');

        const queryFPG = `SELECT CODIGOFORMAPAGO, DESCRIPCIONFORMAPAGO FROM DSEDAC.FPG ORDER BY CODIGOFORMAPAGO`;
        const formasPago = await connection.query(queryFPG);

        formasPago.forEach(fp => {
            const usado = result.some(f => f.CODIGOFORMAPAGO === fp.CODIGOFORMAPAGO);
            console.log(`${usado ? '✅' : '  '} Código: ${fp.CODIGOFORMAPAGO.padEnd(5)} → "${fp.DESCRIPCIONFORMAPAGO}"`);
        });

        // 3. Buscar clientes con formas de pago diferentes a '02'
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('🔍 EJEMPLOS DE CLIENTES CON OTRAS FORMAS DE PAGO');
        console.log('═══════════════════════════════════════════════════════════\n');

        const queryOtrasFormas = `
            SELECT DISTINCT 
                CAC.CODIGOCLIENTE,
                CLI.RAZONSOCIAL,
                CAC.CODIGOFORMAPAGO,
                FPG.DESCRIPCIONFORMAPAGO,
                CAC.SERIEFACTURA,
                CAC.NUMEROFACTURA
            FROM DSEDAC.CAC AS CAC
            LEFT JOIN DSEDAC.CLI AS CLI ON CAC.CODIGOCLIENTE = CLI.CODIGOCLIENTE
            LEFT JOIN DSEDAC.FPG AS FPG ON CAC.CODIGOFORMAPAGO = FPG.CODIGOFORMAPAGO
            WHERE CAC.CODIGOFORMAPAGO <> '02'
            AND CAC.ANODOCUMENTO = 2025
            FETCH FIRST 10 ROWS ONLY
        `;

        const otrasFormas = await connection.query(queryOtrasFormas);
        
        if (otrasFormas.length === 0) {
            console.log('⚠️  No se encontraron facturas 2025 con formas de pago diferentes a "REPOSICION" (02)');
        } else {
            console.log('Ejemplos de clientes con otras formas de pago:\n');
            otrasFormas.forEach(ej => {
                console.log(`Cliente: ${ej.CODIGOCLIENTE} - ${ej.RAZONSOCIAL}`);
                console.log(`  Factura: ${ej.SERIEFACTURA} ${ej.NUMEROFACTURA}`);
                console.log(`  Forma pago: [${ej.CODIGOFORMAPAGO}] "${ej.DESCRIPCIONFORMAPAGO}"\n`);
            });
        }

        await connection.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (connection) await connection.close();
        process.exit(1);
    }
}

analizarFacturasCliente();
