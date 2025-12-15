/**
 * Actualizar fecha de último cambio de contraseña para permitir reset
 */
require('dotenv').config();
const pool = require('../app/config/odbcConfig');

async function actualizar() {
  await pool.initialize();
  const c = await pool.acquire();
  
  console.log('Actualizando ULTIMO_CAMBIO_PASSWORD para cliente 4300000000...');
  
  // Poner fecha de hace 31 días para permitir cambio
  await c.query(`
    UPDATE JAVIER.CUSTOMER_CREDENTIALS 
    SET ULTIMO_CAMBIO_PASSWORD = CURRENT_TIMESTAMP - 31 DAYS 
    WHERE TRIM(CODIGO_CLIENTE) = '4300000000'
  `);
  
  console.log('✅ Actualizado - ahora puede cambiar contraseña');
  
  const r = await c.query(`
    SELECT 
      TRIM(CODIGO_CLIENTE) as COD, 
      ULTIMO_CAMBIO_PASSWORD,
      FECHA_MODIFICACION
    FROM JAVIER.CUSTOMER_CREDENTIALS 
    WHERE TRIM(CODIGO_CLIENTE) = '4300000000'
  `);
  
  console.table(r);
  
  await pool.release(c);
  await pool.close();
}

actualizar();
