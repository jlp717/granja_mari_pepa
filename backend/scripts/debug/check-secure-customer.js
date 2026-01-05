
const odbcPool = require('../../app/config/odbcConfig');

async function checkCustomer() {
    const codigoCliente = '4300013449';
    console.log(`Checking customer ${codigoCliente}...`);

    try {
        const query = `
      SELECT *
      FROM JAVIER.CUSTOMER_CREDENTIALS
      WHERE TRIM(CUSTOMER_CODE) = ?
    `;

        // We can't use databaseService easily here if it depends on relative paths, 
        // so we use odbcPool directly
        const result = await odbcPool.query(query, [codigoCliente]);
        console.log('Result:', result);

        if (result.length > 0) {
            console.log('Customer found!');
            console.log('IS_LEGACY:', result[0].IS_LEGACY_PASSWORD);
            console.log('LAST_CHANGED:', result[0].PASSWORD_LAST_CHANGED);
        } else {
            console.log('Customer NOT found in JAVIER.CUSTOMER_CREDENTIALS');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkCustomer();
