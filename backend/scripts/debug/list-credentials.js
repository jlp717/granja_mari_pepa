require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function listCredentials() {
    console.log('Listing CUSTOMER_CREDENTIALS...');
    try {
        const query = "SELECT CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME FROM JAVIER.CUSTOMER_CREDENTIALS FETCH FIRST 20 ROWS ONLY";
        const result = await odbcPool.query(query);
        console.log('Credentials:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

listCredentials();
