const odbc = require('odbc');
require('dotenv').config();

async function checkTables() {
    const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
    try {
        const cn = await odbc.connect(connectionString);
        console.log("Connected. Listing tables in JAVIER schema...");

        // DB2 iSeries specific query for tables
        const result = await cn.query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM QSYS2.SYSTABLES 
      WHERE TABLE_SCHEMA = 'JAVIER'
    `);

        console.log("Tables found:", result);

        if (result.some(r => r.TABLE_NAME === 'CUSTOMER_CREDENTIALS')) {
            const columns = await cn.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_CREDENTIALS'
        `);
            console.log("\nColumns in CUSTOMER_CREDENTIALS:", columns);
        }

        if (result.some(r => r.TABLE_NAME === 'CUSTOMER_PASSWORDS')) {
            const columns = await cn.query(`
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH 
            FROM QSYS2.SYSCOLUMNS 
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_PASSWORDS'
        `);
            console.log("\nColumns in CUSTOMER_PASSWORDS:", columns);
        }

        await cn.close();
    } catch (err) {
        console.error(err);
    }
}

checkTables();
