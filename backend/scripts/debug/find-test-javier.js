require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function findTestJavier() {
    console.log('Searching for TEST_JAVIER...');
    try {
        const query = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME, IS_LEGACY_PASSWORD
            FROM JAVIER.CUSTOMER_CREDENTIALS 
            WHERE CUSTOMER_CODE = 'TEST_JAVIER'
               OR FULL_NAME LIKE '%JAVIER%'
        `;
        const result = await odbcPool.query(query);
        console.log('Found:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findTestJavier();
