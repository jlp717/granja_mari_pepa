
const odbcPool = require('../../app/config/odbcConfig');

async function resetTestUser() {
    const codigoCliente = '999999';
    console.log(`Resetting data for customer ${codigoCliente}...`);

    try {
        // 1. Get ID
        const idQuery = "SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE TRIM(CUSTOMER_CODE) = ?";
        const idResult = await odbcPool.query(idQuery, [codigoCliente]);

        if (idResult.length === 0) {
            console.log('Customer not found!');
            return;
        }

        const customerId = idResult[0].CUSTOMER_ID;
        console.log(`Customer ID: ${customerId}`);

        // 2. Reset Credentials
        const updateQuery = `
      UPDATE JAVIER.CUSTOMER_CREDENTIALS 
      SET IS_LEGACY_PASSWORD = '1', 
          PASSWORD_LAST_CHANGED = NULL, 
          PASSWORD_WARNING_DISMISSALS = 0,
          ACCOUNT_STATUS = 'ACTIVE',
          FAILED_LOGIN_ATTEMPTS = 0
      WHERE CUSTOMER_ID = ?
    `;
        await odbcPool.query(updateQuery, [customerId]);
        console.log('✅ Credentials reset (Legacy=1, LastChanged=NULL, Dismissals=0)');

        // 3. Clear Verification Codes
        const deleteCodesQuery = "DELETE FROM JAVIER.VERIFICATION_CODES WHERE CUSTOMER_ID = ?";
        await odbcPool.query(deleteCodesQuery, [customerId]);
        console.log('✅ Verification codes deleted');

        // 4. Verify
        const verifyQuery = "SELECT IS_LEGACY_PASSWORD, PASSWORD_LAST_CHANGED FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_ID = ?";
        const verifyResult = await odbcPool.query(verifyQuery, [customerId]);
        console.log('New State:', verifyResult[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

resetTestUser();
