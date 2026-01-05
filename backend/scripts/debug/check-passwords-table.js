require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function checkTable() {
    console.log('Checking JAVIER.CUSTOMER_PASSWORDS columns...');
    try {
        // Try to select just one row to see keys/columns
        const result = await odbcPool.query("SELECT * FROM JAVIER.CUSTOMER_PASSWORDS FETCH FIRST 1 ROWS ONLY");
        if (result.length > 0) {
            console.log('Columns:', Object.keys(result[0]));
        } else {
            console.log('Table is empty, cannot infer columns from data. Trying invalid select to provoke error with hints?');
            // Or just try specific common names
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkTable();
