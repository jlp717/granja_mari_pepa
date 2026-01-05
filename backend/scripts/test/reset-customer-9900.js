/**
 * FIND AND RESET CUSTOMER ENDING IN 9900
 * 
 * This script:
 * 1. Finds the customer ending in 9900
 * 2. Resets their password to original state (if exists in security system)
 * 3. Clears PASSWORD_WARNING_DISMISSALS counter
 * 4. Resets all security-related fields
 */

const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');
const bcrypt = require('bcryptjs');

async function resetCustomer9900() {
    try {
        logger.info('🔍 Searching for customer ending in 9900...');

        // 1. Find customer in DSEDAC.CLI that ends with 9900
        const findCustomerQuery = `
            SELECT 
                TRIM(CODIGOCLIENTE) AS CODIGOCLIENTE,
                TRIM(NOMBRECLIENTE) AS NOMBRECLIENTE,
                TRIM(NIF) AS NIF
            FROM DSEDAC.CLI
            WHERE TRIM(CODIGOCLIENTE) LIKE '%9900'
            FETCH FIRST 1 ROW ONLY
        `;

        const customers = await databaseService.executeQuery(findCustomerQuery, []);

        if (!customers || customers.length === 0) {
            logger.error('❌ No customer found ending in 9900 in DSEDAC.CLI');
            process.exit(1);
        }

        const customerCode = customers[0].CODIGOCLIENTE;
        const customerName = customers[0].NOMBRECLIENTE;
        const customerNIF = customers[0].NIF;

        logger.info(`✅ Found customer: ${customerCode} - ${customerName}`);
        logger.info(`   NIF: ${customerNIF}`);

        // 2. Check if customer exists in JAVIER.CUSTOMER_CREDENTIALS
        const checkSecurityQuery = `
            SELECT 
                CUSTOMER_ID,
                CUSTOMER_CODE,
                PASSWORD_ALGORITHM,
                IS_LEGACY_PASSWORD,
                PASSWORD_WARNING_DISMISSALS
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE TRIM(CUSTOMER_CODE) = ?
        `;

        const securityCustomers = await databaseService.executeQuery(checkSecurityQuery, [customerCode]);

        if (!securityCustomers || securityCustomers.length === 0) {
            logger.warn(`⚠️  Customer ${customerCode} not found in security system (JAVIER.CUSTOMER_CREDENTIALS)`);
            logger.info('   This customer has not logged in to the new security system yet.');
            logger.info('   Nothing to reset.');
            process.exit(0);
        }

        const customerId = securityCustomers[0].CUSTOMER_ID;
        const currentDismissals = securityCustomers[0].PASSWORD_WARNING_DISMISSALS || 0;

        logger.info(`✅ Found in security system:`);
        logger.info(`   Customer ID: ${customerId}`);
        logger.info(`   Current dismissals: ${currentDismissals}`);
        logger.info(`   Password algorithm: ${securityCustomers[0].PASSWORD_ALGORITHM}`);
        logger.info(`   Is legacy: ${securityCustomers[0].IS_LEGACY_PASSWORD}`);

        // 3. Reset PASSWORD_WARNING_DISMISSALS to 0
        logger.info('');
        logger.info('🔄 Resetting PASSWORD_WARNING_DISMISSALS to 0...');

        const resetDismissalsQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET 
                PASSWORD_WARNING_DISMISSALS = 0,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(resetDismissalsQuery, [customerId]);
        logger.success('✅ PASSWORD_WARNING_DISMISSALS reset to 0');

        // 4. Optional: Reset to legacy password if requested
        logger.info('');
        logger.info('📝 Do you want to also reset the password to legacy? (Current state will be kept as is)');
        logger.info('   If you want to reset password too, modify this script and uncomment the section below.');

        /*
        // Uncomment this section if you want to reset password too
        logger.info('🔐 Resetting password to legacy state...');
        
        const legacyPassword = customerNIF; // Or whatever the original password was
        const legacyHash = await bcrypt.hash(legacyPassword, 12);

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
        logger.success('✅ Password reset to legacy state');

        // Delete password history
        const deleteHistoryQuery = `
            DELETE FROM JAVIER.CUSTOMER_PASSWORDS
            WHERE CUSTOMER_ID = ?
        `;
        await databaseService.executeQuery(deleteHistoryQuery, [customerId]);
        logger.success('✅ Password history deleted');
        */

        // 5. Verify final state
        logger.info('');
        logger.info('🔍 Verifying final state...');
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
            logger.info('📊 Final state:', {
                customerCode: state.CUSTOMER_CODE,
                passwordAlgorithm: state.PASSWORD_ALGORITHM,
                isLegacyPassword: state.IS_LEGACY_PASSWORD,
                passwordLastChanged: state.PASSWORD_LAST_CHANGED,
                passwordWarningDismissals: state.PASSWORD_WARNING_DISMISSALS,
                accountStatus: state.ACCOUNT_STATUS,
                failedLoginAttempts: state.FAILED_LOGIN_ATTEMPTS
            });
        }

        logger.success('');
        logger.success('✅ Customer 9900 reset completed successfully!');
        logger.info('');
        logger.info('🎯 Changes made:');
        logger.info(`  ✓ PASSWORD_WARNING_DISMISSALS: ${currentDismissals} → 0`);
        logger.info('  ✓ User will now see the legacy password warning again (if password is still legacy)');
        logger.info('');

    } catch (error) {
        logger.error('❌ Error resetting customer 9900:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Execute
resetCustomer9900();
