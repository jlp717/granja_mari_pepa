/**
 * Buscar clientes disponibles para usar como prueba
 */
require('dotenv').config();
const pool = require('../app/config/odbcConfig');

async function buscar() {
  await pool.initialize();
  const c = await pool.acquire();
  
  console.log('='.repeat(60));
  console.log('CLIENTES DISPONIBLES PARA PRUEBAS');
  console.log('='.repeat(60));
  
  // Buscar últimos clientes
  const r = await c.query(`
    SELECT 
      TRIM(CODIGOCLIENTE) as COD, 
      TRIM(NOMBRECLIENTE) as NOMBRE, 
      TRIM(NIF) as NIF
    FROM DSEDAC.CLI 
    WHERE CODIGOCLIENTE LIKE '43%'
    ORDER BY CODIGOCLIENTE DESC 
    FETCH FIRST 15 ROWS ONLY
  `);
  
  console.log('\nÚltimos clientes en CLI:');
  console.table(r);
  
  // Ver cuáles ya tienen credenciales en JAVIER
  const creds = await c.query(`
    SELECT TRIM(CODIGO_CLIENTE) as COD, PASSWORD_TYPE 
    FROM JAVIER.CUSTOMER_CREDENTIALS
  `);
  
  console.log('\nClientes con credenciales en JAVIER:');
  console.table(creds);
  
  await pool.release(c);
  await pool.close();
}

buscar();
