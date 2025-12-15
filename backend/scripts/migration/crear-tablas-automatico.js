/**
 * Script para crear automáticamente las tablas de seguridad en el esquema JAVIER
 * Ejecutar: node crear-tablas-automatico.js
 */

const odbc = require('odbc');
require('dotenv').config();

const CONNECTION_STRING = process.env.ODBC_CONNECTION_STRING;

const tablas = [
  {
    nombre: 'CUSTOMER_CREDENTIALS',
    sql: `
      CREATE TABLE JAVIER.CUSTOMER_CREDENTIALS (
        CODIGO_CLIENTE CHAR(13) NOT NULL,
        PASSWORD_HASH VARCHAR(255) NOT NULL,
        SALT VARCHAR(255) NOT NULL,
        PASSWORD_TYPE VARCHAR(20) NOT NULL DEFAULT 'BCRYPT',
        FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FECHA_MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        DEBE_CAMBIAR_PASSWORD CHAR(1) DEFAULT 'N',
        ACTIVO CHAR(1) DEFAULT 'S',
        PRIMARY KEY (CODIGO_CLIENTE)
      )
    `
  },
  {
    nombre: 'LOGIN_ATTEMPTS',
    sql: `
      CREATE TABLE JAVIER.LOGIN_ATTEMPTS (
        ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
        CODIGO_CLIENTE CHAR(13) NOT NULL,
        IP_ADDRESS VARCHAR(50),
        USER_AGENT VARCHAR(500),
        INTENTO_EXITOSO CHAR(1) DEFAULT 'N',
        RAZON_FALLO VARCHAR(200),
        FECHA_INTENTO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ID)
      )
    `
  },
  {
    nombre: 'PASSWORD_RESET_TOKENS',
    sql: `
      CREATE TABLE JAVIER.PASSWORD_RESET_TOKENS (
        ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
        CODIGO_CLIENTE CHAR(13) NOT NULL,
        TOKEN VARCHAR(255) NOT NULL,
        EMAIL VARCHAR(255) NOT NULL,
        FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FECHA_EXPIRACION TIMESTAMP NOT NULL,
        USADO CHAR(1) DEFAULT 'N',
        IP_SOLICITANTE VARCHAR(50),
        PRIMARY KEY (ID),
        UNIQUE (TOKEN)
      )
    `
  },
  {
    nombre: 'SECURITY_AUDIT',
    sql: `
      CREATE TABLE JAVIER.SECURITY_AUDIT (
        ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
        CODIGO_CLIENTE CHAR(13),
        TIPO_EVENTO VARCHAR(50) NOT NULL,
        DESCRIPCION VARCHAR(500),
        IP_ADDRESS VARCHAR(50),
        USER_AGENT VARCHAR(500),
        EXITOSO CHAR(1) DEFAULT 'S',
        FECHA_EVENTO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ID)
      )
    `
  },
  {
    nombre: 'CUSTOMER_EMAILS',
    sql: `
      CREATE TABLE JAVIER.CUSTOMER_EMAILS (
        CODIGO_CLIENTE CHAR(13) NOT NULL,
        EMAIL VARCHAR(255) NOT NULL,
        VERIFICADO CHAR(1) DEFAULT 'N',
        FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FECHA_VERIFICACION TIMESTAMP,
        PRIMARY KEY (CODIGO_CLIENTE),
        UNIQUE (EMAIL)
      )
    `
  }
];

