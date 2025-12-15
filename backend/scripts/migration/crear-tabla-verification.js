require('dotenv').config();
const pool = require('../app/config/odbcConfig');

async function crearTabla() {
  await pool.initialize();
  const conn = await pool.acquire();
  
  try {
    // Verificar si existe
    const existe = await conn.query(`
      SELECT TABLE_NAME FROM QSYS2.SYSTABLES 
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'VERIFICATION_CODES'
    `);
    
    if (existe.length > 0) {
      console.log('✅ Tabla VERIFICATION_CODES ya existe');
    } else {
      console.log('📦 Creando tabla VERIFICATION_CODES...');
      await conn.query(`
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
      console.log('✅ Tabla VERIFICATION_CODES creada exitosamente');
    }
    
    // Verificar tablas de seguridad
    console.log('\n📋 Tablas de seguridad en JAVIER:');
    const tablas = await conn.query(`
      SELECT TABLE_NAME FROM QSYS2.SYSTABLES 
      WHERE TABLE_SCHEMA = 'JAVIER'
      ORDER BY TABLE_NAME
    `);
    tablas.forEach(t => console.log('   -', t.TABLE_NAME));
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.release(conn);
    process.exit(0);
  }
}

crearTabla();
