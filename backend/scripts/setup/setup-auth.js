/**
 * SCRIPT DE CONFIGURACIÓN INICIAL - AUTENTICACIÓN
 *
 * Este script crea un usuario de prueba en la base de datos
 * para poder hacer login inicial.
 *
 * IMPORTANTE: Ejecutar solo una vez después de crear las tablas de autenticación
 *
 * Uso:
 *   node setup-auth.js [codigoCliente] [password]
 *
 * Ejemplo:
 *   node setup-auth.js 4300000281 miPassword123
 */

const authService = require('./app/services/authService');
const tokenService = require('./app/services/tokenService');
const logger = require('./app/utils/logger');
require('dotenv').config();

const args = process.argv.slice(2);

async function setupAuth() {
  try {
    console.log('\n========================================');
    console.log('SETUP DE AUTENTICACIÓN INICIAL');
    console.log('========================================\n');

    // Verificar argumentos
    if (args.length < 2) {
      console.error('❌ Error: Faltan argumentos');
      console.log('\nUso: node setup-auth.js [codigoCliente] [password]\n');
      console.log('Ejemplo: node setup-auth.js 4300000281 miPassword123\n');
      process.exit(1);
    }

    const [codigoCliente, password] = args;

    console.log(`📋 Creando credenciales para cliente: ${codigoCliente}`);

    // 1. Verificar que el cliente existe en la tabla CLI
    console.log('\n1. Verificando que el cliente existe en CLI...');
    const odbcPool = require('./app/config/odbcConfig');
    let connection;

    // Inicializar pool si no está inicializado
    try {
      await odbcPool.initialize();
    } catch (err) {
      // Ya está inicializado, continuar
    }

    try {
      connection = await odbcPool.acquire();

      const clienteExiste = await connection.query(`
        SELECT CODIGOCLIENTE, NOMBRECLIENTE, NIF
        FROM DSEDAC.CLI
        WHERE CODIGOCLIENTE = ?
        FETCH FIRST 1 ROWS ONLY
      `, [codigoCliente]);

      if (clienteExiste.length === 0) {
        console.error(`\n❌ Error: El cliente ${codigoCliente} no existe en la base de datos`);
        console.log('\nVerifique que el código de cliente sea correcto.');
        process.exit(1);
      }

      console.log(`   ✅ Cliente encontrado: ${clienteExiste[0].NOMBRECLIENTE.trim()}`);
      console.log(`   📝 NIF: ${clienteExiste[0].NIF.trim()}`);

    } finally {
      if (connection) {
        await odbcPool.release(connection);
      }
    }

    // 2. Crear o actualizar credenciales
    console.log('\n2. Creando credenciales de autenticación...');

    try {
      await authService.registrarCredenciales(codigoCliente, password);
      console.log('   ✅ Credenciales creadas/actualizadas exitosamente');
    } catch (error) {
      console.error(`\n❌ Error creando credenciales: ${error.message}`);
      process.exit(1);
    }

    // 3. Generar secretos JWT si no existen
    console.log('\n3. Verificando secretos JWT...');

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.log('   ⚠️  Secretos JWT no configurados');
      console.log('   🔑 Generando nuevos secretos...\n');

      const secretos = tokenService.constructor.generarSecretos();

      console.log('   Agregue estos secretos a su archivo .env:\n');
      console.log('   ═══════════════════════════════════════════════════');
      console.log(`   JWT_ACCESS_SECRET=${secretos.accessSecret}`);
      console.log(`   JWT_REFRESH_SECRET=${secretos.refreshSecret}`);
      console.log('   ═══════════════════════════════════════════════════\n');
      console.log('   IMPORTANTE: Guarde estos secretos de forma segura');
      console.log('   NO los comparta ni los suba a control de versiones\n');
    } else {
      console.log('   ✅ Secretos JWT ya configurados');
    }

    // 4. Resumen
    console.log('\n========================================');
    console.log('✅ SETUP COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    console.log('📝 Información de login:\n');
    console.log(`   Código Cliente: ${codigoCliente}`);
    console.log(`   Contraseña:     ${password}`);
    console.log(`   (También necesitará el NIF del cliente para hacer login)\n`);

    console.log('🔐 Próximos pasos:\n');
    console.log('   1. Asegúrese de que los secretos JWT estén en .env');
    console.log('   2. Inicie el servidor: npm start');
    console.log('   3. Haga login con: POST /api/auth/login');
    console.log('      Body: { codigoCliente, nif, password }\n');

    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

setupAuth();
