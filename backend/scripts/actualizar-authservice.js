const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'services', 'authService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazos específicos en orden
const replacements = [
  // Nombres de tablas
  { from: /FROM CLI_AUTH/g, to: 'FROM JAVIER.CUSTOMER_PASSWORDS' },
  { from: /UPDATE CLI_AUTH/g, to: 'UPDATE JAVIER.CUSTOMER_PASSWORDS' },
  { from: /INTO CLI_TOKENS/g, to: 'INTO JAVIER.REFRESH_TOKENS' },
  { from: /FROM CLI_LOGIN_HISTORY/g, to: 'FROM JAVIER.LOGIN_ATTEMPTS' },
  { from: /INTO CLI_LOGIN_HISTORY/g, to: 'INTO JAVIER.LOGIN_ATTEMPTS' },
  
  // Columnas específicas en contexto de CLI_AUTH/CUSTOMER_PASSWORDS
  { from: /CODIGOCLIENTE/g, to: 'CODIGO_CLIENTE' },
  { from: /LOGIN_ATTEMPTS/g, to: 'INTENTOS_FALLIDOS' },
  { from: /LOCKED_UNTIL/g, to: 'BLOQUEADO_HASTA' },
  { from: /LAST_LOGIN/g, to: 'ULTIMO_LOGIN' },
  { from: /CREATED_AT/g, to: 'FECHA_CREACION' },
  { from: /UPDATED_AT/g, to: 'FECHA_ACTUALIZACION' },
  { from: /EXPIRES_AT/g, to: 'FECHA_EXPIRACION' },
  { from: /REVOKED/g, to: 'REVOCADO' },
  
  // Registrar en LOGIN_ATTEMPTS necesita ajustes de columnas
  { from: /SUCCESS/g, to: 'INTENTO_EXITOSO' },
  { from: /FAILURE_REASON/g, to: 'RAZON_FALLO' },
  { from: /LOGIN_TIME/g, to: 'FECHA_INTENTO' },
];

replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Escribir archivo actualizado
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ authService.js actualizado para usar esquema JAVIER');
console.log('   - CUSTOMER_PASSWORDS');
console.log('   - REFRESH_TOKENS');
console.log('   - LOGIN_ATTEMPTS');
