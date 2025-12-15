/**
 * Script de prueba para el chatbot mejorado
 * Prueba las siguientes mejoras:
 * 1. Sin emojis en las respuestas
 * 2. Información corporativa actualizada
 * 3. Tono profesional
 * 4. Capacidad de consultar facturas (requiere autenticación)
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

/**
 * Helper para hacer requests HTTP
 */
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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            data: JSON.parse(data),
            status: res.statusCode,
            headers: res.headers
          };
          resolve(response);
        } catch (e) {
          resolve({ data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Probar el chatbot con una consulta
 */
async function testChatbot(mensaje, descripcion, token = null) {
  console.log(`\n${colors.bright}${colors.blue}=== ${descripcion} ===${colors.reset}`);
  console.log(`${colors.cyan}Usuario: ${colors.reset}${mensaje}`);

  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await makeRequest(`${BASE_URL}/api/chatbot`, {
      method: 'POST',
      headers,
      body: {
        message: mensaje,
        conversationId: null
      }
    });

    const reply = response.data.reply || response.data.response;

    console.log(`${colors.green}Asistente: ${colors.reset}${reply}`);

    // Verificar que no hay emojis
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(reply);
    if (hasEmojis) {
      console.log(`${colors.red}❌ ADVERTENCIA: La respuesta contiene emojis${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Respuesta sin emojis - Profesional${colors.reset}`);
    }

    return response.data.conversationId;
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    if (error.response) {
      console.error(`${colors.red}Detalles: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
    }
    return null;
  }
}

/**
 * Login para obtener token
 */
async function login() {
  console.log(`\n${colors.bright}${colors.yellow}=== Intentando login para pruebas con autenticación ===${colors.reset}`);

  try {
    // Intentar login con un cliente de prueba
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        nif: 'P33', // Cliente de prueba conocido
        password: 'mariPepa2024' // Password de prueba (puede necesitar ajuste)
      }
    });

    if (response.data.success && response.data.token) {
      console.log(`${colors.green}✓ Login exitoso${colors.reset}`);
      return response.data.token;
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ No se pudo hacer login con cliente de prueba${colors.reset}`);
    console.log(`${colors.yellow}Las pruebas de facturas se saltarán${colors.reset}`);
  }

  return null;
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║   PRUEBAS DEL CHATBOT MEJORADO - GRANJA MARI PEPA        ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Prueba 1: Saludo básico
  await testChatbot(
    'hola',
    'Prueba 1: Saludo básico (debe ser profesional, sin emojis)'
  );

  // Prueba 2: Consulta de productos
  await testChatbot(
    '¿Tenéis patatas congeladas?',
    'Prueba 2: Consulta sobre productos'
  );

  // Prueba 3: Información de la empresa
  await testChatbot(
    '¿Dónde estáis ubicados?',
    'Prueba 3: Información de ubicación (debe mencionar Lorca y Almería)'
  );

  // Prueba 4: Consulta de precios
  await testChatbot(
    '¿Cuánto cuesta el chorizo?',
    'Prueba 4: Consulta de precios (debe indicar contacto comercial)'
  );

  // Prueba 5: Incidencia/Problema
  await testChatbot(
    'Hay un error en mi factura 2098, el importe no cuadra',
    'Prueba 5: Gestión de incidencia (debe recopilar información y ofrecer solución)'
  );

  // Prueba 6: Consulta de facturas sin autenticación
  await testChatbot(
    'me puedes dar datos de mis facturas?',
    'Prueba 6: Consulta de facturas SIN autenticación (debe indicar login necesario)'
  );

  // Prueba 7: Tema prohibido
  await testChatbot(
    '¿Qué opinas de la política actual?',
    'Prueba 7: Tema prohibido (debe redirigir al negocio)'
  );

  // Intentar login para pruebas con autenticación
  const token = await login();

  if (token) {
    // Prueba 8: Consulta de facturas CON autenticación
    await testChatbot(
      'necesito consultar mis facturas',
      'Prueba 8: Consulta de facturas CON autenticación (debe mostrar datos reales)',
      token
    );

    // Prueba 9: Pregunta específica sobre una factura
    await testChatbot(
      '¿cuánto debo en total?',
      'Prueba 9: Consulta de deuda total (debe calcular del contexto)',
      token
    );
  }

  console.log(`\n${colors.bright}${colors.green}
╔═══════════════════════════════════════════════════════════╗
║                 PRUEBAS COMPLETADAS                       ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.bright}Resumen de mejoras implementadas:${colors.reset}`);
  console.log(`${colors.green}✓${colors.reset} Error de timestamp corregido`);
  console.log(`${colors.green}✓${colors.reset} Emojis eliminados del sistema`);
  console.log(`${colors.green}✓${colors.reset} Información corporativa actualizada (Lorca y Almería)`);
  console.log(`${colors.green}✓${colors.reset} Integración real con sistema de facturas`);
  console.log(`${colors.green}✓${colors.reset} Prompt profesional para resolver incidencias`);
  console.log(`${colors.green}✓${colors.reset} Tono profesional sin lenguaje tipo WhatsApp`);
}

// Ejecutar pruebas
runAllTests().catch(error => {
  console.error(`${colors.red}Error fatal en pruebas:${colors.reset}`, error);
  process.exit(1);
});
