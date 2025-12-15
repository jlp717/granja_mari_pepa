const http = require('http');

async function testLogin() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Probando login para cliente 4300009900...');
    
    const postData = JSON.stringify({
      codigoCliente: '4300009900',
      password: '23224478K'
    });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/v2/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Node.js Test Client'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('\n✅ LOGIN EXITOSO!\n');
          console.log('📊 Respuesta:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.accessToken) {
            console.log('\n🔑 Access Token recibido (primeros 50 chars):', response.accessToken.substring(0, 50) + '...');
          }
          
          if (response.refreshToken) {
            console.log('🔄 Refresh Token recibido (primeros 50 chars):', response.refreshToken.substring(0, 50) + '...');
          }
          
          if (response.cliente) {
            console.log('\n👤 Datos del cliente:');
            console.log('  - Código:', response.cliente.CODIGOCLIENTE);
            console.log('  - Nombre:', response.cliente.NOMBRECLIENTE);
            console.log('  - NIF:', response.cliente.NIF);
          }
          
          resolve(response);
        } catch (error) {
          console.error('\n❌ ERROR PARSEANDO RESPUESTA:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ ERROR EN LOGIN:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

testLogin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
