
const db = require('../app/config/odbcConfig');

async function testInserts() {
    try {
        console.log("Initializing DB...");
        await db.initialize();

        // 1. Test SECURITY_AUDIT Insert
        console.log("\n--- TESTING INSERT: SECURITY_AUDIT ---");
        try {
            const auditQuery = `
                INSERT INTO JAVIER.SECURITY_AUDIT (
                    CUSTOMER_ID,
                    EVENT_TYPE,
                    EVENT_CATEGORY,
                    SEVERITY,
                    EVENT_DESCRIPTION,
                    IP_ADDRESS,
                    USER_AGENT,
                    RESULT
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(auditQuery, [
                0,
                'TEST_EVENT',
                'DIAGNOSIS',
                'INFO',
                'Testing insert capability',
                '127.0.0.1',
                'TestScript/1.0',
                'SUCCESS'
            ]);
            console.log("✅ INSERT JAVIER.SECURITY_AUDIT SUCCESS");
        } catch (e) {
            console.error("❌ INSERT JAVIER.SECURITY_AUDIT FAILED:", e.message);
            // console.error(e);
        }

        // 2. Test LOGIN_ATTEMPTS Insert
        console.log("\n--- TESTING INSERT: LOGIN_ATTEMPTS ---");
        try {
            const loginQuery = `
                INSERT INTO JAVIER.LOGIN_ATTEMPTS (
                    CUSTOMER_ID,
                    SUCCESS,
                    IP_ADDRESS,
                    USER_AGENT
                ) VALUES (?, ?, ?, ?)
            `;
            // Using string '1' for success as seen in authServiceSecure
            await db.query(loginQuery, [
                0,
                '1',
                '127.0.0.1',
                'TestScript/1.0'
            ]);
            console.log("✅ INSERT JAVIER.LOGIN_ATTEMPTS SUCCESS");
        } catch (e) {
            console.error("❌ INSERT JAVIER.LOGIN_ATTEMPTS FAILED:", e.message);
        }

        // 3. Test SELECT CUSTOMER_CREDENTIALS
        console.log("\n--- TESTING SELECT: CUSTOMER_CREDENTIALS ---");
        try {
            const result = await db.query("SELECT COUNT(*) AS CNT FROM JAVIER.CUSTOMER_CREDENTIALS");
            console.log("✅ SELECT JAVIER.CUSTOMER_CREDENTIALS SUCCESS. Count:", result[0].CNT);
        } catch (e) {
            console.error("❌ SELECT JAVIER.CUSTOMER_CREDENTIALS FAILED:", e.message);
        }

    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        await db.close();
    }
}

testInserts();
