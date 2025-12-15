/**
 * Script para convertir header.webp a PNG
 * Usa sharp para conversión de imágenes
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Convirtiendo header.webp a PNG...\n');

// Rutas
const assetsPath = path.join(__dirname, '../../assets');
const inputPath = path.join(assetsPath, 'header.webp');
const outputPath = path.join(assetsPath, 'header.png');

console.log('📁 Ruta de entrada:', inputPath);
console.log('📁 Ruta de salida:', outputPath);
console.log('');

// Verificar que existe el archivo de entrada
if (!fs.existsSync(inputPath)) {
  console.error('❌ Error: No se encuentra el archivo header.webp');
  process.exit(1);
}

// Método 1: Intentar con sharp (mejor opción)
async function convertWithSharp() {
  try {
    const sharp = require('sharp');

    await sharp(inputPath)
      .png()
      .toFile(outputPath);

    console.log('✅ Header convertido exitosamente a PNG usando sharp');
    console.log('📄 Archivo creado:', outputPath);
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  Sharp no está instalado. Instalando...');
      return false;
    }
    throw error;
  }
}

// Método 2: Si no está sharp, copiar el archivo tal cual (algunos sistemas pueden leer WEBP)
function copyFile() {
  try {
    // Si no podemos convertir, al menos informamos
    console.log('⚠️  No se pudo convertir el archivo WEBP.');
    console.log('💡 Soluciones:');
    console.log('   1. Instalar sharp: npm install sharp --save');
    console.log('   2. Convertir manualmente en: https://cloudconvert.com/webp-to-png');
    console.log('   3. O usar una herramienta local de conversión');
    console.log('');
    console.log('📌 Por ahora, el sistema intentará usar el archivo WEBP directamente.');
    console.log('   Si los PDFs no muestran el header, convierte el archivo manualmente.');

    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar conversión
(async () => {
  try {
    const success = await convertWithSharp();

    if (!success) {
      // Intentar instalar sharp
      const { execSync } = require('child_process');
      try {
        console.log('📦 Instalando sharp...');
        execSync('npm install sharp --save', {
          cwd: path.join(__dirname, '../..'),
          stdio: 'inherit'
        });

        // Reintentar conversión
        console.log('');
        console.log('🔄 Reintentando conversión con sharp...');
        await convertWithSharp();
      } catch (installError) {
        console.log('');
        copyFile();
      }
    }
  } catch (error) {
    console.error('❌ Error durante la conversión:', error.message);
    copyFile();
  }
})();
