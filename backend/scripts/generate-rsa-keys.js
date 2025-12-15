/**
 * 🔐 GENERADOR DE CLAVES RSA PARA JWT RS256
 * ==========================================
 * 
 * Genera un par de claves RSA-2048 para firmar JWTs de forma asimétrica.
 * 
 * Uso: node scripts/generate-rsa-keys.js
 * 
 * Las claves se guardan en:
 * - backend/keys/private.pem (NUNCA compartir)
 * - backend/keys/public.pem (se puede compartir)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando par de claves RSA-2048 para JWT RS256...\n');

// Generar par de claves
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Crear directorio si no existe
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Guardar claves
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 }); // Solo lectura para owner
fs.writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

console.log('✅ Claves RSA generadas exitosamente:\n');
console.log(`   🔒 Clave privada: ${privateKeyPath}`);
console.log(`   🔓 Clave pública: ${publicKeyPath}`);
console.log('\n⚠️  IMPORTANTE:');
console.log('   - NUNCA subas private.pem a Git');
console.log('   - Añade "keys/" a tu .gitignore');
console.log('   - Configura JWT_ALGORITHM=RS256 en .env\n');

// Mostrar fingerprint para verificación
const fingerprint = crypto
  .createHash('sha256')
  .update(publicKey)
  .digest('hex')
  .substring(0, 16);

console.log(`🔑 Fingerprint de clave pública: ${fingerprint}...`);
console.log('\n✅ ¡Listo! Ahora configura tu .env con:');
console.log('   JWT_ALGORITHM=RS256');
console.log('   JWT_PRIVATE_KEY_PATH=./keys/private.pem');
console.log('   JWT_PUBLIC_KEY_PATH=./keys/public.pem\n');