async function crearTablas() {
  console.log('🚀 Iniciando creación de tablas de seguridad en esquema JAVIER...\n');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    connection = await odbc.connect(CONNECTION_STRING);
    console.log('✅ Conexión establecida\n');
    
    for (const tabla of tablas) {
      try {
        // Verificar si la tabla ya existe
        const checkResult = await connection.query(`
          SELECT COUNT(*) as EXISTE
          FROM QSYS2.SYSTABLES
          WHERE TABLE_SCHEMA = 'JAVIER'
            AND TABLE_NAME = '${tabla.nombre}'
        `);
        
        if (checkResult[0].EXISTE > 0) {
          console.log(`⚠️  La tabla ${tabla.nombre} ya existe, omitiendo...`);
          continue;
        }
        
        // Crear la tabla
        console.log(`📝 Creando tabla ${tabla.nombre}...`);
        await connection.query(tabla.sql);
        console.log(`✅ Tabla ${tabla.nombre} creada exitosamente`);
        
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  La tabla ${tabla.nombre} ya existe`);
        } else {
          console.error(`❌ Error creando ${tabla.nombre}:`, error.message);
        }
      }
    }
    
    // Crear índices
    console.log('\n📊 Creando índices...');
    
    const indices = [
      { tabla: 'CUSTOMER_CREDENTIALS', nombre: 'IDX_CUST_CRED_ACT', sql: 'CREATE INDEX JAVIER.IDX_CUST_CRED_ACT ON JAVIER.CUSTOMER_CREDENTIALS(ACTIVO)' },
      { tabla: 'LOGIN_ATTEMPTS', nombre: 'IDX_LOGIN_ATT_CLIENTE', sql: 'CREATE INDEX JAVIER.IDX_LOGIN_ATT_CLIENTE ON JAVIER.LOGIN_ATTEMPTS(CODIGO_CLIENTE)' },
      { tabla: 'LOGIN_ATTEMPTS', nombre: 'IDX_LOGIN_ATT_FECHA', sql: 'CREATE INDEX JAVIER.IDX_LOGIN_ATT_FECHA ON JAVIER.LOGIN_ATTEMPTS(FECHA_INTENTO)' },
      { tabla: 'PASSWORD_RESET_TOKENS', nombre: 'IDX_RESET_TOKEN', sql: 'CREATE INDEX JAVIER.IDX_RESET_TOKEN ON JAVIER.PASSWORD_RESET_TOKENS(TOKEN)' },
      { tabla: 'PASSWORD_RESET_TOKENS', nombre: 'IDX_RESET_CLIENTE', sql: 'CREATE INDEX JAVIER.IDX_RESET_CLIENTE ON JAVIER.PASSWORD_RESET_TOKENS(CODIGO_CLIENTE)' },
      { tabla: 'SECURITY_AUDIT', nombre: 'IDX_AUDIT_CLIENTE', sql: 'CREATE INDEX JAVIER.IDX_AUDIT_CLIENTE ON JAVIER.SECURITY_AUDIT(CODIGO_CLIENTE)' },
      { tabla: 'SECURITY_AUDIT', nombre: 'IDX_AUDIT_FECHA', sql: 'CREATE INDEX JAVIER.IDX_AUDIT_FECHA ON JAVIER.SECURITY_AUDIT(FECHA_EVENTO)' },
      { tabla: 'CUSTOMER_EMAILS', nombre: 'IDX_CUST_EMAIL', sql: 'CREATE INDEX JAVIER.IDX_CUST_EMAIL ON JAVIER.CUSTOMER_EMAILS(EMAIL)' }
    ];
    
    for (const indice of indices) {
      try {
        await connection.query(indice.sql);
        console.log(`✅ Índice ${indice.nombre} creado`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ${indice.nombre} ya existe`);
        } else {
          console.log(`⚠️  Error creando índice ${indice.nombre}: ${error.message}`);
        }
      }
    }
    
    // Verificación final
    console.log('\n🔍 Verificación final...');
    const verificacion = await connection.query(`
      SELECT TABLE_NAME, TABLE_TEXT 
      FROM QSYS2.SYSTABLES 
      WHERE TABLE_SCHEMA = 'JAVIER' 
        AND TABLE_NAME IN (
          'CUSTOMER_CREDENTIALS',
          'LOGIN_ATTEMPTS', 
          'PASSWORD_RESET_TOKENS',
          'SECURITY_AUDIT',
          'CUSTOMER_EMAILS'
        )
      ORDER BY TABLE_NAME
    `);
    
    console.log(`\n✨ ¡Proceso completado!`);
    console.log(`📊 Tablas creadas: ${verificacion.length}/5`);
    verificacion.forEach(tabla => {
      console.log(`   ✅ ${tabla.TABLE_NAME}`);
    });
    
    console.log('\n⚠️  IMPORTANTE: Reinicia el servidor backend para que detecte las nuevas tablas');
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
crearTablas();
