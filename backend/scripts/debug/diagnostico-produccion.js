/**
 * DIAGNÓSTICO DE PRODUCCIÓN
 * =========================
 * Ejecutar en el servidor de producción para diagnosticar problemas de conexión
 * 
 * Uso: node diagnostico-produccion.js
 */

const { execSync } = require('child_process');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║          DIAGNÓSTICO DE PRODUCCIÓN - GRANJA MARI PEPA            ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// 1. Verificar rama de Git
console.log('📦 1. INFORMACIÓN DE GIT');
console.log('─'.repeat(50));
try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const lastCommitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
    const lastCommitMsg = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();

    console.log(`   Rama actual: ${branch}`);
    console.log(`   Último commit: ${commit}`);
    console.log(`   Fecha: ${lastCommitDate}`);
    console.log(`   Mensaje: ${lastCommitMsg}`);
} catch (e) {
    console.log('   ❌ Error obteniendo info de git:', e.message);
}

// 2. Verificar variables de entorno
console.log('\n⚙️  2. VARIABLES DE ENTORNO (sin valores sensibles)');
console.log('─'.repeat(50));
const envVars = [
    'DB2_DSN', 'DB2_UID', 'DB2_PWD', 'DB2_HOST', 'DB2_PORT', 'DB2_DATABASE',
    'JWT_SECRET', 'NODE_ENV', 'PORT'
];
envVars.forEach(v => {
    const value = process.env[v];
    if (v.includes('SECRET') || v.includes('PWD') || v.includes('PASSWORD')) {
        console.log(`   ${v}: ${value ? '✅ Configurado' : '❌ NO CONFIGURADO'}`);
    } else {
        console.log(`   ${v}: ${value || '❌ NO CONFIGURADO'}`);
    }
});

// 3. Probar conexión a base de datos
console.log('\n🗄️  3. CONEXIÓN A BASE DE DATOS');
console.log('─'.repeat(50));

async function testDatabase() {
    try {
        // Intentar cargar el módulo de base de datos
        const path = require('path');

        // Cargar dotenv desde la raíz del backend
        require('dotenv').config({ path: path.join(__dirname, '../../.env') });

        const odbc = require('odbc');

        const connectionString = process.env.DB2_DSN
            ? `DSN=${process.env.DB2_DSN};UID=${process.env.DB2_UID};PWD=${process.env.DB2_PWD}`
            : `Driver={IBM DB2 ODBC DRIVER};Hostname=${process.env.DB2_HOST};Port=${process.env.DB2_PORT};Database=${process.env.DB2_DATABASE};Uid=${process.env.DB2_UID};Pwd=${process.env.DB2_PWD};Protocol=TCPIP`;

        console.log('   Intentando conectar...');
        const startTime = Date.now();
        const connection = await odbc.connect(connectionString);
        const connectionTime = Date.now() - startTime;
        console.log(`   ✅ Conexión exitosa (${connectionTime}ms)`);

        // 4. Verificar tablas del schema JAVIER
        console.log('\n📋 4. VERIFICANDO TABLAS DEL SCHEMA JAVIER');
        console.log('─'.repeat(50));

        const tables = [
            'JAVIER.CUSTOMER_CREDENTIALS',
            'JAVIER.CUSTOMER_EMAILS',
            'JAVIER.CUSTOMER_PASSWORDS',
            'JAVIER.LOGIN_ATTEMPTS',
            'JAVIER.SECURITY_AUDIT',
            'JAVIER.PASSWORD_RESET_TOKENS'
        ];

        for (const table of tables) {
            try {
                const result = await connection.query(`SELECT COUNT(*) AS CNT FROM ${table}`);
                console.log(`   ✅ ${table}: ${result[0].CNT} registros`);
            } catch (e) {
                console.log(`   ❌ ${table}: ${e.message.substring(0, 50)}...`);
            }
        }

        // 5. Verificar un usuario de prueba
        console.log('\n👤 5. VERIFICANDO USUARIOS');
        console.log('─'.repeat(50));
        try {
            const users = await connection.query(`
                SELECT CUSTOMER_CODE, FULL_NAME, IS_LEGACY_PASSWORD, EMAIL 
                FROM JAVIER.CUSTOMER_CREDENTIALS 
                FETCH FIRST 5 ROWS ONLY
            `);
            console.log(`   Total usuarios encontrados: ${users.length}`);
            users.forEach(u => {
                console.log(`   - ${u.CUSTOMER_CODE}: ${u.FULL_NAME || 'Sin nombre'} (Legacy: ${u.IS_LEGACY_PASSWORD})`);
            });
        } catch (e) {
            console.log(`   ❌ Error consultando usuarios: ${e.message}`);
        }

        // 6. Verificar conexiones legacy (DSEDAC)
        console.log('\n🔗 6. VERIFICANDO SCHEMA DSEDAC (Legacy)');
        console.log('─'.repeat(50));
        try {
            const cliCount = await connection.query(`SELECT COUNT(*) AS CNT FROM DSEDAC.CLI`);
            console.log(`   ✅ DSEDAC.CLI: ${cliCount[0].CNT} registros`);
        } catch (e) {
            console.log(`   ❌ DSEDAC.CLI: ${e.message.substring(0, 50)}...`);
        }

        try {
            const clipCount = await connection.query(`SELECT COUNT(*) AS CNT FROM DSEDAC.CLIP`);
            console.log(`   ✅ DSEDAC.CLIP: ${clipCount[0].CNT} registros`);
        } catch (e) {
            console.log(`   ❌ DSEDAC.CLIP: ${e.message.substring(0, 50)}...`);
        }

        await connection.close();
        console.log('\n   ✅ Conexión cerrada correctamente');

    } catch (error) {
        console.log(`   ❌ ERROR DE CONEXIÓN: ${error.message}`);
        if (error.odbcErrors) {
            error.odbcErrors.forEach(e => {
                console.log(`      ODBC Error: State=${e.state}, Code=${e.code}`);
            });
        }
        console.log('\n   💡 POSIBLES CAUSAS:');
        console.log('      - El servidor DB2 no está accesible desde este servidor');
        console.log('      - Las credenciales son incorrectas');
        console.log('      - El firewall bloquea la conexión');
        console.log('      - El driver ODBC no está instalado');
    }
}

// 7. Info del sistema
console.log('\n💻 7. INFORMACIÓN DEL SISTEMA');
console.log('─'.repeat(50));
console.log(`   Node.js: ${process.version}`);
console.log(`   Plataforma: ${process.platform}`);
console.log(`   Arquitectura: ${process.arch}`);
console.log(`   Memoria libre: ${Math.round(require('os').freemem() / 1024 / 1024)} MB`);
console.log(`   Uptime: ${Math.round(require('os').uptime() / 3600)} horas`);

// Ejecutar tests de base de datos
testDatabase().then(() => {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    DIAGNÓSTICO COMPLETADO                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
}).catch(e => {
    console.error('Error fatal:', e);
});
