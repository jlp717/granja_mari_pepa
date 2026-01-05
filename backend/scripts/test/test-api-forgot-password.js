/**
 * Simple API test for forgot password flow
 * This simulates what the frontend will do
 */

const API_URL = 'http://localhost:5000';

async function testForgotPasswordAPI() {
    console.log('🧪 Testing Forgot Password API Flow\n');
    console.log('=' .repeat(60));

    // =====================================
    // TEST 1: Request verification code for TEST_JAVIER (no email)
    // =====================================
    console.log('\n📧 TEST 1: Request code for TEST_JAVIER (should fail - no email)');
    console.log('-' .repeat(60));

    try {
        const response1 = await fetch(`${API_URL}/api/auth/v2/solicitar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigoCliente: 'TEST_JAVIER' })
        });

        const data1 = await response1.json();
        console.log('Response:', JSON.stringify(data1, null, 2));

        if (data1.needsEmail) {
            console.log('✅ PASS: System correctly detected missing email');
        } else {
            console.log('❌ FAIL: Should have needsEmail: true');
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }

    // =====================================
    // TEST 2: Configure email for TEST_JAVIER
    // =====================================
    console.log('\n📧 TEST 2: Configure email for TEST_JAVIER');
    console.log('-' .repeat(60));

    try {
        const response2 = await fetch(`${API_URL}/api/auth/v2/configure-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                codigoCliente: 'TEST_JAVIER',
                email: 'test.javier@example.com'
            })
        });

        const data2 = await response2.json();
        console.log('Response:', JSON.stringify(data2, null, 2));

        if (data2.ok || data2.success) {
            console.log('✅ PASS: Email configured successfully');
        } else {
            console.log('❌ FAIL: Email configuration failed');
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }

    // =====================================
    // TEST 3: Request code again (should work now)
    // =====================================
    console.log('\n📧 TEST 3: Request code for TEST_JAVIER (should work now)');
    console.log('-' .repeat(60));

    try {
        const response3 = await fetch(`${API_URL}/api/auth/v2/solicitar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigoCliente: 'TEST_JAVIER' })
        });

        const data3 = await response3.json();
        console.log('Response:', JSON.stringify(data3, null, 2));

        if (data3.ok || data3.success) {
            console.log('✅ PASS: Verification code sent');
            if (data3.codigoVerificacion) {
                console.log(`🔑 DEV CODE: ${data3.codigoVerificacion}`);
            }
        } else {
            console.log('❌ FAIL: Code request failed');
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ API Tests completed');
    console.log('\nNow you can test the full flow in the browser:');
    console.log('1. Go to: http://localhost:3000/area-clientes');
    console.log('2. Click "¿Olvidaste tu contraseña?"');
    console.log('3. Enter: TEST_JAVIER');
    console.log('4. Should show email configuration prompt');
    console.log('5. Enter email and submit');
    console.log('6. Should receive verification code');
}

testForgotPasswordAPI();
