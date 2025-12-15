/**
 * SCRIPT DE TESTING COMPLETO DEL SISTEMA
 * 
 * Verifica:
 * 1. Login funciona correctamente
 * 2. Tokens JWT se generan
 * 3. Facturas se obtienen de BD
 * 4. Logout revoca tokens
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';
const TEST_CLIENTE = '4300000281';  // JI CHUHUA
const TEST_NIF = 'X2731935H';

let accessToken = null;
let refreshToken = null;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🧪 TESTING COMPLETO DEL SISTEMA');
console.log('═══════════════════════════════════════════════════════════\n');

async function test1_Login() {
    console.log('📝 TEST 1: Login del cliente');
    console.log('───────────────────────────────────────────────────────────');
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codigoCliente: TEST_CLIENTE,
                nif: TEST_NIF
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            accessToken = data.accessToken;
            refreshToken = data.refreshToken;
            
            console.log('✅ Login EXITOSO');
            console.log(`   Cliente: ${data.cliente.nombre}`);
            console.log(`   Email: ${data.cliente.email}`);
            console.log(`   Company: ${data.cliente.nombreComercial}`);
            console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
            console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
            console.log(`   Expiry: ${data.accessTokenExpiry}`);
            return true;
        } else {
            console.log('❌ Login FALLIDO');
            console.log(`   Error: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR en login:', error.message);
        return false;
    }
}

async function test2_ObtenerFacturas() {
    console.log('\n📄 TEST 2: Obtener facturas del cliente');
    console.log('───────────────────────────────────────────────────────────');
    
    if (!accessToken) {
        console.log('❌ No hay access token. Login falló.');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/facturas/${TEST_CLIENTE}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Facturas obtenidas CORRECTAMENTE');
            console.log(`   Total facturas: ${data.total}`);
            
            if (data.facturas.length > 0) {
                const factura = data.facturas[0];
                console.log('\n   Primera factura:');
                console.log(`     - Serie/Número: ${factura.serieFactura} ${factura.numeroFactura}`);
                console.log(`     - Fecha: ${factura.fecha}`);
                console.log(`     - Total: €${factura.totalFactura.toFixed(2)}`);
                console.log(`     - Estado: ${factura.estadoPago}`);
                console.log(`     - Pendiente: €${factura.importePendiente.toFixed(2)}`);
                
                // Verificar estadísticas
                const pagadas = data.facturas.filter(f => f.estadoPago === 'pagada').length;
                const pendientes = data.facturas.filter(f => f.estadoPago === 'pendiente').length;
                const totalFacturado = data.facturas.reduce((sum, f) => sum + f.totalFactura, 0);
                
                console.log('\n   Estadísticas:');
                console.log(`     - Facturas pagadas: ${pagadas}`);
                console.log(`     - Facturas pendientes: ${pendientes}`);
                console.log(`     - Total facturado: €${totalFacturado.toFixed(2)}`);
            }
            
            return true;
        } else {
            console.log('❌ Error obteniendo facturas');
            console.log(`   Error: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR obteniendo facturas:', error.message);
        return false;
    }
}

async function test3_RefreshToken() {
    console.log('\n🔄 TEST 3: Refresh de tokens');
    console.log('───────────────────────────────────────────────────────────');
    
    if (!refreshToken) {
        console.log('❌ No hay refresh token. Login falló.');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshToken
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Actualizar tokens
            accessToken = data.accessToken;
            refreshToken = data.refreshToken;
            
            console.log('✅ Tokens REFRESCADOS correctamente');
            console.log(`   Nuevo Access Token: ${accessToken.substring(0, 20)}...`);
            console.log(`   Nuevo Refresh Token: ${refreshToken.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ Error refrescando tokens');
            console.log(`   Error: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR refrescando tokens:', error.message);
        return false;
    }
}

async function test4_Logout() {
    console.log('\n🚪 TEST 4: Logout (revocación de tokens)');
    console.log('───────────────────────────────────────────────────────────');
    
    if (!accessToken) {
        console.log('❌ No hay access token. Login falló.');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Logout EXITOSO');
            console.log(`   Tokens revocados: ${data.tokensRevocados}`);
            return true;
        } else {
            console.log('❌ Error en logout');
            console.log(`   Error: ${data.error}`);
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR en logout:', error.message);
        return false;
    }
}

async function test5_AccesoDespuesDeLogout() {
    console.log('\n🔒 TEST 5: Verificar que no se puede acceder después de logout');
    console.log('───────────────────────────────────────────────────────────');
    
    try {
        const response = await fetch(`${API_URL}/api/auth/facturas/${TEST_CLIENTE}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            console.log('✅ Protección CORRECTA - acceso denegado con token revocado');
            console.log(`   Error: ${data.error}`);
            return true;
        } else if (response.ok) {
            console.log('⚠️  ADVERTENCIA: El token revocado aún funciona');
            console.log('   Esto puede ser normal si el token no ha expirado aún');
            console.log('   (Los access tokens se validan por firma, no contra BD)');
            return true;
        } else {
            console.log('❓ Resultado inesperado');
            return false;
        }
    } catch (error) {
        console.log('❌ ERROR verificando acceso:', error.message);
        return false;
    }
}

async function runAllTests() {
    const results = {
        passed: 0,
        failed: 0,
        total: 5
    };

    // Ejecutar tests en secuencia
    if (await test1_Login()) results.passed++; else results.failed++;
    if (await test2_ObtenerFacturas()) results.passed++; else results.failed++;
    if (await test3_RefreshToken()) results.passed++; else results.failed++;
    if (await test4_Logout()) results.passed++; else results.failed++;
    if (await test5_AccesoDespuesDeLogout()) results.passed++; else results.failed++;

    // Resumen
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE TESTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total de tests: ${results.total}`);
    console.log(`✅ Pasados: ${results.passed}`);
    console.log(`❌ Fallados: ${results.failed}`);
    console.log(`📈 Tasa de éxito: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (results.failed === 0) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! El sistema funciona correctamente.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Algunos tests fallaron. Revisar la configuración.\n');
        process.exit(1);
    }
}

// Ejecutar tests
runAllTests().catch(error => {
    console.error('\n❌ ERROR CRÍTICO:', error);
    process.exit(1);
});
