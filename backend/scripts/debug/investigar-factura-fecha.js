
const odbc = require('odbc');
const dbConfig = require('../../backend/app/config/db2');

async function run() {
    let connection;
    try {
        const connectionString = `DRIVER={IBM i Access ODBC Driver};SYSTEM=${dbConfig.host};UID=${dbConfig.user};PWD=${dbConfig.password};`;
        connection = await odbc.connect(connectionString);

        // Buscar factura F-14022
        // Asumimos Serie F o Serie A. En la captura se ve "F-14022". A veces la serie es vacía o F.
        // Tambien revisamos el cliente 'BAR EL GATO'.

        // Primero buscar el cliente para confirmar ID
        const clientes = await connection.query("SELECT * FROM DSEDAC.CLI WHERE NOMBRE LIKE '%BAR EL GATO%'");
        console.log('Clientes encontrados:', clientes);

        const codigoCliente = clientes[0]?.CODIGOCLIENTE;

        if (codigoCliente) {
            const query = `
        SELECT 
            SERIEFACTURA, NUMEROFACTURA, EJERCICIOFACTURA, ANOFACTURA, MESFACTURA, DIAFACTURA, FECHAFACTURA, IMPORTETOTAL
        FROM DSEDAC.CAC 
        WHERE NUMEROFACTURA = 14022
    `;
            const result = await connection.query(query);
            console.log('Factura F-14022:', result);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
