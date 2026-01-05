require('dotenv').config();
const odbcPool = require('../../app/config/odbcConfig');

async function checkLegacy() {
    console.log('Checking DSEDAC.CLI...');
    try {
        const query = "SELECT * FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = 'TEST_JAVIER'";
        const result = await odbcPool.query(query);
        console.log('Result:', result);

        if (result.length === 0) {
            console.log('Attempting INSERT into DSEDAC.CLI...');
            // Minimal insert - DOMCLI excluded
            await odbcPool.query(`
                   INSERT INTO DSEDAC.CLI (CODIGOCLIENTE, NOMBRECLIENTE, NOFCLI, POBCLI)
                   VALUES ('TEST_JAVIER', 'JAVIER (TEST)', 'JAVIER (TEST)', 'TEST CITY')
               `);
            console.log('Insert successful');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkLegacy();
