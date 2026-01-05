/**
 * Test script for forgot password flow with email configuration
 * Tests both scenarios:
 * 1. User without email (TEST_JAVIER) - should prompt for email
 * 2. User with legacy email (4300009900 Diego) - should work directly
 */

const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');

async function testForgotPasswordFlow() {
    try {
        logger.info('🧪 Testing Forgot Password Flow...\n');

        // =====================================
        // TEST 1: User without email (TEST_JAVIER)
        // =====================================
        logger.info('📧 TEST 1: User without email (TEST_JAVIER)');
        logger.info('=' .repeat(50));

        // First get customer ID for TEST_JAVIER
        const getCustomerIdQuery = `
            SELECT CUSTOMER_ID 
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE TRIM(CUSTOMER_CODE) = 'TEST_JAVIER'
        `;
        const customerIds = await databaseService.executeQuery(getCustomerIdQuery, []);
        
        if (!customerIds || customerIds.length === 0) {
            logger.error('❌ TEST_JAVIER not found in CUSTOMER_CREDENTIALS');
            return;
        }
        
        const testJavierCustomerId = customerIds[0].CUSTOMER_ID;
        logger.info(`Found TEST_JAVIER with CUSTOMER_ID: ${testJavierCustomerId}`);

        // Check if TEST_JAVIER has email in JAVIER.CUSTOMER_EMAILS
        const emailQuery1 = `
            SELECT EMAIL_ADDRESS 
            FROM JAVIER.CUSTOMER_EMAILS
            WHERE CUSTOMER_ID = ?
        `;
        const emails1 = await databaseService.executeQuery(emailQuery1, [testJavierCustomerId]);
        
        if (emails1 && emails1.length > 0) {
            logger.info(`✅ Email found in JAVIER.CUSTOMER_EMAILS: ${emails1[0].EMAIL_ADDRESS}`);
        } else {
            logger.warn('⚠️ No email in JAVIER.CUSTOMER_EMAILS');
        }

        // Check if TEST_JAVIER has email in DSEDAC.CLIP
        const legacyEmailQuery1 = `
            SELECT TRIM(EMAILCONTACTO) as EMAIL
            FROM DSEDAC.CLIP
            WHERE TRIM(CODCLI) = 'TEST_JAVIER' AND TRIM(EMAILCONTACTO) != ''
        `;
        const legacyEmails1 = await databaseService.executeQuery(legacyEmailQuery1, []);
        
        if (legacyEmails1 && legacyEmails1.length > 0) {
            logger.info(`✅ Email found in DSEDAC.CLIP: ${legacyEmails1[0].EMAIL}`);
        } else {
            logger.warn('⚠️ No email in DSEDAC.CLIP');
        }

        if ((!emails1 || emails1.length === 0) && (!legacyEmails1 || legacyEmails1.length === 0)) {
            logger.success('✅ TEST 1 PASSED: TEST_JAVIER has no email - will prompt for configuration\n');
        } else {
            logger.warn('⚠️ TEST 1: TEST_JAVIER has email configured - will not prompt\n');
        }

        // =====================================
        // TEST 2: User with legacy email (4300009900)
        // =====================================
        logger.info('📧 TEST 2: User with legacy email (4300009900 - Diego)');
        logger.info('=' .repeat(50));

        // Get customer ID for 4300009900
        const getCustomerId2Query = `
            SELECT CUSTOMER_ID 
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE TRIM(CUSTOMER_CODE) = '4300009900'
        `;
        const customerIds2 = await databaseService.executeQuery(getCustomerId2Query, []);
        
        let customer9900Id = null;
        if (customerIds2 && customerIds2.length > 0) {
            customer9900Id = customerIds2[0].CUSTOMER_ID;
            logger.info(`Found 4300009900 with CUSTOMER_ID: ${customer9900Id}`);
        }

        // Check if 4300009900 has email in JAVIER.CUSTOMER_EMAILS
        if (customer9900Id) {
            const emailQuery2 = `
                SELECT EMAIL_ADDRESS 
                FROM JAVIER.CUSTOMER_EMAILS
                WHERE CUSTOMER_ID = ?
            `;
            const emails2 = await databaseService.executeQuery(emailQuery2, [customer9900Id]);
            
            if (emails2 && emails2.length > 0) {
                logger.info(`✅ Email found in JAVIER.CUSTOMER_EMAILS: ${emails2[0].EMAIL_ADDRESS}`);
            } else {
                logger.warn('⚠️ No email in JAVIER.CUSTOMER_EMAILS');
            }
        }

        // Check if 4300009900 has email in DSEDAC.CLIP
        const legacyEmailQuery2 = `
            SELECT TRIM(EMAILCONTACTO) as EMAIL
            FROM DSEDAC.CLIP
            WHERE TRIM(CODCLI) = '4300009900' AND TRIM(EMAILCONTACTO) != ''
        `;
        const legacyEmails2 = await databaseService.executeQuery(legacyEmailQuery2, []);
        
        if (legacyEmails2 && legacyEmails2.length > 0) {
            logger.info(`✅ Email found in DSEDAC.CLIP: ${legacyEmails2[0].EMAIL}`);
        } else {
            logger.warn('⚠️ No email in DSEDAC.CLIP');
        }

        if ((emails2 && emails2.length > 0) || (legacyEmails2 && legacyEmails2.length > 0)) {
            logger.success('✅ TEST 2 PASSED: 4300009900 has email - will work directly\n');
        } else {
            logger.warn('⚠️ TEST 2: 4300009900 has no email configured\n');
        }

        // =====================================
        // Summary
        // =====================================
        logger.info('\n📊 SUMMARY');
        logger.info('=' .repeat(50));
        logger.success('✅ All email checks completed');
        logger.info('\nTo test the full flow:');
        logger.info('1. Go to http://localhost:3000/area-clientes');
        logger.info('2. Click "¿Olvidaste tu contraseña?"');
        logger.info('3. For TEST_JAVIER: Should prompt for email configuration');
        logger.info('4. For 4300009900: Should directly send verification code');

    } catch (error) {
        logger.error('❌ Error testing forgot password flow:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run test
testForgotPasswordFlow();
