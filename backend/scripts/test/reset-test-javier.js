/**
 * RESET TEST_JAVIER USER FOR TESTING
 * 
 * This script resets TEST_JAVIER user to original state:
 * - Password: TEST123 (legacy password)
 * - IS_LEGACY_PASSWORD: '1'
 * - PASSWORD_WARNING_DISMISSALS: 0
 * - PASSWORD_LAST_CHANGED: NULL
 * - ACCOUNT_STATUS: 'ACTIVE'
 * - FAILED_LOGIN_ATTEMPTS: 0
 * 
 * This allows testing the complete password change flow:
 * 1. Login with TEST123 → Legacy password warning appears
 * 2. Change password with verification code
 * 3. Try to change password again immediately → 30-day cooldown message
 */

const bcrypt = require('bcryptjs');
const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');

const CUSTOMER_CODE = 'TEST_JAVIER';
const LEGACY_PASSWORD = 'TEST123';

async function resetTestJavier() {
    try {
        logger.info('🔄 Starting TEST_JAVIER reset...');

        // 1. Get customer ID
        const getCustomerQuery = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE
            FROM JAVIER.CUSTOMER_CREDENTIALS
            WHERE TRIM(CUSTOMER_CODE) = ?
        `;
        
        const customers = await databaseService.executeQuery(getCustomerQuery, [CUSTOMER_CODE]);
        
        if (!customers || customers.length === 0) {
            logger.error(`❌ Customer ${CUSTOMER_CODE} not found in JAVIER.CUSTOMER_CREDENTIALS`);
            process.exit(1);
        }

        const customerId = customers[0].CUSTOMER_ID;
        logger.info(`✅ Found customer: ${CUSTOMER_CODE} (ID: ${customerId})`);

        // 2. Generate legacy password hash (bcrypt for TEST123)
        logger.info('🔐 Generating bcrypt hash for TEST123...');
        const legacyHash = await bcrypt.hash(LEGACY_PASSWORD, 12);
        logger.info(`✅ Hash generated: ${legacyHash.substring(0, 20)}...`);

        // 3. Reset CUSTOMER_CREDENTIALS to legacy state
        logger.info('📝 Resetting CUSTOMER_CREDENTIALS...');
        const resetCredentialsQuery = `
            UPDATE JAVIER.CUSTOMER_CREDENTIALS
            SET 
                PASSWORD_HASH = ?,
                PASSWORD_ALGORITHM = 'LEGACY',
                IS_LEGACY_PASSWORD = '1',
                PASSWORD_LAST_CHANGED = NULL,
                PASSWORD_WARNING_DISMISSALS = 0,
                ACCOUNT_STATUS = 'ACTIVE',
                FAILED_LOGIN_ATTEMPTS = 0,
                ACCOUNT_LOCKED_UNTIL = NULL,
                LAST_FAILED_LOGIN = NULL,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE CUSTOMER_ID = ?
        `;

        await databaseService.executeQuery(resetCredentialsQuery, [legacyHash, customerId]);
        logger.success('✅ CUSTOMER_CREDENTIALS reset successfully');

        // 4. Delete password history
        logger.info('🗑️ Deleting password history...');
        const deleteHistoryQuery = `
            DELETE FROM JAVIER.CUSTOMER_PASSWORDS
            WHERE CUSTOMER_ID = ?
        `;
        
        await databaseService.executeQuery(deleteHistoryQuery, [customerId]);
        logger.success('✅ Password history deleted');

        // 5. Delete any pending password reset tokens
        logger.info('🗑️ Deleting password reset tokens...');
        try {
            const deleteTokensQuery = `
                DELETE FROM JAVIER.PASSWORD_RESET_TOKENS
                WHERE CODIGO_CLIENTE = ?
            `;
            
            await databaseService.executeQuery(deleteTokensQuery, [CUSTOMER_CODE]);
            logger.success('✅ Password reset tokens deleted');
        } catch (tokenError) {
            // SQL0206 = column not found (table doesn't exist)
            // SQL0204 = table not found
            // SQL0601 = object already exists
            const errorMessage = tokenError.message || '';
            const odbcError = tokenError.odbcErrors?.[0]?.message || '';
            const odbcCode = tokenError.odbcErrors?.[0]?.code;
            
            if (errorMessage.includes('SQL0206') || 
                errorMessage.includes('SQL0204') ||
                odbcError.includes('SQL0206') ||
                odbcError.includes('SQL0204') ||
                odbcCode === -206 ||
                odbcCode === -204) {
                logger.warn('⚠️ PASSWORD_RESET_TOKENS table/column does not exist, skipping...');
            } else {
                throw tokenError;
            }
        }

        // 6. Verify final state
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

        logger.success('✅ TEST_JAVIER reset completed successfully!');
        logger.info('');
        logger.info('🎯 You can now test:');
        logger.info('  1. Login with TEST_JAVIER / TEST123');
        logger.info('  2. Legacy password warning modal should appear');
        logger.info('  3. Change password from Perfil section');
        logger.info('  4. Try to change password again → 30-day cooldown message');
        logger.info('');

    } catch (error) {
        logger.error('❌ Error resetting TEST_JAVIER:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Execute
resetTestJavier();
