require('dotenv').config();
const odbc = require('odbc');

async function verificarTabla() {
  let connection;
  
  try {
    console.log('🔍 Verificando estructura de CLI_TOKENS...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // Verificar si la tabla existe
    const checkTable = await connection.query(`
      SELECT COUNT(*) as EXISTE 
      FROM QSYS2.SYSTABLES 
      WHERE TABLE_SCHEMA = 'HLPC_BK1' AND TABLE_NAME = 'CLI_TOKENS'
    `);
    
    if (checkTable[0].EXISTE === 0) {
      console.log('❌ La tabla CLI_TOKENS NO EXISTE');
      console.log('\n📝 Script para crearla:');
      console.log(`
CREATE TABLE HLPC_BK1.CLI_TOKENS (
  TOKEN_ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  CODIGOCLIENTE CHAR(13) NOT NULL,
  REFRESH_TOKEN VARCHAR(500) NOT NULL,
  DEVICE_INFO VARCHAR(255),
  IP_ADDRESS VARCHAR(45),
  CREATED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  EXPIRES_AT TIMESTAMP NOT NULL,
  REVOKED CHAR(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (TOKEN_ID)
);

CREATE INDEX CLI_TOKENS_IDX1 ON HLPC_BK1.CLI_TOKENS(CODIGOCLIENTE);
CREATE INDEX CLI_TOKENS_IDX2 ON HLPC_BK1.CLI_TOKENS(REVOKED);
      `);
    } else {
      console.log('✅ La tabla CLI_TOKENS existe');
      
      // Obtener columnas
      const columns = await connection.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
        FROM QSYS2.SYSCOLUMNS
        WHERE TABLE_SCHEMA = 'HLPC_BK1' AND TABLE_NAME = 'CLI_TOKENS'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n📋 Columnas:');
      columns.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}${col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : ''}`);
      });
      
      // Contar registros
      const count = await connection.query('SELECT COUNT(*) as TOTAL FROM CLI_TOKENS');
      console.log(`\n📊 Total de registros: ${count[0].TOTAL}`);
    }
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

verificarTabla();
