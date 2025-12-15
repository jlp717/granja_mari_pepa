const odbc = require('odbc');
require('dotenv').config();

async function buscarOtrasFormasPago() {
    const conn = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💳 BÚSQUEDA DE CLIENTES CON OTRAS FORMAS DE PAGO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Ver todas las formas de pago disponibles
    console.log('1. FORMAS DE PAGO DISPONIBLES EN FPG:\n');
    const fpg = await conn.query(`
        SELECT CODIGOFORMAPAGO, DESCRIPCIONFORMAPAGO  
        FROM DSEDAC.FPG 
        ORDER BY CODIGOFORMAPAGO
    `);
    
    fpg.forEach(f => {
        console.log(`   [${String(f.CODIGOFORMAPAGO).trim().padEnd(5)}] ${f.DESCRIPCIONFORMAPAGO.trim()}`);
    });
    
    // 2. Buscar facturas con cada forma de pago
    console.log('\n\n2. EJEMPLOS DE FACTURAS POR FORMA DE PAGO:\n');
    
    for (const forma of fpg) {
        const codigo = String(forma.CODIGOFORMAPAGO).trim();
        const desc = forma.DESCRIPCIONFORMAPAGO.trim();
        
        const ejemplos = await conn.query(`
            SELECT C.CODIGOCLIENTEFACTURA, CL.NOMBRECLIENTE, 
                   C.SERIEFACTURA, C.NUMEROFACTURA,
                   C.ANODOCUMENTO, C.MESDOCUMENTO, C.DIADOCUMENTO,
                   C.IMPORTETOTAL
            FROM DSEDAC.CAC C
            LEFT JOIN DSEDAC.CLI CL ON TRIM(C.CODIGOCLIENTEFACTURA) = TRIM(CL.CODIGOCLIENTE)
            WHERE C.CODIGOFORMAPAGO = '${codigo}'
            AND C.ANODOCUMENTO >= 2024
            AND C.NUMEROFACTURA > 0
            ORDER BY C.ANODOCUMENTO DESC, C.NUMEROFACTURA DESC
            FETCH FIRST 3 ROWS ONLY
        `);
        
        if (ejemplos.length > 0) {
            console.log(`\n📌 [${codigo}] ${desc}: ${ejemplos.length} ejemplos`);
            ejemplos.forEach((e, i) => {
                const cliente = (e.NOMBRECLIENTE || 'Sin nombre').trim();
                const codigo = (e.CODIGOCLIENTEFACTURA || '').trim();
                console.log(`   ${i + 1}. Cliente ${codigo}: ${cliente}`);
                console.log(`      Factura ${e.SERIEFACTURA} ${e.NUMEROFACTURA} | ${e.DIADOCUMENTO}/${e.MESDOCUMENTO}/${e.ANODOCUMENTO} | €${parseFloat(e.IMPORTETOTAL).toFixed(2)}`);
            });
        } else {
            console.log(`\n⚪ [${codigo}] ${desc}: Sin facturas recientes (2024-2025)`);
        }
    }
    
    // 3. Estadísticas
    console.log('\n\n3. ESTADÍSTICAS 2024-2025:\n');
    
    const stats = await conn.query(`
        SELECT C.CODIGOFORMAPAGO, F.DESCRIPCIONFORMAPAGO, COUNT(*) as TOTAL
        FROM DSEDAC.CAC C
        LEFT JOIN DSEDAC.FPG F ON C.CODIGOFORMAPAGO = F.CODIGOFORMAPAGO
        WHERE C.ANODOCUMENTO >= 2024
        AND C.NUMEROFACTURA > 0
        GROUP BY C.CODIGOFORMAPAGO, F.DESCRIPCIONFORMAPAGO
        ORDER BY TOTAL DESC
    `);
    
    const totalFacturas = stats.reduce((sum, s) => sum + s.TOTAL, 0);
    
    stats.forEach(s => {
        const porcentaje = ((s.TOTAL / totalFacturas) * 100).toFixed(1);
        console.log(`   [${String(s.CODIGOFORMAPAGO).trim()}] ${(s.DESCRIPCIONFORMAPAGO || 'Sin descripción').trim().padEnd(30)} ${String(s.TOTAL).padStart(6)} facturas (${porcentaje}%)`);
    });
    
    console.log(`\n   ${'TOTAL'.padEnd(35)} ${String(totalFacturas).padStart(6)} facturas`);
    
    await conn.close();
    console.log('\n✅ Análisis completado\n');
}

buscarOtrasFormasPago().catch(console.error);
