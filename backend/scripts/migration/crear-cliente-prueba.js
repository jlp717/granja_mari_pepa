/**
 * Script para crear cliente de prueba
 * 
 * IMPORTANTE: Este script crea datos SOLO en esquema JAVIER
 * NO inserta nada en DSEDAC (tablas base)
 * 
 * Para probar:
 * 1. Ejecutar este script para crear credenciales de prueba
 * 2. El cliente debe existir en DSEDAC.CLI (usamos uno existente)
 * 3. Creamos sus credenciales en JAVIER.CUSTOMER_CREDENTIALS
 * 
 * node scripts/crear-cliente-prueba.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../app/config/odbcConfig');

const BCRYPT_ROUNDS = 12;

// Configuración del cliente de prueba
// Usaremos un cliente EXISTENTE en DSEDAC.CLI
const CLIENTE_PRUEBA = {
  // Este código debe existir en DSEDAC.CLI
  // Puedes cambiar este código por cualquier cliente real de la BD
  codigoCliente: '4300000001', // Ajustar a un cliente real
  passwordInicial: 'Test2024!', // Contraseña de prueba
};

async function crearClientePrueba() {
  let connection;
  
  console.log('🔐 Script de Creación de Cliente de Prueba');
  console.log('==========================================\n');
  
  try {
    connection = await pool.acquire();
    console.log('✅ Conexión a BD establecida\n');
    
    // 1. Verificar que las tablas de seguridad existen
    console.log('1️⃣ Verificando tablas de seguridad en JAVIER...');
    
    const tablasExisten = await connection.query(`
      SELECT TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'JAVIER'
        AND TABLE_NAME IN ('CUSTOMER_CREDENTIALS', 'VERIFICATION_CODES', 'SECURITY_AUDIT')
    `);
    
    console.log(`   Tablas encontradas: ${tablasExisten.map(t => t.TABLE_NAME).join(', ')}`);
    
    if (tablasExisten.length < 2) {
      console.log('\n⚠️  Faltan tablas de seguridad. Creándolas...');
      
      // Crear CUSTOMER_CREDENTIALS si no existe
      try {
        await connection.query(`
          CREATE TABLE JAVIER.CUSTOMER_CREDENTIALS (
            CODIGO_CLIENTE CHAR(13) NOT NULL,
            PASSWORD_HASH VARCHAR(255) NOT NULL,
            SALT VARCHAR(255) DEFAULT 'BCRYPT',
            PASSWORD_TYPE VARCHAR(20) DEFAULT 'BCRYPT',
            FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FECHA_MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ULTIMO_CAMBIO_PASSWORD TIMESTAMP DEFAULT NULL,
            DEBE_CAMBIAR_PASSWORD CHAR(1) DEFAULT 'N',
            ACTIVO CHAR(1) DEFAULT 'S',
            PRIMARY KEY (CODIGO_CLIENTE)
          )
        `);
        console.log('   ✅ CUSTOMER_CREDENTIALS creada');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  CUSTOMER_CREDENTIALS ya existe');
        } else {
          throw e;
        }
      }
      
      // Crear VERIFICATION_CODES si no existe
      try {
        await connection.query(`
          CREATE TABLE JAVIER.VERIFICATION_CODES (
            ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
            CODIGO_CLIENTE CHAR(13) NOT NULL,
            CODIGO_VERIFICACION CHAR(6) NOT NULL,
            INTENTOS INTEGER DEFAULT 0,
            FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FECHA_EXPIRACION TIMESTAMP NOT NULL,
            USADO CHAR(1) DEFAULT 'N',
            IP_SOLICITANTE VARCHAR(50),
            PRIMARY KEY (ID)
          )
        `);
        console.log('   ✅ VERIFICATION_CODES creada');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  VERIFICATION_CODES ya existe');
        } else {
          throw e;
        }
      }
      
      // Crear SECURITY_AUDIT si no existe
      try {
        await connection.query(`
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
        `);
        console.log('   ✅ SECURITY_AUDIT creada');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  SECURITY_AUDIT ya existe');
        } else {
          throw e;
        }
      }
    }
    
    // 2. Buscar un cliente existente en DSEDAC.CLI para usar como prueba
    console.log('\n2️⃣ Buscando clientes existentes en DSEDAC.CLI...');
    
    const clientesExistentes = await connection.query(`
      SELECT 
        TRIM(CODIGOCLIENTE) as CODIGO,
        TRIM(NOMBRECLIENTE) as NOMBRE,
        TRIM(NIF) as NIF
      FROM DSEDAC.CLI
      WHERE CODIGOCLIENTE IS NOT NULL
        AND LENGTH(TRIM(CODIGOCLIENTE)) > 0
      ORDER BY CODIGOCLIENTE
      FETCH FIRST 5 ROWS ONLY
    `);
    
    if (clientesExistentes.length === 0) {
      console.log('❌ No se encontraron clientes en DSEDAC.CLI');
      return;
    }
    
    console.log('\n   Clientes disponibles para prueba:');
    clientesExistentes.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.CODIGO} - ${c.NOMBRE} (NIF: ${c.NIF})`);
    });
    
    // Usar el primer cliente encontrado
    const clientePrueba = clientesExistentes[0];
    console.log(`\n   ➡️  Usando cliente: ${clientePrueba.CODIGO}`);
    
    // 3. Verificar si ya tiene credenciales
    console.log('\n3️⃣ Verificando credenciales existentes...');
    
    const credencialesExistentes = await connection.query(`
      SELECT CODIGO_CLIENTE, PASSWORD_TYPE
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE CODIGO_CLIENTE = ?
    `, [clientePrueba.CODIGO]);
    
    // 4. Crear/actualizar credenciales
    console.log('\n4️⃣ Configurando credenciales de prueba...');
    
    const passwordHash = await bcrypt.hash(CLIENTE_PRUEBA.passwordInicial, BCRYPT_ROUNDS);
    
    if (credencialesExistentes.length > 0) {
      // Actualizar (sin ULTIMO_CAMBIO_PASSWORD ya que puede no existir)
      await connection.query(`
        UPDATE JAVIER.CUSTOMER_CREDENTIALS
        SET 
          PASSWORD_HASH = ?,
          PASSWORD_TYPE = 'CUSTOM',
          FECHA_MODIFICACION = CURRENT_TIMESTAMP,
          DEBE_CAMBIAR_PASSWORD = 'N',
          ACTIVO = 'S'
        WHERE CODIGO_CLIENTE = ?
      `, [passwordHash, clientePrueba.CODIGO]);
      console.log('   ✅ Credenciales actualizadas');
    } else {
      // Insertar (sin ULTIMO_CAMBIO_PASSWORD ya que puede no existir)
      await connection.query(`
        INSERT INTO JAVIER.CUSTOMER_CREDENTIALS (
          CODIGO_CLIENTE,
          PASSWORD_HASH,
          SALT,
          PASSWORD_TYPE,
          FECHA_CREACION,
          FECHA_MODIFICACION,
          DEBE_CAMBIAR_PASSWORD,
          ACTIVO
        ) VALUES (?, ?, 'BCRYPT', 'CUSTOM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'N', 'S')
      `, [clientePrueba.CODIGO, passwordHash]);
      console.log('   ✅ Credenciales creadas');
    }
    
    // 5. Mostrar resumen
    console.log('\n==========================================');
    console.log('✅ CLIENTE DE PRUEBA CONFIGURADO');
    console.log('==========================================');
    console.log(`
📋 DATOS DE ACCESO:

   Código Cliente: ${clientePrueba.CODIGO}
   Nombre: ${clientePrueba.NOMBRE}
   NIF original: ${clientePrueba.NIF}
   
   🔑 Contraseña: ${CLIENTE_PRUEBA.passwordInicial}

📝 NOTAS:
   - Las credenciales están en JAVIER.CUSTOMER_CREDENTIALS
   - NO se modificó DSEDAC.CLI (datos base)
   - El NIF sigue funcionando como login legacy
   - La nueva contraseña funciona con el sistema V2

🧪 PARA PROBAR:
   1. Frontend: usa código "${clientePrueba.CODIGO}" + contraseña "${CLIENTE_PRUEBA.passwordInicial}"
   2. O prueba el reset: solicita código para "${clientePrueba.CODIGO}"
   
🗑️  PARA ELIMINAR DATOS DE PRUEBA:
   DELETE FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CODIGO_CLIENTE = '${clientePrueba.CODIGO}';
   DELETE FROM JAVIER.VERIFICATION_CODES WHERE CODIGO_CLIENTE = '${clientePrueba.CODIGO}';
`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await pool.release(connection);
    }
    process.exit(0);
  }
}

// Inicializar pool y ejecutar
async function main() {
  try {
    await pool.initialize();
    await crearClientePrueba();
  } catch (error) {
    console.error('Error inicializando:', error.message);
    process.exit(1);
  }
}

main();
