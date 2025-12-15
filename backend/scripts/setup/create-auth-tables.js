/**
 * Script para crear tablas de autenticación en la base de datos
 * Crea:
 * - CLI_AUTH: Almacena contraseñas hasheadas de clientes
 * - CLI_TOKENS: Almacena tokens JWT de refresco
 */

const odbc = require('odbc');
require('dotenv').config();

const connectionString = process.env.ODBC_CONNECTION_STRING;

async function createAuthTables() {
  let connection;

  try {
    console.log('\n======================================');
    console.log('CREACIÓN DE TABLAS DE AUTENTICACIÓN');
    console.log('======================================\n');

    console.log('1. Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado a la base de datos\n');

    // ========================================
    // TABLA CLI_AUTH
    // ========================================
    console.log('2. Creando tabla CLI_AUTH...');
    try {
      // Primero intentar eliminar si existe
      try {
        await connection.query('DROP TABLE DSEDAC.CLI_AUTH');
        console.log('   ⚠️  Tabla CLI_AUTH existente eliminada');
      } catch (err) {
        // No existe, está bien
      }

      // Crear tabla CLI_AUTH
      const createCliAuthSQL = `
        CREATE TABLE DSEDAC.CLI_AUTH (
          CODIGOCLIENTE CHAR(10) NOT NULL,
          PASSWORD_HASH VARCHAR(255) NOT NULL,
          CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          LAST_LOGIN TIMESTAMP,
          LOGIN_ATTEMPTS INTEGER NOT NULL DEFAULT 0,
          LOCKED_UNTIL TIMESTAMP,
          PRIMARY KEY (CODIGOCLIENTE)
        )
      `;

      await connection.query(createCliAuthSQL);
      console.log('   ✅ Tabla CLI_AUTH creada correctamente');

      // Crear índice para búsquedas rápidas
      await connection.query(`
        CREATE INDEX CLI_AUTH_IDX1 ON DSEDAC.CLI_AUTH (CODIGOCLIENTE)
      `);
      console.log('   ✅ Índice creado en CLI_AUTH\n');

    } catch (err) {
      console.error('   ❌ Error creando CLI_AUTH:', err.message);
      throw err;
    }

    // ========================================
    // TABLA CLI_TOKENS
    // ========================================
    console.log('3. Creando tabla CLI_TOKENS...');
    try {
      // Primero intentar eliminar si existe
      try {
        await connection.query('DROP TABLE DSEDAC.CLI_TOKENS');
        console.log('   ⚠️  Tabla CLI_TOKENS existente eliminada');
      } catch (err) {
        // No existe, está bien
      }

      // Crear tabla CLI_TOKENS
      const createCliTokensSQL = `
        CREATE TABLE DSEDAC.CLI_TOKENS (
          TOKEN_ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
          CODIGOCLIENTE CHAR(10) NOT NULL,
          REFRESH_TOKEN VARCHAR(500) NOT NULL,
          DEVICE_INFO VARCHAR(500),
          IP_ADDRESS VARCHAR(45),
          CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          EXPIRES_AT TIMESTAMP NOT NULL,
          REVOKED CHAR(1) NOT NULL DEFAULT 'N',
          REVOKED_AT TIMESTAMP,
          PRIMARY KEY (TOKEN_ID)
        )
      `;

      await connection.query(createCliTokensSQL);
      console.log('   ✅ Tabla CLI_TOKENS creada correctamente');

      // Crear índices
      await connection.query(`
        CREATE INDEX CLI_TOKENS_IDX1 ON DSEDAC.CLI_TOKENS (CODIGOCLIENTE)
      `);
      await connection.query(`
        CREATE INDEX CLI_TOKENS_IDX2 ON DSEDAC.CLI_TOKENS (REFRESH_TOKEN)
      `);
      await connection.query(`
        CREATE INDEX CLI_TOKENS_IDX3 ON DSEDAC.CLI_TOKENS (EXPIRES_AT)
      `);
      console.log('   ✅ Índices creados en CLI_TOKENS\n');

    } catch (err) {
      console.error('   ❌ Error creando CLI_TOKENS:', err.message);
      throw err;
    }

    // ========================================
    // TABLA CLI_LOGIN_HISTORY (Opcional - Auditoría)
    // ========================================
    console.log('4. Creando tabla CLI_LOGIN_HISTORY...');
    try {
      // Primero intentar eliminar si existe
      try {
        await connection.query('DROP TABLE DSEDAC.CLI_LOGIN_HISTORY');
        console.log('   ⚠️  Tabla CLI_LOGIN_HISTORY existente eliminada');
      } catch (err) {
        // No existe, está bien
      }

      const createLoginHistorySQL = `
        CREATE TABLE DSEDAC.CLI_LOGIN_HISTORY (
          HISTORY_ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
          CODIGOCLIENTE CHAR(10) NOT NULL,
          LOGIN_TIME TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          IP_ADDRESS VARCHAR(45),
          USER_AGENT VARCHAR(500),
          SUCCESS CHAR(1) NOT NULL,
          FAILURE_REASON VARCHAR(200),
          PRIMARY KEY (HISTORY_ID)
        )
      `;

      await connection.query(createLoginHistorySQL);
      console.log('   ✅ Tabla CLI_LOGIN_HISTORY creada correctamente');

      // Crear índices
      await connection.query(`
        CREATE INDEX CLI_LOGIN_HISTORY_IDX1 ON DSEDAC.CLI_LOGIN_HISTORY (CODIGOCLIENTE)
      `);
      await connection.query(`
        CREATE INDEX CLI_LOGIN_HISTORY_IDX2 ON DSEDAC.CLI_LOGIN_HISTORY (LOGIN_TIME)
      `);
      console.log('   ✅ Índices creados en CLI_LOGIN_HISTORY\n');

    } catch (err) {
      console.error('   ❌ Error creando CLI_LOGIN_HISTORY:', err.message);
      throw err;
    }

    // ========================================
    // VERIFICACIÓN
    // ========================================
    console.log('5. Verificando tablas creadas...');
    const tables = await connection.query(`
      SELECT TABLE_NAME, TABLE_TYPE
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'DSEDAC'
        AND TABLE_NAME IN ('CLI_AUTH', 'CLI_TOKENS', 'CLI_LOGIN_HISTORY')
      ORDER BY TABLE_NAME
    `);

    console.log(`   ✅ Verificadas ${tables.length} tablas:`);
    tables.forEach(t => {
      console.log(`      - ${t.TABLE_NAME} (${t.TABLE_TYPE})`);
    });

    console.log('\n======================================');
    console.log('✅ TABLAS CREADAS EXITOSAMENTE');
    console.log('======================================\n');

    console.log('📝 Próximos pasos:');
    console.log('   1. Ejecutar script de setup para crear usuario inicial');
    console.log('   2. Configurar servicios de autenticación en el backend');
    console.log('   3. Probar login con credenciales reales\n');

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('✅ Conexión cerrada\n');
    }
  }
}

createAuthTables();
