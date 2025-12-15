const odbc = require('odbc');
require('dotenv').config();

console.log('\n=== TEST DE CONEXIÓN ODBC ===\n');

const connectionString = process.env.ODBC_CONNECTION_STRING;
console.log('Connection String:', connectionString.replace(/PWD=[^;]+/, 'PWD=***'));

async function testConnection() {
  let connection;

  try {
    console.log('\n1. Intentando conectar a la base de datos...');
    const startTime = Date.now();

    connection = await odbc.connect(connectionString);

    const elapsed = Date.now() - startTime;
    console.log(`✅ Conexión exitosa! (${elapsed}ms)`);

    console.log('\n2. Probando consulta simple...');
    const result = await connection.query('SELECT CURRENT_DATE FROM SYSIBM.SYSDUMMY1');
    console.log('✅ Consulta exitosa!');
    console.log('Resultado:', result);

    console.log('\n3. Obteniendo información del sistema...');
    const sysInfo = await connection.query('SELECT * FROM SYSIBM.SYSDUMMY1');
    console.log('✅ Sistema respondiendo correctamente');

    console.log('\n✅ TODAS LAS PRUEBAS EXITOSAS');
    console.log('La conexión ODBC funciona correctamente.');

  } catch (error) {
    console.error('\n❌ ERROR EN LA CONEXIÓN:');
    console.error('Tipo:', error.name);
    console.error('Mensaje:', error.message);

    if (error.odbcErrors) {
      console.error('\nErrores ODBC detallados:');
      error.odbcErrors.forEach((odbcError, index) => {
        console.error(`\nError ${index + 1}:`);
        console.error('  Estado:', odbcError.state);
        console.error('  Código:', odbcError.code);
        console.error('  Mensaje:', odbcError.message);
      });
    }

    console.error('\nPosibles causas:');
    console.error('1. El DSN "GMP" no está configurado correctamente');
    console.error('2. El servidor IBM i (192.168.1.22) no está accesible');
    console.error('3. Las credenciales son incorrectas');
    console.error('4. El firewall está bloqueando la conexión');
    console.error('5. El servicio en IBM i no está corriendo');

    console.error('\nRecomendaciones:');
    console.error('- Verificar que puedes hacer ping a 192.168.1.22');
    console.error('- Probar la conexión desde "Administrador de ODBC" en Windows');
    console.error('- Verificar que el usuario JAVER tiene permisos');

    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n✅ Conexión cerrada correctamente');
      } catch (closeError) {
        console.error('Error al cerrar la conexión:', closeError.message);
      }
    }
  }
}

testConnection();
