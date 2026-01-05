
const odbcPool = require('../../app/config/odbcConfig');

async function searchCustomer() {
    const searchTerm = '%JAVIER%'; // Intentaremos con JAVIER primero, luego PRUEBA si es necesario
    console.log(`Searching for customer like '${searchTerm}'...`);

    try {
        const query = `
      SELECT CODIGOCLIENTE, NOMBRECLIENTE
      FROM DSEDAC.CLI
      WHERE UPPER(NOMBRECLIENTE) LIKE ? OR UPPER(NOMBRECLIENTE) LIKE '%PRUEBA%'
    `;

        const results = await odbcPool.query(query, [searchTerm]);

        if (results.length > 0) {
            console.log('Customers found:');
            results.forEach(row => {
                console.log(`Code: ${row.CODIGOCLIENTE}, Name: ${row.NOMBRECLIENTE}`);
            });
        } else {
            console.log('No customers found matching JAVIER or PRUEBA');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

searchCustomer();
