/**
 * SCRIPT DE PRUEBA - INSERCIÓN DE CLIENTE
 *
 * Este script prueba la inserción del cliente de ejemplo
 * proporcionado por el usuario.
 *
 * Uso:
 *   node test-insert-cliente.js
 */

const API_URL = 'http://localhost:5000';

const clienteEjemplo = {
  codigoCliente: '4300000027',
  nombreCliente: 'ESPEJO LOPEZ JOSE',
  nif: '23194184H',
  direccion: 'AV FUERZAS ARMADAS, 18',
  poblacion: 'LORCA',
  provincia: 'MURCIA',
  codigoPostal: '30800',
  telefono1: '',
  telefono2: '',
  nombreAlternativo: '',
  codigoRuta: '05'
};

async function insertarCliente() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST DE INSERCIÓN DE CLIENTE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('📋 Cliente a insertar:');
  console.log(JSON.stringify(clienteEjemplo, null, 2));
  console.log('\n⏳ Enviando petición al backend...\n');

  try {
    const response = await fetch(`${API_URL}/api/clientes/registrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clienteEjemplo)
    });

    const data = await response.json();

    console.log('📡 Respuesta del servidor:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('\n📦 Datos:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ ¡Cliente insertado exitosamente!\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  AHORA PUEDES HACER LOGIN CON:');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Código de Cliente: ${clienteEjemplo.codigoCliente}`);
      console.log(`  NIF: ${clienteEjemplo.nif}`);
      console.log('═══════════════════════════════════════════════════════\n');

      // Probar el login automáticamente
      await probarLogin(clienteEjemplo.codigoCliente, clienteEjemplo.nif);
    } else {
      console.log('\n❌ Error al insertar cliente:');
      console.log(`   ${data.error}`);

      if (data.code === 'DUPLICATE_CLIENT') {
        console.log('\n💡 El cliente ya existe. Intentando login...\n');
        await probarLogin(clienteEjemplo.codigoCliente, clienteEjemplo.nif);
      }
    }

  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}`);
    console.error('\n⚠️  Asegúrate de que el backend esté corriendo en el puerto 5000');
    console.error('   Ejecuta: node server.js\n');
  }
}

async function probarLogin(codigoCliente, nif) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST DE LOGIN');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🔐 Intentando login con:');
  console.log(`   Código: ${codigoCliente}`);
  console.log(`   NIF: ${nif}\n`);

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ codigoCliente, nif })
    });

    const data = await response.json();

    console.log('📡 Respuesta del login:');
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (data.success) {
      console.log('✅ ¡LOGIN EXITOSO!\n');
      console.log('👤 Datos del cliente:');
      console.log(`   Código: ${data.cliente.codigo}`);
      console.log(`   Nombre: ${data.cliente.nombre}`);
      console.log(`   NIF: ${data.cliente.nif}`);
      console.log(`   Dirección: ${data.cliente.direccion}`);
      console.log(`   Población: ${data.cliente.poblacion}, ${data.cliente.provincia}`);
      console.log(`   CP: ${data.cliente.codigoPostal}`);
      console.log(`   Teléfono: ${data.cliente.telefono}\n`);

      console.log('🔑 Tokens JWT generados:');
      console.log(`   Access Token: ${data.accessToken.substring(0, 50)}...`);
      console.log(`   Refresh Token: ${data.refreshToken.substring(0, 50)}...\n`);

      console.log('═══════════════════════════════════════════════════════');
      console.log('  ¡TODO FUNCIONA CORRECTAMENTE! ✨');
      console.log('═══════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ Error de autenticación:');
      console.log(`   ${data.error}\n`);
    }

  } catch (error) {
    console.error('❌ Error en login:');
    console.error(`   ${error.message}\n`);
  }
}

// Ejecutar el script
insertarCliente().catch(console.error);
