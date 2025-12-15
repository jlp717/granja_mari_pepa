/**
 * SCRIPT PARA REGISTRAR CONTRASEÑA DE CLIENTE
 * =============================================
 * Inserta password hasheado en CLI_AUTH
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const odbc = require('odbc');

async function registrarPassword() {
  let connection;
  
  try {
    const codigoCliente = '4300009900';
    const password = '23224478K'; // NIF como contraseña
    
    console.log(`🔐 Registrando contraseña para cliente ${codigoCliente}...`);
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Verificar si el cliente existe en CLI
    const checkCliente = await connection.query(
      `SELECT CODIGOCLIENTE, NIF FROM CLI WHERE TRIM(CODIGOCLIENTE) = ?`,
      [codigoCliente]
    );
    
    if (!checkCliente || checkCliente.length === 0) {
      throw new Error('Cliente no encontrado en CLI');
    }
    
    console.log(`✅ Cliente encontrado: ${checkCliente[0].CODIGOCLIENTE}`);
    console.log(`   NIF: ${checkCliente[0].NIF}`);
    
    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`✅ Password hasheado con bcrypt`);
    
    // Verificar si ya existe en CLI_AUTH
    const checkAuth = await connection.query(
      `SELECT CODIGOCLIENTE FROM CLI_AUTH WHERE TRIM(CODIGOCLIENTE) = ?`,
      [codigoCliente]
    );
    
    if (checkAuth && checkAuth.length > 0) {
      // UPDATE
      await connection.query(
        `UPDATE CLI_AUTH 
         SET PASSWORD_HASH = ?, 
             UPDATED_AT = CURRENT_TIMESTAMP, 
             LOGIN_ATTEMPTS = 0, 
             LOCKED_UNTIL = NULL 
         WHERE TRIM(CODIGOCLIENTE) = ?`,
        [passwordHash, codigoCliente]
      );
      console.log(`✅ Contraseña actualizada en CLI_AUTH`);
    } else {
      // INSERT
      await connection.query(
        `INSERT INTO CLI_AUTH (CODIGOCLIENTE, PASSWORD_HASH, CREATED_AT, UPDATED_AT, LOGIN_ATTEMPTS)
         VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)`,
        [codigoCliente, passwordHash]
      );
      console.log(`✅ Contraseña insertada en CLI_AUTH`);
    }
    
    console.log(`\n🎉 COMPLETADO`);
    console.log(`\nPuedes hacer login con:`);
    console.log(`  - Código Cliente: ${codigoCliente}`);
    console.log(`  - Contraseña: ${password}`);
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.odbcErrors) {
      error.odbcErrors.forEach(e => console.error(`  - ${e.message}`));
    }
    process.exit(1);
  }
}

registrarPassword();
