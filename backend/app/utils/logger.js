/**
 * SISTEMA DE LOGGING
 * ===================
 * Logger personalizado con colores y niveles
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Niveles de log
const levels = {
  error: { color: colors.red, prefix: '❌ ERROR' },
  warn: { color: colors.yellow, prefix: '⚠️  WARN' },
  info: { color: colors.cyan, prefix: 'ℹ️  INFO' },
  success: { color: colors.green, prefix: '✅ SUCCESS' },
  debug: { color: colors.magenta, prefix: '🐛 DEBUG' }
};

// Directorio de logs
const logsDir = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Escribir log en archivo
 */
function writeToFile(level, message, data) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(logsDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

/**
 * Función principal de logging
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const { color, prefix } = levels[level] || levels.info;
  
  // Formatear mensaje para consola
  const consoleMessage = `${colors.gray}[${timestamp}]${colors.reset} ${color}${prefix}${colors.reset} ${message}`;
  
  console.log(consoleMessage);
  
  // Mostrar data si existe
  if (data) {
    console.log(color, data, colors.reset);
  }
  
  // Escribir a archivo
  writeToFile(level, message, data);
}

module.exports = {
  error: (message, data) => log('error', message, data),
  warn: (message, data) => log('warn', message, data),
  info: (message, data) => log('info', message, data),
  success: (message, data) => log('success', message, data),
  debug: (message, data) => log('debug', message, data)
};
