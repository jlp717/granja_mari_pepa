const odbc = require('odbc');
require('dotenv').config();

async function test() {
    const conn = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 ANÁLIS IS COMPLETO - CLIENTE JU CHUHUA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Buscar cliente por nombre
    console.log('1. Buscando "CHUHUA" en tabla CLI...\n');
    const clientes = await conn.query(`
        SELECT CODIGOCLIENTE, NOMBRECLIENTE, NOMBREALTERNATIVO, NIF
        FROM DSEDAC.CLI
        WHERE UPPER(NOMBRECLIENTE) LIKE '%CHUHUA%'
        OR UPPER(NOMBRECLIENTE) LIKE '%CHINO%GRAN%MUNDO%'
        OR UPPER(NOMBREALTERNATIVO) LIKE '%CHUHUA%'
        OR UPPER(NOMBREALTERNATIVO) LIKE '%CHINO%GRAN%MUNDO%'
        FETCH FIRST 10 ROWS ONLY
    `);
    
    if (clientes.length === 0) {
        console.log('⚠️  No se encontró el cliente');
        await conn.close();
        return;
    }
    
    console.log(`✅ Encontrados ${clientes.length} clientes:`);
    clientes.forEach((c, i) => {
        console.log(`   ${i + 1}. Código: ${c.CODIGOCLIENTE} | ${(c.NOMBRECLIENTE || '').trim()} | NIF: ${c.NIF}`);
    });
    
    const codigoCliente = clientes[0].CODIGOCLIENTE.trim();
    console.log(`\n🎯 Analizando cliente: ${codigoCliente}\n`);
    
    // 2. Facturas del cliente
    console.log('2. FACTURAS DEL CLIENTE\n');
    const facturas = await conn.query(`
        SELECT
            SERIEFACTURA, NUMEROFACTURA,
            SUBEMPRESAALBARAN, SERIEALBARAN, NUMEROALBARAN,
            DIADOCUMENTO, MESDOCUMENTO, ANODOCUMENTO,
            IMPORTETOTAL as TOTALFACTURA,
            IMPORTECOBRADOPENDIENTE,
            CODIGOFORMAPAGO,
            CODIGOTIPOALBARAN
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
        AND NUMEROFACTURA > 0
        ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
        FETCH FIRST 20 ROWS ONLY
    `);
    
    console.log(`📊 Total facturas: ${facturas.length}\n`);
    
    if (facturas.length === 0) {
        console.log('⚠️  Este cliente no tiene facturas registradas');
        await conn.close();
        return;
    }
    
    let totalPendiente = 0;
    let totalGeneral = 0;
    
    facturas.forEach((f, i) => {
        const total = parseFloat(f.TOTALFACTURA || 0);
        const pendiente = parseFloat(f.IMPORTECOBRADOPENDIENTE || 0);
        const cobrado = total - pendiente;
        
        totalGeneral += total;
        totalPendiente += pendiente;
        
        console.log(`${i + 1}. Factura ${f.SERIEFACTURA} ${f.NUMEROFACTURA}`);
        console.log(`   📅 Fecha: ${f.DIADOCUMENTO}/${f.MESDOCUMENTO}/${f.ANODOCUMENTO}`);
        console.log(`   💰 Total: €${total.toFixed(2)} | Cobrado: €${cobrado.toFixed(2)} | Pendiente: €${pendiente.toFixed(2)}`);
        console.log(`   💳 Forma pago: ${f.CODIGOFORMAPAGO} | Tipo: ${f.CODIGOTIPOALBARAN}`);
        
        if (total === 0) {
            console.log(`   ⚠️  FACTURA €0.00 - Posible rectificación/abono`);
        } else if (pendiente === 0) {
            console.log(`   ✅ PAGADA`);
        } else if (pendiente === total) {
            console.log(`   ⏳ PENDIENTE`);
        } else {
            console.log(`   🔶 PARCIAL`);
        }
        console.log('');
    });
    
    console.log('════════════════════════════════════════════');
    console.log(`📊 RESUMEN:`);
    console.log(`   Total facturado: €${totalGeneral.toFixed(2)}`);
    console.log(`   Total cobrado: €${(totalGeneral - totalPendiente).toFixed(2)}`);
    console.log(`   Total pendiente: €${totalPendiente.toFixed(2)}`);
    console.log('════════════════════════════════════════════\n');
    
    // 3. Pedidos
    console.log('3. PEDIDOS DEL CLIENTE\n');
    
    const pedidos = await conn.query(`
        SELECT
            SERIEPEDIDO, NUMEROPEDIDO,
            DIADOCUMENTO, MESDOCUMENTO, ANODOCUMENTO,
            IMPORTETOTALPEDIDO,
            CODIGOESTADO
        FROM DSEDAC.CCO
        WHERE TRIM(CODIGOCLIENTE) = '${codigoCliente}'
        ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
        FETCH FIRST 10 ROWS ONLY
    `);
    
    console.log(`📦 Total pedidos: ${pedidos.length}\n`);
    
    if (pedidos.length > 0) {
        let totalPedidos = 0;
        pedidos.forEach((p, i) => {
            const importe = parseFloat(p.IMPORTETOTALPEDIDO || 0);
            totalPedidos += importe;
            console.log(`${i + 1}. Pedido ${p.SERIEPEDIDO}-${p.NUMEROPEDIDO}`);
            console.log(`   📅 ${p.DIADOCUMENTO}/${p.MESDOCUMENTO}/${p.ANODOCUMENTO}`);
            console.log(`   💰 €${importe.toFixed(2)}`);
            console.log(`   📋 Estado: ${p.CODIGOESTADO}\n`);
        });
        console.log(`════════════════════════════════════════════`);
        console.log(`📊 Total pedidos: €${totalPedidos.toFixed(2)}`);
        console.log(`════════════════════════════════════════════\n`);
    }
    
    //  4. Verificar datos dashboard
    console.log('4. ANÁLISIS DE DATOS DEL DASHBOARD\n');
    console.log('En la imagen aparece:');
    console.log('  - "RESTAURANTE CHINO GRAN MUNDO"');
    console.log('  - "2 Pedidos"');
    console.log('  - "€217 Total"\n');
    
    console.log('🔍 Verificando origen de estos datos...\n');
    console.log(`Facturas encontradas: ${facturas.length}`);
    console.log(`Pedidos encontrados: ${pedidos.length}`);
    console.log(`Total facturas: €${totalGeneral.toFixed(2)}`);
    
    if (pedidos.length > 0) {
        const totalPedidos = pedidos.reduce((sum, p) => sum + parseFloat(p.IMPORTETOTALPEDIDO || 0), 0);
        console.log(`Total pedidos: €${totalPedidos.toFixed(2)}`);
        
        if (Math.abs(totalPedidos - 217) < 1) {
            console.log('✅ ¡COINCIDE! El "€217" viene de los PEDIDOS, no de las facturas');
        }
        
        if (pedidos.length === 2) {
            console.log('✅ ¡COINCIDE! "2 Pedidos" es correcto');
        }
    }
    
    await conn.close();
    console.log('\n✅ Análisis completado\n');
}

test().catch(console.error);
