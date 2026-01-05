/*
  Test for /api/chatbot/generar-enlace
  Requires backend server running and a valid JWT token
*/
const http = require('http');
const BASE_URL = 'http://localhost:5000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Test Script',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

(async () => {
  console.log('Test: Generar enlace de descarga (requiere token)');
  const token = process.env.TEST_JWT_TOKEN;
  if (!token) {
    console.error('Set TEST_JWT_TOKEN env var con un token válido antes de ejecutar este test');
    process.exit(1);
  }

  try {
    const res = await makeRequest(`${BASE_URL}/api/chatbot/generar-enlace`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { serie: 'F', numero: 14074, ejercicio: new Date().getFullYear() }
    });

    console.log('Status:', res.status);
    console.log('Response:', res.data);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();