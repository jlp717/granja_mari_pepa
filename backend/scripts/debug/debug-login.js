/**
 * Script de diagnóstico de login
 */
const bcrypt = require('bcrypt');
const pool = require('../app/config/odbcConfig');

const CODIGO_CLIENTE = '4300000000';
const PASSWORD_TEST = 'jj29jj29N#';

async function debug() {
  let conn;
  try {
    // Inicializar pool
    await pool.initialize();
    
    conn = await pool.acquire();
    
    // 1. Verificar credenciales
    console.log('\n=== VERIFICANDO CREDENCIALES ===');
    const creds = await conn.query(`
      SELECT 
        CODIGO_CLIENTE,
        PASSWORD_HASH,
        ACTIVO,
        BLOQUEADO,
        INTENTOS_FALLIDOS,
        ULTIMO_CAMBIO_PASSWORD
      FROM JAVIER.CUSTOMER_CREDENTIALS 
      WHERE TRIM(CODIGO_CLIENTE) = ?
    `, [CODIGO_CLIENTE]);
    
    if (creds.length === 0) {
      console.log('❌ NO hay credenciales para este cliente');
      return;
    }
    
    const c = creds[0];
    console.log('Código Cliente:', c.CODIGO_CLIENTE);
    console.log('Hash almacenado:', c.PASSWORD_HASH?.substring(0, 30) + '...');
    console.log('Activo:', c.ACTIVO);
    console.log('Bloqueado:', c.BLOQUEADO);
    console.log('Intentos fallidos:', c.INTENTOS_FALLIDOS);
    console.log('Último cambio:', c.ULTIMO_CAMBIO_PASSWORD);
    
    // 2. Verificar bcrypt
    console.log('\n=== COMPARANDO PASSWORD ===');
    console.log('Password a probar:', PASSWORD_TEST);
    console.log('Longitud:', PASSWORD_TEST.length);
    
    const match = await bcrypt.compare(PASSWORD_TEST, c.PASSWORD_HASH);
    console.log('¿Match?:', match ? '✅ SÍ' : '❌ NO');
    
    if (!match) {
      // Probar variaciones comunes
      const variaciones = [
        PASSWORD_TEST.trim(),
        PASSWORD_TEST.toUpperCase(),
        PASSWORD_TEST.toLowerCase(),
        PASSWORD_TEST.replace('#', ''),
        'Test2024!', // password anterior
      ];
      
      console.log('\nProbando variaciones...');
      for (const v of variaciones) {
        const m = await bcrypt.compare(v, c.PASSWORD_HASH);
        console.log(`  "${v}" -> ${m ? '✅' : '❌'}`);
      }
    }
    
    // 3. Verificar código de verificación usado
    console.log('\n=== ÚLTIMOS CÓDIGOS DE VERIFICACIÓN ===');
    const codes = await conn.query(`
      SELECT 
        CODIGO_VERIFICACION,
        USADO,
        FECHA_CREACION,
        FECHA_EXPIRACION
      FROM JAVIER.VERIFICATION_CODES 
      WHERE TRIM(CODIGO_CLIENTE) = ?
      ORDER BY FECHA_CREACION DESC
      FETCH FIRST 3 ROWS ONLY
    `, [CODIGO_CLIENTE]);
    
    codes.forEach(code => {
      console.log(`Código: ${code.CODIGO_VERIFICACION}, Usado: ${code.USADO}, Creado: ${code.FECHA_CREACION}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (conn) await pool.release(conn);
    await pool.close();
  }
}

debug();
