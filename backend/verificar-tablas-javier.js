require('dotenv').config();
const odbc = require('odbc');

async function verificarTablasJavier() {
  let connection;
  
  try {
    console.log('🔍 Verificando tablas en esquema JAVIER...\n');
    
    connection = await odbc.connect(process.env.ODBC_CONNECTION_STRING);
    
    // LOGIN_ATTEMPTS
    console.log('📋 LOGIN_ATTEMPTS:');
    const loginAttempts = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'LOGIN_ATTEMPTS'
      ORDER BY ORDINAL_POSITION
    `);
    loginAttempts.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type.padEnd(20)} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📋 PASSWORD_RESET_TOKENS:');
    const resetTokens = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'PASSWORD_RESET_TOKENS'
      ORDER BY ORDINAL_POSITION
    `);
    resetTokens.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type.padEnd(20)} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📋 SECURITY_AUDIT:');
    const securityAudit = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'SECURITY_AUDIT'
      ORDER BY ORDINAL_POSITION
    `);
    securityAudit.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type.padEnd(20)} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📋 CUSTOMER_EMAILS:');
    const customerEmails = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_EMAILS'
      ORDER BY ORDINAL_POSITION
    `);
    customerEmails.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type.padEnd(20)} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📋 VERIFICATION_CODES:');
    const verificationCodes = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'VERIFICATION_CODES'
      ORDER BY ORDINAL_POSITION
    `);
    verificationCodes.forEach(col => {
      const type = col.CHARACTER_MAXIMUM_LENGTH ? 
        `${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH})` : col.DATA_TYPE;
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${type.padEnd(20)} ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar CLI_AUTH en DSEDAC
    console.log('\n\n🔍 Buscando CLI_AUTH en DSEDAC...');
    const cliAuth = await connection.query(`
      SELECT COUNT(*) as EXISTE
      FROM QSYS2.SYSTABLES
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CLI_AUTH'
    `);
    
    if (cliAuth[0].EXISTE > 0) {
      console.log('⚠️  CLI_AUTH existe en DSEDAC (esquema PROHIBIDO)');
      const count = await connection.query('SELECT COUNT(*) as TOTAL FROM DSEDAC.CLI_AUTH');
      console.log(`   Registros: ${count[0].TOTAL}`);
    } else {
      console.log('✅ CLI_AUTH NO existe en DSEDAC');
    }
    
    // Verificar CLI_TOKENS
    console.log('\n🔍 Buscando CLI_TOKENS...');
    const cliTokens = await connection.query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM QSYS2.SYSTABLES
      WHERE TABLE_NAME = 'CLI_TOKENS'
    `);
    
    if (cliTokens.length > 0) {
      console.log('⚠️  CLI_TOKENS encontrada en:');
      cliTokens.forEach(t => console.log(`   ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`));
    } else {
      console.log('✅ CLI_TOKENS NO existe en ningún esquema');
    }
    
    await connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

verificarTablasJavier();
