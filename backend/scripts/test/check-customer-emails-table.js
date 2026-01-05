/**
 * Check JAVIER.CUSTOMER_EMAILS table structure
 */

const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');

async function checkTableStructure() {
    try {
        logger.info('🔍 Checking JAVIER.CUSTOMER_EMAILS table structure...\n');

        // Check if table exists
        const checkTableQuery = `
            SELECT TABLE_NAME, TABLE_SCHEMA
            FROM QSYS2.SYSTABLES
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_EMAILS'
        `;
        
        const tables = await databaseService.executeQuery(checkTableQuery, []);
        
        if (!tables || tables.length === 0) {
            logger.error('❌ Table JAVIER.CUSTOMER_EMAILS does not exist!');
            logger.info('💡 You need to create this table first.');
            logger.info('\nCreate table SQL:');
            logger.info(`
CREATE TABLE JAVIER.CUSTOMER_EMAILS (
    CODIGO_CLIENTE VARCHAR(20) NOT NULL,
    EMAIL VARCHAR(255) NOT NULL,
    VERIFICADO CHAR(1) DEFAULT 'N',
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION TIMESTAMP,
    PRIMARY KEY (CODIGO_CLIENTE)
);
            `);
            return;
        }

        logger.success('✅ Table JAVIER.CUSTOMER_EMAILS exists');

        // Get column information
        const columnsQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, LENGTH, IS_NULLABLE
            FROM QSYS2.SYSCOLUMNS
            WHERE TABLE_SCHEMA = 'JAVIER' AND TABLE_NAME = 'CUSTOMER_EMAILS'
            ORDER BY ORDINAL_POSITION
        `;
        
        const columns = await databaseService.executeQuery(columnsQuery, []);
        
        if (columns && columns.length > 0) {
            logger.info('\n📋 Table columns:');
            logger.info('=' .repeat(80));
            columns.forEach(col => {
                logger.info(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.LENGTH ? `(${col.LENGTH})` : ''}) ${col.IS_NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'}`);
            });
        }

        // Try to select from table
        const selectQuery = `
            SELECT * FROM JAVIER.CUSTOMER_EMAILS
            FETCH FIRST 5 ROWS ONLY
        `;
        
        const rows = await databaseService.executeQuery(selectQuery, []);
        
        if (rows && rows.length > 0) {
            logger.info(`\n📊 Sample data (${rows.length} rows):`);
            logger.info('=' .repeat(80));
            rows.forEach(row => {
                logger.info(row);
            });
        } else {
            logger.info('\n📊 Table is empty (no rows)');
        }

    } catch (error) {
        logger.error('❌ Error checking table structure:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run check
checkTableStructure();
