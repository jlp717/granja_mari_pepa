/**
 * ANÁLISIS COMPLETO DE FACTURAS - VERIFICACIÓN DE DATOS
 */

const pool = require('./app/config/odbcConfig');
require('dotenv').config();

async function analizarFacturasCliente() {
    try {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🔍 ANÁLISIS COMPLETO DE FACTURAS - CLIENTE 4300000281');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 1. Obtener TODAS las facturas del cliente
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
            WHERE CODIGOCLIENTE = ?
            ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
        `;

        const result = await pool.query(query, ['4300000281']);
        
        console.log(`📊 Total de facturas encontradas: ${result.length}\n`);

        // Analizar cada factura
        result.forEach((factura, index) => {
            const total = parseFloat(factura.TOTALFACTURA || 0);
            const pendiente = parseFloat(factura.IMPORTECOBRADOPENDIENTE || 0);
            
            console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
            console.log(`│ FACTURA #${index + 1}`);
            console.log(`├─────────────────────────────────────────────────────────────┤`);
            console.log(`│ Identificación:`);
            console.log(`│   • Serie Factura: ${factura.SERIEFACTURA || 'N/A'}`);
            console.log(`│   • Número Factura: ${factura.NUMEROFACTURA || 'N/A'}`);
            console.log(`│   • Albarán: ${factura.SUBEMPRESAALBARAN}-${factura.SERIEALBARAN} Nº ${factura.NUMEROALBARAN}`);
            console.log(`│   • Fecha: ${factura.DIADOCUMENTO}/${factura.MESDOCUMENTO}/${factura.ANODOCUMENTO}`);
            console.log(`│`);
            console.log(`│ 💰 IMPORTES:`);
            console.log(`│   • TOTALFACTURA: €${total.toFixed(2)}`);
            console.log(`│   • TOTALBASEFACTURA: €${parseFloat(factura.TOTALBASEFACTURA || 0).toFixed(2)}`);
            console.log(`│   • TOTALIVAFACTURA: €${parseFloat(factura.TOTALIVAFACTURA || 0).toFixed(2)}`);
            console.log(`│   • IMPORTECOBRADOPENDIENTE: €${pendiente.toFixed(2)} ⭐⭐⭐`);
            console.log(`│`);
            console.log(`│ 💳 PAGO:`);
            console.log(`│   • CODIGOFORMAPAGO: ${factura.CODIGOFORMAPAGO || 'N/A'}`);
            console.log(`│`);
            console.log(`│ 📦 TIPO:`);
            console.log(`│   • CODIGOTIPOALBARAN: ${factura.CODIGOTIPOALBARAN || 'N/A'}`);
            console.log(`└─────────────────────────────────────────────────────────────┘`);

            // ANÁLISIS DEL ESTADO
            console.log(`\n🎯 INTERPRETACIÓN DEL ESTADO:`);
            if (total === 0) {
                console.log(`   ⚠️  FACTURA DE €0.00`);
                console.log(`   ❓ ¿Factura de rectificación? ¿Abono? ¿Descuento total?`);
                console.log(`   📋 DECISIÓN: Mostrar como PAGADA (no hay nada que cobrar)`);
            } else if (pendiente === 0) {
                console.log(`   ✅ PAGADA COMPLETAMENTE`);
                console.log(`   📊 Total: €${total.toFixed(2)} | Cobrado: €${total.toFixed(2)} | Pendiente: €0.00`);
            } else if (pendiente === total) {
                console.log(`   ⏳ PENDIENTE DE COBRO TOTAL`);
                console.log(`   📊 Total: €${total.toFixed(2)} | Cobrado: €0.00 | Pendiente: €${pendiente.toFixed(2)}`);
            } else if (pendiente < total && pendiente > 0) {
                console.log(`   🔶 PARCIALMENTE PAGADA`);
                console.log(`   📊 Total: €${total.toFixed(2)} | Cobrado: €${(total - pendiente).toFixed(2)} | Pendiente: €${pendiente.toFixed(2)}`);
            } else {
                console.log(`   ❌ DATOS INCONSISTENTES`);
                console.log(`   ⚠️  Pendiente (€${pendiente.toFixed(2)}) > Total (€${total.toFixed(2)})`);
            }
        });

        // 2. Consultar tabla FPG para ver formas de pago
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('💳 FORMAS DE PAGO DISPONIBLES EN LA BASE DE DATOS');
        console.log('═══════════════════════════════════════════════════════════\n');

        const queryFPG = `SELECT CODIGOFORMAPAGO, DESCRIPCIONFORMAPAGO FROM DSEDAC.FPG ORDER BY CODIGOFORMAPAGO`;
        const formasPago = await pool.query(queryFPG);

        const usadas = new Set(result.map(f => f.CODIGOFORMAPAGO));

        formasPago.forEach(fp => {
            const usado = usadas.has(fp.CODIGOFORMAPAGO);
            console.log(`${usado ? '✅' : '  '} Código: ${String(fp.CODIGOFORMAPAGO).padEnd(5)} → "${fp.DESCRIPCIONFORMAPAGO}"${usado ? ' (USADA por cliente 4300000281)' : ''}`);
        });

        // 3. Buscar clientes con formas de pago diferentes
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('🔍 CLIENTES CON OTRAS FORMAS DE PAGO (no REPOSICION)');
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
            AND CAC.ANODOCUMENTO >= 2024
            FETCH FIRST 10 ROWS ONLY
        `;

        const otrasFormas = await pool.query(queryOtrasFormas);
        
        if (otrasFormas.length === 0) {
            console.log('⚠️  No se encontraron facturas 2024-2025 con formas de pago diferentes a REPOSICION');
        } else {
            console.log(`Encontrados ${otrasFormas.length} ejemplos:\n`);
            otrasFormas.forEach((ej, i) => {
                console.log(`${i + 1}. Cliente: ${ej.CODIGOCLIENTE} - ${(ej.RAZONSOCIAL || '').trim()}`);
                console.log(`   Factura: ${ej.SERIEFACTURA} ${ej.NUMEROFACTURA}`);
                console.log(`   Forma pago: [${ej.CODIGOFORMAPAGO}] "${ej.DESCRIPCIONFORMAPAGO}"\n`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('✅ ANÁLISIS COMPLETADO');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

analizarFacturasCliente();
