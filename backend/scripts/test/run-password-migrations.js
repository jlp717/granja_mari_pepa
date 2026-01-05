/**
 * RUN PASSWORD SECURITY MIGRATIONS
 * 
 * This script runs all necessary SQL migrations for the password security system:
 * 1. add-password-warning-dismissals.sql - Adds PASSWORD_WARNING_DISMISSALS column
 * 2. add-password-last-changed.sql - Adds PASSWORD_LAST_CHANGED column
 */

const fs = require('fs');
const path = require('path');
const databaseService = require('../../app/services/databaseService');
const logger = require('../../app/utils/logger');

const migrations = [
    {
        name: 'create-password-reset-tokens',
        file: 'create-password-reset-tokens.sql',
        description: 'Create PASSWORD_RESET_TOKENS table'
    },
    {
        name: 'add-password-warning-dismissals',
        file: 'add-password-warning-dismissals.sql',
        description: 'Add PASSWORD_WARNING_DISMISSALS column'
    },
    {
        name: 'add-password-last-changed',
        file: 'add-password-last-changed.sql',
        description: 'Add PASSWORD_LAST_CHANGED column'
    }
];

async function runMigrations() {
    try {
        logger.info('🚀 Starting password security migrations...');
        logger.info('');

        for (const migration of migrations) {
            logger.info(`📝 Running migration: ${migration.name}`);
            logger.info(`   Description: ${migration.description}`);

            // Read SQL file
            const sqlPath = path.join(__dirname, '..', 'setup', migration.file);
            
            if (!fs.existsSync(sqlPath)) {
                logger.error(`❌ Migration file not found: ${migration.file}`);
                continue;
            }

            const sqlContent = fs.readFileSync(sqlPath, 'utf8');
            
            // Remove comment lines (lines starting with --)
            const cleanedSQL = sqlContent
                .split('\n')
                .filter(line => !line.trim().startsWith('--'))
                .join('\n');
            
            // Split SQL by semicolons
            const statements = cleanedSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 10) // Ignore very short statements
                .filter(s => !s.match(/^-+$/)); // Remove separator lines

            logger.info(`   Found ${statements.length} SQL statements`);

            try {
                // Execute each statement
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i];
                    
                    // Skip comments and usage notes
                    if (statement.includes('USAGE NOTES') || 
                        statement.includes('=====================') ||
                        statement.length < 10) {
                        continue;
                    }

                    logger.info(`   Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                    
                    try {
                        await databaseService.executeQuery(statement, []);
                        logger.success(`   ✓ Statement ${i + 1} completed`);
                    } catch (stmtError) {
                        // Check if error is "column/index/table already exists"
                        const errorMessage = stmtError.message || '';
                        const odbcError = stmtError.odbcErrors?.[0]?.message || '';
                        const odbcCode = stmtError.odbcErrors?.[0]?.code;
                        
                        if (errorMessage.includes('ya existe') || 
                            errorMessage.includes('already exists') ||
                            errorMessage.includes('SQL0601') ||
                            odbcError.includes('ya existe') ||
                            odbcCode === -601) { // SQL0601 = object already exists
                            logger.warn(`   ⚠️  Already exists, skipping statement ${i + 1}`);
                        } else {
                            logger.error(`   ✗ Statement ${i + 1} failed:`, stmtError.message);
                            throw stmtError;
                        }
                    }
                }
                
                logger.success(`✅ Migration completed: ${migration.name}`);
            } catch (error) {
                logger.error(`❌ Migration failed: ${migration.name}`, error);
                throw error;
            }

            logger.info('');
        }

        logger.success('✅ All migrations completed successfully!');
        logger.info('');
        logger.info('📊 You can now:');
        logger.info('  1. Run reset-test-javier.js to reset TEST_JAVIER user');
        logger.info('  2. Test the complete password change flow');
        logger.info('');

    } catch (error) {
        logger.error('❌ Error running migrations:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Execute
runMigrations();
