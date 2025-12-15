// Script de verificación final del sistema de PDFs
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  VERIFICACIÓN FINAL - SISTEMA DE GENERACIÓN DE PDFs      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let errores = 0;
let advertencias = 0;

// ====================================================================
// 1. VERIFICAR ARCHIVOS ESENCIALES
// ====================================================================
console.log('📁 Verificando archivos esenciales...\n');

const archivosEsenciales = [
  { path: './app/services/pdfService.js', desc: 'Servicio de PDF' },
  { path: './app/services/databaseService.js', desc: 'Servicio de BD' },
  { path: './app/controllers/facturaController.js', desc: 'Controlador de facturas' },
  { path: './app/models/facturaModel.js', desc: 'Modelo de consultas' },
  { path: './app/utils/formatters.js', desc: 'Utilidades de formateo' },
  { path: './app/config/odbcConfig.js', desc: 'Configuración ODBC' },
  { path: './PDF_SERVICE_README.md', desc: 'Documentación del servicio' },
  { path: './IMPLEMENTACION_COMPLETA.md', desc: 'Documentación de implementación' }
];

archivosEsenciales.forEach(archivo => {
  const rutaCompleta = path.join(__dirname, archivo.path);
  if (fs.existsSync(rutaCompleta)) {
    console.log(`   ✅ ${archivo.desc}`);
  } else {
    console.log(`   ❌ ${archivo.desc} - NO ENCONTRADO`);
    errores++;
  }
});

// ====================================================================
// 2. VERIFICAR ASSETS
// ====================================================================
console.log('\n🖼️  Verificando assets...\n');

const assetsPath = path.join(__dirname, 'assets');
const headerJpg = path.join(assetsPath, 'header.jpg');
const headerWebp = path.join(assetsPath, 'header.webp');

if (fs.existsSync(headerJpg)) {
  const stats = fs.statSync(headerJpg);
  console.log(`   ✅ header.jpg encontrado (${(stats.size / 1024).toFixed(2)} KB)`);
} else if (fs.existsSync(headerWebp)) {
  const stats = fs.statSync(headerWebp);
  console.log(`   ⚠️  header.webp encontrado (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log(`      Recomendación: Convertir a JPG para mejor compatibilidad`);
  advertencias++;
} else {
  console.log(`   ❌ No se encontró header.jpg ni header.webp`);
  console.log(`      El sistema usará fallback de texto`);
  errores++;
}

// ====================================================================
// 3. VERIFICAR VARIABLES DE ENTORNO
// ====================================================================
console.log('\n🔐 Verificando variables de entorno...\n');

const variablesRequeridas = [
  { key: 'DB_DSN', desc: 'DSN de base de datos' },
  { key: 'EMPRESA_REGISTRO', desc: 'Registro mercantil' },
  { key: 'EMPRESA_CIF', desc: 'CIF de la empresa' }
];

variablesRequeridas.forEach(variable => {
  if (process.env[variable.key]) {
    console.log(`   ✅ ${variable.desc}`);
  } else {
    console.log(`   ⚠️  ${variable.desc} - NO CONFIGURADA`);
    advertencias++;
  }
});

// ====================================================================
// 4. VERIFICAR DEPENDENCIAS NPM
// ====================================================================
console.log('\n📦 Verificando dependencias NPM...\n');

const dependenciasRequeridas = [
  'pdfkit',
  'bwip-js',
  'odbc'
];

dependenciasRequeridas.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`   ✅ ${dep}`);
  } catch (error) {
    console.log(`   ❌ ${dep} - NO INSTALADO`);
    console.log(`      Ejecutar: npm install ${dep}`);
    errores++;
  }
});

// ====================================================================
// 5. VERIFICAR ESTRUCTURA DE DIRECTORIOS
// ====================================================================
console.log('\n📂 Verificando estructura de directorios...\n');

const directorios = [
  './app',
  './app/services',
  './app/controllers',
  './app/models',
  './app/config',
  './app/utils',
  './assets',
  './logs'
];

directorios.forEach(dir => {
  const rutaCompleta = path.join(__dirname, dir);
  if (fs.existsSync(rutaCompleta)) {
    console.log(`   ✅ ${dir}/`);
  } else {
    console.log(`   ⚠️  ${dir}/ - NO EXISTE`);
    advertencias++;
  }
});

// ====================================================================
// 6. VERIFICAR SERVICIOS
// ====================================================================
console.log('\n🔧 Verificando que servicios se pueden cargar...\n');

try {
  const pdfService = require('./app/services/pdfService');
  console.log('   ✅ pdfService carga correctamente');
  
  // Verificar que tiene los métodos necesarios
  if (typeof pdfService.generarFacturaPDF === 'function') {
    console.log('   ✅ Método generarFacturaPDF() disponible');
  } else {
    console.log('   ❌ Método generarFacturaPDF() NO ENCONTRADO');
    errores++;
  }
  
} catch (error) {
  console.log('   ❌ Error cargando pdfService:', error.message);
  errores++;
}

try {
  const databaseService = require('./app/services/databaseService');
  console.log('   ✅ databaseService carga correctamente');
  
  if (typeof databaseService.obtenerDatosFactura === 'function') {
    console.log('   ✅ Método obtenerDatosFactura() disponible');
  } else {
    console.log('   ❌ Método obtenerDatosFactura() NO ENCONTRADO');
    errores++;
  }
  
} catch (error) {
  console.log('   ❌ Error cargando databaseService:', error.message);
  errores++;
}

try {
  const facturaController = require('./app/controllers/facturaController');
  console.log('   ✅ facturaController carga correctamente');
} catch (error) {
  console.log('   ❌ Error cargando facturaController:', error.message);
  errores++;
}

// ====================================================================
// 7. RESUMEN FINAL
// ====================================================================
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    RESUMEN FINAL                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (errores === 0 && advertencias === 0) {
  console.log('   🎉 ¡TODO PERFECTO! Sistema listo para producción\n');
  console.log('   Para probar la generación de PDFs, ejecuta:');
  console.log('   $ node test-generar-pdf.js\n');
  process.exit(0);
} else if (errores === 0) {
  console.log(`   ⚠️  Sistema funcional con ${advertencias} advertencia(s)\n`);
  console.log('   El sistema funcionará pero se recomienda revisar las advertencias.\n');
  console.log('   Para probar la generación de PDFs, ejecuta:');
  console.log('   $ node test-generar-pdf.js\n');
  process.exit(0);
} else {
  console.log(`   ❌ Se encontraron ${errores} error(es) y ${advertencias} advertencia(s)\n`);
  console.log('   Por favor, corrija los errores antes de continuar.\n');
  process.exit(1);
}
