require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function findJavier() {
    console.log('Searching for JAVIER or 999999...');
    try {
        const query = `
            SELECT CUSTOMER_ID, CUSTOMER_CODE, FULL_NAME 
            FROM JAVIER.CUSTOMER_CREDENTIALS 
            WHERE UPPER(FULL_NAME) LIKE '%JAVIER%' 
               OR CUSTOMER_CODE LIKE '%999999%'
        `;
        const result = await odbcPool.query(query);
        console.log('Found:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

findJavier();
