const odbc = require('odbc');
require('dotenv').config();

async function test() {
    const conn = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Test 1: Probar tabla CAC básica
    console.log('Test 1: SELECT básico de CAC...');
    try {
        const r1 = await conn.query(`SELECT * FROM DSEDAC.CAC FETCH FIRST 1 ROWS ONLY`);
        console.log('✅ CAC funciona. Columnas:', Object.keys(r1[0]).length);
    } catch (e) {
        console.log('❌ CAC error:', e.message);
    }
    
    // Test 2: WHERE CODIGOCLIENTE
    console.log('\nTest 2: Buscar cliente 4300000281...');
    try {
        const r2 = await conn.query(`
            SELECT CODIGOCLIENTE, SERIEFACTURA, NUMEROFACTURA 
            FROM DSEDAC.CAC 
            WHERE CODIGOCLIENTE = '4300000281'
            FETCH FIRST 5 ROWS ONLY
        `);
        console.log(`✅ Encontradas ${r2.length} facturas`);
        r2.forEach(f => console.log(`   - ${f.SERIEFACTURA} ${f.NUMEROFACTURA}`));
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
    
    // Test 3: Con importes
    console.log('\nTest 3: Con importes...');
    try {
        const r3 = await conn.query(`
            SELECT SERIEFACTURA, NUMEROFACTURA, TOTALFACTURA, IMPORTECOBRADOPENDIENTE
            FROM DSEDAC.CAC 
            WHERE CODIGOCLIENTE = '4300000281'
            ORDER BY ANODOCUMENTO DESC
            FETCH FIRST 5 ROWS ONLY
        `);
        console.log(`✅ Datos con importes:`);
        r3.forEach(f => {
            console.log(`   ${f.SERIEFACTURA} ${f.NUMEROFACTURA}: Total=€${f.TOTALFACTURA}, Pendiente=€${f.IMPORTECOBRADOPENDIENTE}`);
        });
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
    
    await conn.close();
}

test();
