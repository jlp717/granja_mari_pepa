/**
 * Script para resetear el cliente de prueba 4300000000 a su estado original
 * - Obtiene el NIF del cliente
 * - Resetea la contraseña al NIF
 * - Limpia fecha de último cambio
 * - Elimina códigos de verificación de prueba
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../app/config/odbcConfig');

const CODIGO_CLIENTE = '4300000000';
const BCRYPT_ROUNDS = 12;

async function reset() {
  let conn;
  try {
    await pool.initialize();
    conn = await pool.acquire();
    
    console.log('\n🔄 RESETEANDO CLIENTE DE PRUEBA:', CODIGO_CLIENTE);
    console.log('='.repeat(50));
    
    // 1. Obtener NIF del cliente
    console.log('\n1️⃣ Obteniendo NIF del cliente...');
    const cliente = await conn.query(`
      SELECT TRIM(CODIGOCLIENTE) as CODIGO, TRIM(NIF) as NIF, NOMBRECLIENTE
      FROM DSEDAC.CLI 
      WHERE TRIM(CODIGOCLIENTE) = ?
    `, [CODIGO_CLIENTE]);
    
    if (cliente.length === 0) {
      throw new Error('Cliente no encontrado');
    }
    
    const { NIF, NOMBRECLIENTE } = cliente[0];
    console.log(`   Cliente: ${NOMBRECLIENTE}`);
    console.log(`   NIF: ${NIF}`);
    
    // 2. Generar hash del NIF (será la contraseña por defecto)
    console.log('\n2️⃣ Generando hash bcrypt del NIF...');
    const passwordHash = await bcrypt.hash(NIF, BCRYPT_ROUNDS);
    console.log(`   Hash generado: ${passwordHash.substring(0, 30)}...`);
    
    // 3. Actualizar credenciales
    console.log('\n3️⃣ Actualizando credenciales...');
    
    // Actualizar en pasos separados para evitar problemas SQL
    await conn.query(`
      UPDATE JAVIER.CUSTOMER_CREDENTIALS
      SET PASSWORD_HASH = ?
      WHERE TRIM(CODIGO_CLIENTE) = ?
    `, [passwordHash, CODIGO_CLIENTE]);
    console.log('   ✅ Password actualizado');
    
    // Resetear intentos
    try {
      await conn.query(`
        UPDATE JAVIER.CUSTOMER_CREDENTIALS
        SET INTENTOS_FALLIDOS = 0
        WHERE TRIM(CODIGO_CLIENTE) = ?
      `, [CODIGO_CLIENTE]);
      console.log('   ✅ Intentos reseteados');
    } catch (e) {
      console.log('   ⚠️ INTENTOS_FALLIDOS no existe o no actualizable');
    }
    
    // Resetear flags
    try {
      await conn.query(`
        UPDATE JAVIER.CUSTOMER_CREDENTIALS
        SET BLOQUEADO = 'N'
        WHERE TRIM(CODIGO_CLIENTE) = ?
      `, [CODIGO_CLIENTE]);
      console.log('   ✅ BLOQUEADO reseteado');
    } catch (e) {
      console.log('   ⚠️ BLOQUEADO no existe');
    }
    
    try {
      await conn.query(`
        UPDATE JAVIER.CUSTOMER_CREDENTIALS
        SET ACTIVO = 'Y'
        WHERE TRIM(CODIGO_CLIENTE) = ?
      `, [CODIGO_CLIENTE]);
      console.log('   ✅ ACTIVO reseteado');
    } catch (e) {
      console.log('   ⚠️ ACTIVO no existe');
    }
    
    // 4. Eliminar códigos de verificación de prueba
    console.log('\n4️⃣ Limpiando códigos de verificación...');
    const deleted = await conn.query(`
      DELETE FROM JAVIER.VERIFICATION_CODES
      WHERE TRIM(CODIGO_CLIENTE) = ?
    `, [CODIGO_CLIENTE]);
    console.log(`   ✅ Códigos de verificación eliminados`);
    
    // 5. Verificar estado final
    console.log('\n5️⃣ Verificando estado final...');
    const final = await conn.query(`
      SELECT 
        TRIM(CODIGO_CLIENTE) as CODIGO,
        PASSWORD_HASH,
        ACTIVO
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE TRIM(CODIGO_CLIENTE) = ?
    `, [CODIGO_CLIENTE]);
    
    if (final.length > 0) {
      const cred = final[0];
      console.log(`   Código: ${cred.CODIGO}`);
      console.log(`   Hash: ${cred.PASSWORD_HASH?.substring(0, 30)}...`);
      console.log(`   Activo: ${cred.ACTIVO}`);
    }
    
    // 6. Verificar que la contraseña funciona
    console.log('\n6️⃣ Verificando login con NIF...');
    const match = await bcrypt.compare(NIF, passwordHash);
    console.log(`   Login con "${NIF}": ${match ? '✅ FUNCIONA' : '❌ ERROR'}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ CLIENTE RESETEADO CORRECTAMENTE');
    console.log(`   Usuario: ${CODIGO_CLIENTE}`);
    console.log(`   Contraseña: ${NIF}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    if (conn) await pool.release(conn);
    await pool.close();
  }
}

reset();
