require('dotenv').config();
const odbc = require('odbc');

async function migrarAuth() {
  let connection;
  
  try {
    console.log('🔄 Migrando autenticación de DSEDAC a JAVIER...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // 1. Crear CUSTOMER_PASSWORDS
    console.log('📝 Creando JAVIER.CUSTOMER_PASSWORDS...');
    try {
      await connection.query(`
        CREATE TABLE JAVIER.CUSTOMER_PASSWORDS (
          CODIGO_CLIENTE CHAR(13) NOT NULL PRIMARY KEY,
          PASSWORD_HASH VARCHAR(255) NOT NULL,
          INTENTOS_FALLIDOS INTEGER DEFAULT 0,
          BLOQUEADO_HASTA TIMESTAMP,
          ULTIMO_LOGIN TIMESTAMP,
          FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla CUSTOMER_PASSWORDS creada');
    } catch (error) {
      if (error.message.includes('ya existe') || error.message.includes('already exists')) {
        console.log('⚠️  Tabla CUSTOMER_PASSWORDS ya existe');
      } else {
        throw error;
      }
    }
    
    // 2. Crear REFRESH_TOKENS
    console.log('\n📝 Creando JAVIER.REFRESH_TOKENS...');
    try {
      await connection.query(`
        CREATE TABLE JAVIER.REFRESH_TOKENS (
          ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          CODIGO_CLIENTE CHAR(13) NOT NULL,
          REFRESH_TOKEN VARCHAR(500) NOT NULL,
          DEVICE_INFO VARCHAR(255),
          IP_ADDRESS VARCHAR(50),
          FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FECHA_EXPIRACION TIMESTAMP NOT NULL,
          REVOCADO CHAR(1) DEFAULT '0'
        )
      `);
      console.log('✅ Tabla REFRESH_TOKENS creada');
      
      await connection.query(`CREATE INDEX REFRESH_TOKENS_IDX1 ON JAVIER.REFRESH_TOKENS(CODIGO_CLIENTE)`);
      await connection.query(`CREATE INDEX REFRESH_TOKENS_IDX2 ON JAVIER.REFRESH_TOKENS(REVOCADO)`);
      console.log('✅ Índices creados');
    } catch (error) {
      if (error.message.includes('ya existe') || error.message.includes('already exists')) {
        console.log('⚠️  Tabla REFRESH_TOKENS ya existe');
      } else {
        throw error;
      }
    }
    
    // 3. Migrar datos de CLI_AUTH
    console.log('\n🔄 Migrando datos de DSEDAC.CLI_AUTH...');
    const existingPasswords = await connection.query(`
      SELECT CODIGOCLIENTE, PASSWORD_HASH, LOGIN_ATTEMPTS, LOCKED_UNTIL, LAST_LOGIN, CREATED_AT, UPDATED_AT
      FROM DSEDAC.CLI_AUTH
    `);
    
    console.log(`   Encontrados ${existingPasswords.length} registros en CLI_AUTH`);
    
    for (const record of existingPasswords) {
      try {
        await connection.query(`
          INSERT INTO JAVIER.CUSTOMER_PASSWORDS 
          (CODIGO_CLIENTE, PASSWORD_HASH, INTENTOS_FALLIDOS, BLOQUEADO_HASTA, ULTIMO_LOGIN, FECHA_CREACION, FECHA_ACTUALIZACION)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          record.CODIGOCLIENTE,
          record.PASSWORD_HASH,
          record.LOGIN_ATTEMPTS || 0,
          record.LOCKED_UNTIL,
          record.LAST_LOGIN,
          record.CREATED_AT,
          record.UPDATED_AT
        ]);
        console.log(`   ✅ Migrado ${record.CODIGOCLIENTE}`);
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('duplicado')) {
          console.log(`   ⚠️  ${record.CODIGOCLIENTE} ya existe en CUSTOMER_PASSWORDS`);
        } else {
          console.error(`   ❌ Error migrando ${record.CODIGOCLIENTE}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log('\n⚠️  IMPORTANTE: Las tablas antiguas aún existen en DSEDAC');
    console.log('   Para borrarlas manualmente ejecuta:');
    console.log('   DROP TABLE DSEDAC.CLI_AUTH;');
    console.log('   DROP TABLE DSEDAC.CLI_TOKENS;');
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    if (connection) await connection.close();
    process.exit(1);
  }
}

migrarAuth();
