require('dotenv').config();
const odbc = require('odbc');

async function analizarFacturas() {
  let connection;
  
  try {
    console.log('🔍 Analizando estructura de facturas...\n');
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Ver un ejemplo de factura
    const facturas = await connection.query(`
      SELECT * FROM HCPC_BK1 
      WHERE KCCDCL <> '' 
      ORDER BY KCAADC DESC, KCMMDC DESC, KCDDDC DESC
      LIMIT 5
    `);
    
    console.log('📋 EJEMPLOS DE FACTURAS:');
    console.log('='.repeat(100));
    facturas.forEach((fac, i) => {
      console.log(`\nFactura ${i + 1}:`);
      Object.entries(fac).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
    
    await connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analizarFacturas();
