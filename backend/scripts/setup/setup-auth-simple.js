/**
 * Script simplificado de configuración inicial - AUTENTICACIÓN
 */

const odbc = require('odbc');
const bcrypt = require('bcrypt');
require('dotenv').config();

const args = process.argv.slice(2);
const BCRYPT_ROUNDS = 12;

async function setupAuth() {
  let connection;

  try {
    console.log('\n========================================');
    console.log('SETUP DE AUTENTICACIÓN INICIAL');
    console.log('========================================\n');

    // Verificar argumentos
    if (args.length < 2) {
      console.error('❌ Error: Faltan argumentos');
      console.log('\nUso: node setup-auth-simple.js [codigoCliente] [password]\n');
      console.log('Ejemplo: node setup-auth-simple.js 4300000281 miPassword123\n');
      process.exit(1);
    }

    const [codigoCliente, password] = args;

    console.log(`📋 Creando credenciales para cliente: ${codigoCliente}\n`);

    // 1. Conectar a la base de datos
    console.log('1. Conectando a la base de datos...');
    const connectionString = process.env.ODBC_CONNECTION_STRING;

    if (!connectionString) {
      console.error('❌ Error: ODBC_CONNECTION_STRING no está configurado en .env');
      process.exit(1);
    }

    connection = await odbc.connect(connectionString);
    console.log('   ✅ Conectado\n');

    // 2. Verificar que el cliente existe
    console.log('2. Verificando que el cliente existe en CLI...');

    const clienteExiste = await connection.query(`
      SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE = ?
      FETCH FIRST 1 ROWS ONLY
    `, [codigoCliente]);

    if (clienteExiste.length === 0) {
      console.error(`\n   ❌ Error: El cliente ${codigoCliente} no existe en la base de datos`);
      console.log('\n   Verif ique que el código de cliente sea correcto.\n');
      process.exit(1);
    }

    console.log(`   ✅ Cliente encontrado: ${clienteExiste[0].NOMBRECLIENTE.trim()}`);
    console.log(`   📝 NIF: ${clienteExiste[0].NIF.trim()}\n`);

    // 3. Generar hash de contraseña
    console.log('3. Generando hash de contraseña...');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    console.log('   ✅ Hash generado\n');

    // 4. Verificar si ya tiene credenciales
    console.log('4. Verificando credenciales existentes...');

    const credencialesExisten = await connection.query(`
      SELECT CODIGOCLIENTE
      FROM DSEDAC.CLI_AUTH
      WHERE CODIGOCLIENTE = ?
      FETCH FIRST 1 ROWS ONLY
    `, [codigoCliente]);

    if (credencialesExisten.length > 0) {
      console.log('   ⚠️  Ya existen credenciales, actualizando...\n');

      await connection.query(`
        UPDATE DSEDAC.CLI_AUTH
        SET PASSWORD_HASH = ?,
            UPDATED_AT = CURRENT_TIMESTAMP,
            LOGIN_ATTEMPTS = 0,
            LOCKED_UNTIL = NULL
        WHERE CODIGOCLIENTE = ?
      `, [passwordHash, codigoCliente]);

      console.log('   ✅ Credenciales actualizadas\n');
    } else {
      console.log('   📝 No existen credenciales, creando nuevas...\n');

      await connection.query(`
        INSERT INTO DSEDAC.CLI_AUTH (
          CODIGOCLIENTE,
          PASSWORD_HASH,
          CREATED_AT,
          UPDATED_AT,
          LOGIN_ATTEMPTS
        ) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
      `, [codigoCliente, passwordHash]);

      console.log('   ✅ Credenciales creadas\n');
    }

    // 5. Verificar secretos JWT
    console.log('5. Verificando secretos JWT...');

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.log('   ⚠️  Secretos JWT NO configurados en .env');
      console.log('   Por favor, agregue las variables JWT_ACCESS_SECRET y JWT_REFRESH_SECRET\n');
    } else {
      console.log('   ✅ Secretos JWT configurados\n');
    }

    // 6. Resumen
    console.log('========================================');
    console.log('✅ SETUP COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    console.log('📝 Información de login:\n');
    console.log(`   Código Cliente: ${codigoCliente}`);
    console.log(`   NIF:            ${clienteExiste[0].NIF.trim()}`);
    console.log(`   Contraseña:     ${password}\n`);

    console.log('🔐 Para hacer login use:\n');
    console.log('   POST /api/auth/login');
    console.log('   Body: {');
    console.log(`     "codigoCliente": "${codigoCliente}",`);
    console.log(`     "nif": "${clienteExiste[0].NIF.trim()}",`);
    console.log(`     "password": "${password}"`);
    console.log('   }\n');

    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

setupAuth();
