require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');
const bcrypt = require('bcryptjs');

async function createTestJavier() {
    console.log('Creating/Resetting TEST_JAVIER user in JAVIER.CUSTOMER_CREDENTIALS...');
    try {
        const code = 'TEST_JAVIER';
        const name = 'JAVIER (TEST CLIENTE)';
        const plainPassword = 'TEST_JAVIER';

        // Hash password for BCRYPT algorithm
        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        // 1. Check if user exists in CREDENTIALS
        const check = await odbcPool.query("SELECT CUSTOMER_ID FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_CODE = ?", [code]);

        let customerId;

        if (check.length > 0) {
            customerId = check[0].CUSTOMER_ID;
            console.log(`User exists (ID: ${customerId}). Updating...`);

            await odbcPool.query(`
                UPDATE JAVIER.CUSTOMER_CREDENTIALS
                SET PASSWORD_HASH = ?,
                    PASSWORD_ALGORITHM = 'BCRYPT',
                    IS_LEGACY_PASSWORD = '1',
                    PASSWORD_LAST_CHANGED = NULL,
                    PASSWORD_WARNING_DISMISSALS = 0,
                    ACCOUNT_STATUS = 'ACTIVE',
                    ACCOUNT_LOCKED_UNTIL = NULL,
                    FAILED_LOGIN_ATTEMPTS = 0
                WHERE CUSTOMER_ID = ?
            `, [hashedPassword, customerId]);
        } else {
            console.log('User does not exist. Creating...');
            // Check for ID 999999 availability or collision
            try {
                customerId = 999999;
                await odbcPool.query("DELETE FROM JAVIER.CUSTOMER_CREDENTIALS WHERE CUSTOMER_ID = ?", [customerId]);
            } catch (e) { }

            await odbcPool.query(`
                INSERT INTO JAVIER.CUSTOMER_CREDENTIALS 
                (CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME, PASSWORD_HASH, PASSWORD_ALGORITHM, IS_LEGACY_PASSWORD, ACCOUNT_STATUS)
                VALUES (?, ?, ?, ?, 'BCRYPT', '1', 'ACTIVE')
            `, [customerId, code, name, hashedPassword]);
        }

        console.log('✅ JAVIER.CUSTOMER_CREDENTIALS updated/inserted.');

        // 2. Clear Emails (MANDATORY REQUIREMENT)
        await odbcPool.query("DELETE FROM JAVIER.CUSTOMER_EMAILS WHERE CUSTOMER_ID = ?", [customerId]);
        console.log('✅ Cleared JAVIER.CUSTOMER_EMAILS');

        // 3. Clear DSEDAC.CLIP (Legacy email source)
        try {
            // First check if CLI exists (required for authService checks sometimes)
            const checkCli = await odbcPool.query("SELECT CODIGOCLIENTE FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?", [code]);
            if (checkCli.length === 0) {
                await odbcPool.query(`
                   INSERT INTO DSEDAC.CLI (CODIGOCLIENTE, NOMBRECLIENTE, NOFCLI, POBCLI, DOMCLI)
                   VALUES (?, ?, ?, 'TEST CITY', 'TEST ADDR')
               `, [code, name, name]);
                console.log('✅ Inserted into DSEDAC.CLI');
            }

            // Check CLIP
            const checkClip = await odbcPool.query("SELECT * FROM DSEDAC.CLIP WHERE TRIM(CODIGOCLIENTE) = ?", [code]);
            if (checkClip.length === 0) {
                await odbcPool.query(`
                   INSERT INTO DSEDAC.CLIP (CODIGOCLIENTE, EMAILCONTACTO)
                   VALUES (?, '')
               `, [code]);
            } else {
                await odbcPool.query("UPDATE DSEDAC.CLIP SET EMAILCONTACTO = '' WHERE TRIM(CODIGOCLIENTE) = ?", [code]);
            }
            console.log('✅ Cleared DSEDAC.CLIP email');

        } catch (e) {
            console.warn('⚠️ Could not fully sync legacy tables (CLI/CLIP). Login might have issues if strict joins are used.', e.message);
        }

        console.log('DONE. Test with User: TEST_JAVIER / Pwd: TEST_JAVIER');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

createTestJavier();
