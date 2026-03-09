
const db = require('../app/config/odbcConfig');
const logger = require('../app/utils/logger');

async function checkTables() {
    try {
        console.log("Initializing DB...");
        await db.initialize();
        console.log("DB Initialized.");

        const tables = [
            'JAVIER.CUSTOMER_CREDENTIALS',
            'JAVIER.LOGIN_ATTEMPTS',
            'JAVIER.REFRESH_TOKENS',
            'JAVIER.CUSTOMER_PASSWORDS',
            'JAVIER.SECURITY_AUDIT',
            'JAVIER.CUSTOMER_EMAILS'
        ];

        for (const table of tables) {
            try {
                console.log(`Checking ${table}...`);
                // Use a simple verify query provided by odbcConfig or just select 1
                await db.query(`SELECT 1 FROM ${table} FETCH FIRST 1 ROWS ONLY`);
                console.log(`✅ ${table} EXISTS`);
            } catch (error) {
                console.log(`❌ ${table} MISSING or ERROR: ${error.message}`);
            }
        }

    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        await db.close();
    }
}

checkTables();
