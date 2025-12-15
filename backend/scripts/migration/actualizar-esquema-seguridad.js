/**
 * Script para actualizar el esquema de tablas de seguridad de DSEDAC a JAVIER
 * Ejecutar: node actualizar-esquema-seguridad.js
 */

const fs = require('fs');
const path = require('path');

const authServicePath = path.join(__dirname, '..', 'app', 'services', 'authService.js');

console.log('📝 Actualizando esquema de seguridad...');
console.log(`📂 Archivo: ${authServicePath}`);

try {
  // Leer el archivo
  let content = fs.readFileSync(authServicePath, 'utf8');
  
  // Contador de reemplazos
  let replacements = 0;
  
  // Reemplazar solo las tablas de seguridad
  const securityTables = [
    'CUSTOMER_CREDENTIALS',
    'LOGIN_ATTEMPTS',
    'PASSWORD_RESET_TOKENS',
    'SECURITY_AUDIT',
    'SECURITY_AUDIT_LOG',
    'CUSTOMER_EMAILS'
  ];
  
  securityTables.forEach(table => {
    const regex = new RegExp(`DSEDAC\\.${table}`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `JAVIER.${table}`);
      replacements += matches.length;
      console.log(`✅ Reemplazados ${matches.length} ocurrencias de DSEDAC.${table} → JAVIER.${table}`);
    }
  });
  
  if (replacements > 0) {
    // Hacer backup
    const backupPath = `${authServicePath}.backup`;
    fs.copyFileSync(authServicePath, backupPath);
    console.log(`💾 Backup creado: ${backupPath}`);
    
    // Escribir el archivo actualizado
    fs.writeFileSync(authServicePath, content, 'utf8');
    console.log(`\n✨ ¡Actualización completada!`);
    console.log(`📊 Total de reemplazos: ${replacements}`);
    console.log(`\n⚠️  IMPORTANTE: Reinicia el servidor backend para aplicar los cambios`);
  } else {
    console.log('\n⚠️  No se encontraron referencias a actualizar');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
