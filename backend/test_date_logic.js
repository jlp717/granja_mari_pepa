
const db = require('./app/config/odbcConfig');

async function testDate() {
    try {
        await db.initialize();
        // Trying to construct a date from a known record or dummy values
        const sql = `
            SELECT 
                DATE(RTRIM(CHAR(ANOALTA)) || '-' || RTRIM(CHAR(MESALTA)) || '-' || RTRIM(CHAR(DIAALTA))) as FECHA_TEST 
            FROM DSEDAC.MEDL1 
            WHERE ANOALTA > 2000 AND MESALTA > 0 AND DIAALTA > 0
            FETCH FIRST 1 ROWS ONLY
        `;

        console.log("Testing Date Logic...");
        const result = await db.query(sql);
        console.log("Result:", result);
    } catch (e) {
        console.error("Date Logic Error:", e.message);

        // Fallback test: String construction
        try {
            const sql2 = `
                SELECT 
                    RTRIM(CHAR(ANOALTA)) || '-' || RIGHT('00' || RTRIM(CHAR(MESALTA)), 2) || '-' || RIGHT('00' || RTRIM(CHAR(DIAALTA)), 2) as FECHA_STR
                FROM DSEDAC.MEDL1 
                WHERE ANOALTA > 2000
                FETCH FIRST 1 ROWS ONLY
            `;
            console.log("Testing String Logic...");
            const result2 = await db.query(sql2);
            console.log("Result String:", result2);
        } catch (e2) {
            console.error("String Logic Error:", e2.message);
        }
    } finally {
        await db.close();
    }
}
testDate();
