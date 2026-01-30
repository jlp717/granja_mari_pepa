
const db = require('../app/config/odbcConfig');

async function fixSecurityAudit() {
    try {
        console.log("Initializing DB...");
        await db.initialize();

        // 1. Drop existing broken table
        console.log("Dropping JAVIER.SECURITY_AUDIT...");
        try {
            await db.query("DROP TABLE JAVIER.SECURITY_AUDIT");
            console.log("✅ Table dropped.");
        } catch (e) {
            console.log("⚠️ Drop failed (might not exist):", e.message);
        }

        // 2. Recreate with correct defaults and identity
        // Matching schema inferred from use in authServiceSecure.js
        console.log("Creating JAVIER.SECURITY_AUDIT...");

        const createQuery = `
            CREATE TABLE JAVIER.SECURITY_AUDIT (
                AUDIT_ID INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
                EVENT_TIME TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CUSTOMER_ID BIGINT,
                EVENT_TYPE VARCHAR(50) NOT NULL,
                EVENT_CATEGORY VARCHAR(50) DEFAULT 'GENERAL',
                SEVERITY VARCHAR(20) DEFAULT 'INFO',
                EVENT_DESCRIPTION VARCHAR(1000),
                EVENT_DATA VARCHAR(2000),
                IP_ADDRESS VARCHAR(45),
                USER_AGENT VARCHAR(512),
                SESSION_ID VARCHAR(128),
                RESULT VARCHAR(20),
                ERROR_MESSAGE VARCHAR(500),
                PRIMARY KEY (AUDIT_ID)
            )
        `;

        await db.query(createQuery);
        console.log("✅ JAVIER.SECURITY_AUDIT created successfully.");

        // 3. Verify it works immediately
        console.log("Verifying with test insert...");
        await db.query(`
            INSERT INTO JAVIER.SECURITY_AUDIT (
                CUSTOMER_ID, EVENT_TYPE, EVENT_CATEGORY, SEVERITY, EVENT_DESCRIPTION, RESULT
            ) VALUES (0, 'FIX_VERIFICATION', 'SYSTEM', 'INFO', 'Table repaired', 'SUCCESS')
        `);
        console.log("✅ Test Insert SUCCESS!");

    } catch (error) {
        console.error("❌ Critical Error repairing table:", error);
    } finally {
        await db.close();
    }
}

fixSecurityAudit();
