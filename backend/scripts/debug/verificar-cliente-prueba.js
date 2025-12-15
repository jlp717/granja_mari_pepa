require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../app/config/odbcConfig');

async function verificar() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  // Buscar cliente 4300000000
  const r = await conn.query(`
    SELECT TRIM(CODIGO_CLIENTE) as CODIGO, PASSWORD_HASH, PASSWORD_TYPE 
    FROM JAVIER.CUSTOMER_CREDENTIALS 
    WHERE TRIM(CODIGO_CLIENTE) = '4300000000'
  `);
  
  console.log('Cliente 4300000000 encontrado:', r.length > 0);
  
  if (r.length > 0) {
    console.log('Password Type:', r[0].PASSWORD_TYPE);
    console.log('Hash (primeros 20 chars):', r[0].PASSWORD_HASH.substring(0, 20));
    
    // Probar password
    const testPassword = 'Test2024!';
    const match = await bcrypt.compare(testPassword, r[0].PASSWORD_HASH);
    console.log('Test2024! coincide:', match);
  }
  
  await pool.release(conn);
  process.exit(0);
}

verificar();
