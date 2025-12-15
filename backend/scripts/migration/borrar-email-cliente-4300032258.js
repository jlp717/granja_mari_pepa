require('dotenv').config({ path: '.env.local118' });
const odbc = require('odbc');

const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';

async function borrarEmailCliente() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await odbc.connect(connectionString);
    console.log('✅ Conectado exitosamente\n');

    const codigoCliente = '4300032258';
    const emailABorrar = 'javier.lacal.pelegrin@gmail.com';

    // 1. Verificar si existe el registro
    console.log('🔍 Verificando si existe el email en CUSTOMER_EMAILS...');
    const checkQuery = `
      SELECT CODIGO_CLIENTE, EMAIL, VERIFICADO, FECHA_CREACION
      FROM JAVIER.CUSTOMER_EMAILS
      WHERE CODIGO_CLIENTE = ?
    `;

    const resultCheck = await connection.query(checkQuery, [codigoCliente]);

    if (resultCheck.length === 0) {
      console.log('⚠️  No se encontró ningún email para el cliente', codigoCliente);
      return;
    }

    console.log('📧 Email encontrado:');
    console.log('   Cliente:', resultCheck[0].CODIGO_CLIENTE);
    console.log('   Email:', resultCheck[0].EMAIL);
    console.log('   Verificado:', resultCheck[0].VERIFICADO);
    console.log('   Fecha creación:', resultCheck[0].FECHA_CREACION);
    console.log('');

    if (resultCheck[0].EMAIL.trim() !== emailABorrar) {
      console.log('⚠️  El email en la base de datos no coincide con el email a borrar');
      console.log('   Esperado:', emailABorrar);
      console.log('   Actual:', resultCheck[0].EMAIL.trim());
      console.log('');
      console.log('¿Deseas continuar de todas formas? (presiona Ctrl+C para cancelar)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 2. Borrar el registro
    console.log('🗑️  Borrando email de CUSTOMER_EMAILS...');
    const deleteQuery = `
      DELETE FROM JAVIER.CUSTOMER_EMAILS
      WHERE CODIGO_CLIENTE = ?
    `;

    await connection.query(deleteQuery, [codigoCliente]);
    console.log('✅ Email borrado exitosamente\n');

    // 3. Verificar que se borró
    console.log('🔍 Verificando que se borró correctamente...');
    const resultAfter = await connection.query(checkQuery, [codigoCliente]);

    if (resultAfter.length === 0) {
      console.log('✅ Confirmado: El email ha sido eliminado de la base de datos\n');
    } else {
      console.log('❌ ERROR: El email todavía existe en la base de datos\n');
    }

    console.log('🎉 Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.close();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
borrarEmailCliente();
