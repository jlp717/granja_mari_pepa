/**
 * Script de prueba SMTP
 * Verifica la conexión y envía un email de prueba
 */

const nodemailer = require('nodemailer');

console.log('🔧 Probando configuración SMTP...\n');

// Configuración SMTP
const config = {
  host: 'mail.mari-pepa.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'noreply@mari-pepa.com',
    pass: '6pVyRf3xptxiN3i'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Modo debug para ver detalles
  logger: true // Log de transacciones
};

console.log('📧 Configuración:');
console.log(`   Host: ${config.host}`);
console.log(`   Puerto: ${config.port}`);
console.log(`   Usuario: ${config.auth.user}`);
console.log(`   Secure: ${config.secure}\n`);

const transporter = nodemailer.createTransport(config);

async function probarConexion() {
  try {
    console.log('🔄 Verificando conexión SMTP...');
    const verification = await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!\n');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión SMTP:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.code === 'ESOCKET') {
      console.error('\n💡 Posible problema:');
      console.error('   - Firewall bloqueando el puerto 587');
      console.error('   - El servidor SMTP no está accesible');
    } else if (error.code === 'EAUTH') {
      console.error('\n💡 Posible problema:');
      console.error('   - Credenciales incorrectas');
      console.error('   - Cuenta bloqueada o deshabilitada');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Posible problema:');
      console.error('   - Timeout de conexión');
      console.error('   - DNS no resuelve mail.mari-pepa.com');
    }
    
    return false;
  }
}

async function enviarEmailPrueba(destinatario) {
  try {
    console.log(`📤 Enviando email de prueba a: ${destinatario}`);
    
    const info = await transporter.sendMail({
      from: '"Granja Mari Pepa" <noreply@mari-pepa.com>',
      to: destinatario,
      subject: '🧪 Email de Prueba - Granja Mari Pepa',
      text: 'Este es un email de prueba del sistema. Si lo recibes, el SMTP está funcionando correctamente.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">✅ Email de Prueba</h2>
          <p>Este es un email de prueba del sistema <strong>Granja Mari Pepa</strong>.</p>
          <p>Si lo recibes, el servidor SMTP está funcionando correctamente.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Enviado: ${new Date().toLocaleString('es-ES')}
          </p>
        </div>
      `
    });
    
    console.log('\n✅ Email enviado exitosamente!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Accepted: ${info.accepted.join(', ')}`);
    if (info.rejected.length > 0) {
      console.log(`   Rejected: ${info.rejected.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error enviando email:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.responseCode) {
      console.error(`   Código SMTP: ${error.responseCode}`);
    }
    
    return false;
  }
}

// Ejecutar pruebas
async function main() {
  const args = process.argv.slice(2);
  const destinatario = args[0] || 'pedidos@mari-pepa.com';
  
  const conexionOk = await probarConexion();
  
  if (conexionOk && args.length > 0) {
    console.log('');
    await enviarEmailPrueba(destinatario);
  } else if (!conexionOk) {
    console.log('\n⚠️  No se pudo verificar la conexión SMTP.');
    console.log('   El envío de emails no funcionará hasta resolver este problema.');
  } else {
    console.log('\n💡 Para enviar un email de prueba ejecuta:');
    console.log('   node scripts/probar-smtp.js tu@email.com');
  }
  
  console.log('\n🏁 Prueba finalizada');
  process.exit(conexionOk ? 0 : 1);
}

main();
