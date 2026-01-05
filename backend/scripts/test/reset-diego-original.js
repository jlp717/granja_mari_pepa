/**
 * RESET DIEGO (4300009900) TO ORIGINAL STATE
 * 
 * This script completely resets Diego to his original state:
 * - Password: His NIF
 * - Legacy password flag: YES
 * - Password warning dismissals: 0
 * - Password last changed: NULL
 * - Delete any configured email
 * - Delete any password reset tokens
 */

const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');
const bcrypt = require('bcryptjs');

async function resetDiego() {
    try {
        logger.info('🔄 Resetting Diego (4300009900) to original state...\n');

        const customerCode = '4300009900';

        // 1. Get Diego's data from DSEDAC.CLI
        logger.info('📋 Step 1: Getting Diego data from DSEDAC.CLI...');
        const customerQuery = `
            SELECT 
                TRIM(CODIGOCLIENTE) AS CODIGOCLIENTE,
                TRIM(NOMBRECLIENTE) AS NOMBRECLIENTE,
                TRIM(NIF) AS NIF
            FROM DSEDAC.CLI
            WHERE TRIM(CODIGOCLIENTE) = ?
        `;

        const customers = await databaseService.executeQuery(customerQuery, [customerCode]);

        if (!customers || customers.length === 0) {
            logger.error('❌ Diego not found in DSEDAC.CLI');
            process.exit(1);
        }

        const customerName = customers[0].NOMBRECLIENTE;
        const customerNIF = customers[0].NIF;

        logger.success(`✅ Found: ${customerCode} - ${customerName}`);
        logger.info(`   NIF: ${customerNIF}`);

        // 2. Check if exists in security system
        logger.info('\n📋 Step 2: Checking security system...');
        const securityQuery = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE TRIM(CUSTOMER_CODE) = ?
        `;

        const securityCustomers = await databaseService.executeQuery(securityQuery, [customerCode]);

        if (!securityCustomers || securityCustomers.length === 0) {
            logger.warn('⚠️  Diego not in security system yet - nothing to reset');
            process.exit(0);
        }

        const customerId = securityCustomers[0].CUSTOMER_ID;
        logger.success(`✅ Found in security system (CUSTOMER_ID: ${customerId})`);

        // 3. Reset password to NIF (legacy state)
        logger.info('\n📋 Step 3: Resetting password to NIF (legacy)...');
        const legacyHash = await bcrypt.hash(customerNIF, 12);

        const resetPasswordQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET 
                PASSWORD_HASH = ?,
                PASSWORD_ALGORITHM = 'LEGACY',
                IS_LEGACY_PASSWORD = '1',
                PASSWORD_LAST_CHANGED = NULL,
                PASSWORD_WARNING_DISMISSALS = 0,
                ACCOUNT_STATUS = 'ACTIVE',
                FAILED_LOGIN_ATTEMPTS = 0,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(resetPasswordQuery, [legacyHash, customerId]);
        logger.success('✅ Password reset to NIF (legacy state)');

        // 4. Delete password history
        logger.info('\n📋 Step 4: Deleting password history...');
        const deleteHistoryQuery = `
            DELETE FROM JAVIER.CUSTOMER_PASSWORDS
            WHERE CUSTOMER_ID = ?
        `;
        
        await databaseService.executeQuery(deleteHistoryQuery, [customerId]);
        logger.success('✅ Password history deleted');

        // 5. Delete configured email
        logger.info('\n📋 Step 5: Deleting configured email...');
        const deleteEmailQuery = `
            DELETE FROM JAVIER.CUSTOMER_EMAILS
            WHERE CUSTOMER_ID = ?
        `;
        
        await databaseService.executeQuery(deleteEmailQuery, [customerId]);
        logger.success('✅ Configured email deleted (will use legacy email from DSEDAC.CLIP)');

        // 6. Delete any password reset tokens
        logger.info('\n📋 Step 6: Deleting password reset tokens...');
        const deleteTokensQuery = `
            DELETE FROM JAVIER.VERIFICATION_CODES
            WHERE CUSTOMER_ID = ?
        `;
        
        await databaseService.executeQuery(deleteTokensQuery, [customerId]);
        logger.success('✅ Password reset tokens deleted');

        // 7. Verify final state
        logger.info('\n📋 Step 7: Verifying final state...');
        const verifyQuery = `
            SELECT 
                CUSTOMER_CODE,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                PASSWORD_LAST_CHANGED,
                PASSWORD_WARNING_DISMISSALS,
                ACCOUNT_STATUS,
                FAILED_LOGIN_ATTEMPTS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE CUSTOMER_ID = ?
        `;

        const verification = await databaseService.executeQuery(verifyQuery, [customerId]);

        if (verification && verification.length > 0) {
            const state = verification[0];
            logger.info('\n📊 Final state:');
            logger.info(`  Customer Code: ${state.CUSTOMER_CODE}`);
            logger.info(`  Password Algorithm: ${state.PASSWORD_ALGORITHM}`);
            logger.info(`  Is Legacy Password: ${state.IS_LEGACY_PASSWORD}`);
            logger.info(`  Password Last Changed: ${state.PASSWORD_LAST_CHANGED || 'NULL'}`);
            logger.info(`  Password Warning Dismissals: ${state.PASSWORD_WARNING_DISMISSALS}`);
            logger.info(`  Account Status: ${state.ACCOUNT_STATUS}`);
            logger.info(`  Failed Login Attempts: ${state.FAILED_LOGIN_ATTEMPTS}`);
        }

        logger.success('\n✅ Diego (4300009900) has been reset to original state!');
        logger.info('\n🎯 Summary:');
        logger.info(`  ✓ Password: ${customerNIF} (his NIF)`);
        logger.info('  ✓ Legacy password: YES');
        logger.info('  ✓ Password warning dismissals: 0');
        logger.info('  ✓ Password last changed: NULL');
        logger.info('  ✓ Configured email: DELETED');
        logger.info('  ✓ Password reset tokens: DELETED');
        logger.info('\nDiego can now login with his NIF as before.');

    } catch (error) {
        logger.error('\n❌ Error resetting Diego:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Execute
resetDiego();
