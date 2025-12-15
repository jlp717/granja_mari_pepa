/**
 * Ver códigos de verificación
 */
require('dotenv').config();
const pool = require('../app/config/odbcConfig');

async function ver() {
  await pool.initialize();
  const c = await pool.acquire();
  
  const r = await c.query(`
    SELECT 
      ID,
      TRIM(CODIGO_CLIENTE) as CLIENTE,
      CODIGO_VERIFICACION as CODIGO,
      INTENTOS,
      FECHA_CREACION,
      FECHA_EXPIRACION,
      USADO,
      CASE WHEN FECHA_EXPIRACION > CURRENT_TIMESTAMP THEN 'VIGENTE' ELSE 'EXPIRADO' END as ESTADO
    FROM JAVIER.VERIFICATION_CODES 
    ORDER BY FECHA_CREACION DESC 
    FETCH FIRST 10 ROWS ONLY
  `);
  
  console.log('\n=== CÓDIGOS DE VERIFICACIÓN ===\n');
  r.forEach(row => {
    console.log(`Cliente: ${row.CLIENTE}`);
    console.log(`  Código: ${row.CODIGO}`);
    console.log(`  Usado: ${row.USADO}`);
    console.log(`  Estado: ${row.ESTADO}`);
    console.log(`  Intentos: ${row.INTENTOS}`);
    console.log(`  Creado: ${row.FECHA_CREACION}`);
    console.log(`  Expira: ${row.FECHA_EXPIRACION}`);
    console.log('---');
  });
  
  await pool.release(c);
  await pool.close();
}

ver();
